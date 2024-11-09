/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import fsPromise from "fs/promises";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

let browser: any = null;

async function renderChartToImage(id: string | null, timestamp: number) {
  try {
    // Use /tmp for temporary storage on vercel to allow write
    const dirPath = isProduction
      ? path.join("/tmp", `output/${timestamp}`)
      : `output/${timestamp}`;

    await fsPromise.mkdir(dirPath, { recursive: true });

    const puppeteer = isProduction
      ? await import("puppeteer-core")
      : await import("puppeteer");

    try {
      browser = await puppeteer.launch({
        args: [
          ...(isProduction ? chromium.args : []),
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          // "--disable-session-crashed-bubble",
          // "--disable-accelerated-2d-canvas",
          // "--no-first-run",
          // "--no-zygote",
          // "--single-process",
          // "--noerrdialogs",
          "--disable-gpu",
          "--hide-scrollbars",
          "--disable-web-security",
        ],
        headless: true,
        ...(isProduction
          ? {
              executablePath: await chromium.executablePath(),
            }
          : {}),
      });

      const page = await browser.newPage();
      const chartUrl = `${process.env.NEXT_PUBLIC_BASE_URL}?id=${id}`;
      await page.goto(chartUrl, { waitUntil: "networkidle0" });
      // await page.waitForSelector("#chart-container");

      await page.emulateMediaType("print");

      const pdfPath = path.join(dirPath, "document.pdf");

      await page.pdf({ format: "A4", path: pdfPath });

      console.log(`pdf saved at ${pdfPath}`);
      return { dirPath, pdfPath };
    } catch (error) {
      console.error("Error launching browser:", error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    console.error("Error generating chart:", error);
    throw error;
  }
}

// For vercel deployment
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");
  const timestamp = Date.now();

  try {
    const { dirPath, pdfPath } = await renderChartToImage(id, timestamp);

    // Read the PDF file to send as a response
    const pdfBuffer = await fsPromise.readFile(pdfPath);

    if (isProduction) {
      // Remove the timestamped directory after the PDF is created
      await fsPromise.rm(dirPath, { recursive: true, force: true });
    }

    const response = new NextResponse(pdfBuffer);
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      "attachment; filename=document.pdf"
    );

    return response;
  } catch (error) {
    console.error("Error processing PDF generation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Close the browser instance when the process exits
process.on("exit", async () => {
  if (browser) {
    await browser.close();
  }
});
