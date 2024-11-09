/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import fsPromise from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import type { Browser } from "puppeteer"; // Import Browser type

const isProduction = process.env.NODE_ENV === "production";

let browser: Browser | null = null;

async function getBrowserInstance(puppeteer: any): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      args: [
        ...(isProduction ? chromium.args : []),
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
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
  }
  return browser!;
}

async function renderPageToPDF(
  url: string,
  pdfPath: string,
  puppeteer: any
): Promise<void> {
  const browser = await getBrowserInstance(puppeteer);
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle0" });

  // Take a screenshot for debugging purposes
  await page.screenshot({
    path: pdfPath.replace(".pdf", ".png"),
    fullPage: true,
  });

  // Generate the PDF with print settings
  await page.emulateMediaType("print");
  await page.pdf({
    format: "A4",
    path: pdfPath,
    printBackground: true,
  });

  await page.close();
}

async function mergePDFs(pdfPaths: string[]): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create();
  for (const pdfPath of pdfPaths) {
    const pdfBytes = await fsPromise.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(
      pdfDoc,
      pdfDoc.getPageIndices()
    );
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return Buffer.from(await mergedPdf.save()); // Convert Uint8Array to Buffer
}

async function renderPageToImage(
  id: string | null,
  timestamp: number
): Promise<{ dirPath: string; mergedPdfBuffer: Buffer }> {
  try {
    const dirPath = isProduction
      ? path.join("/tmp", `output/${timestamp}`)
      : `output/${timestamp}`;
    const mainPdfPath = path.join(dirPath, "chart-document.pdf");
    const additionalPdfPath = path.join(dirPath, "additional-page.pdf");
    await fsPromise.mkdir(dirPath, { recursive: true });

    const puppeteer = isProduction
      ? await import("puppeteer-core")
      : await import("puppeteer");

    try {
      // URLs for the main chart and additional pages
      const chartUrl = `${process.env.NEXT_PUBLIC_BASE_URL}?id=${id}`;
      const additionalPageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/other-page`;

      await Promise.all([
        renderPageToPDF(chartUrl, mainPdfPath, puppeteer),
        renderPageToPDF(additionalPageUrl, additionalPdfPath, puppeteer),
      ]);

      // Merge the PDFs
      const mergedPdfBuffer = await mergePDFs([mainPdfPath, additionalPdfPath]);

      return { dirPath, mergedPdfBuffer };
    } catch (error) {
      console.error("Error rendering pages or merging PDFs:", error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
        browser = null; // Reset for the next request
      }
    }
  } catch (error) {
    console.error("Error generating chart:", error);
    throw error;
  }
}

// For Vercel deployment
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");
  const timestamp = Date.now();

  try {
    const { dirPath, mergedPdfBuffer } = await renderPageToImage(id, timestamp);

    if (isProduction) {
      // Remove the timestamped directory after the PDF is created
      await fsPromise.rm(dirPath, { recursive: true, force: true });
    }

    const response = new NextResponse(mergedPdfBuffer);
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
