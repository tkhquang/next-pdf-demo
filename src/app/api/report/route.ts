/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import fsPromise from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import type { Browser } from "puppeteer";

const isProduction = process.env.NODE_ENV === "production";

let browser: Browser | null = null;

async function getBrowserInstance(puppeteer: any): Promise<Browser> {
  if (!browser) {
    console.log("Launching a new browser instance...");
    browser = await puppeteer.launch({
      args: [
        ...(isProduction ? chromium.args : []),
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--hide-scrollbars",
        "--disable-web-security",
        "--disable-extensions",
        "--disable-infobars",
        "--disable-notifications",
        "--no-first-run",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
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

  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");
    await page.pdf({
      format: "A4",
      path: pdfPath,
      printBackground: true,
      margin: {
        top: "0in",
        right: "0in",
        bottom: "0in",
        left: "0in",
      },
    });
  } catch (error) {
    console.error("Error rendering page to PDF:", error);
  } finally {
    await page.close();
  }
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
  return Buffer.from(await mergedPdf.save());
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
      const mainUrl = `${process.env.NEXT_PUBLIC_BASE_URL}?id=${id}`;
      const additionalPageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/other-page`;

      // Render pages concurrently
      await Promise.all([
        renderPageToPDF(mainUrl, mainPdfPath, puppeteer),
        renderPageToPDF(additionalPageUrl, additionalPdfPath, puppeteer),
      ]);

      const mergedPdfBuffer = await mergePDFs([mainPdfPath, additionalPdfPath]);
      return { dirPath, mergedPdfBuffer };
    } catch (error) {
      console.error("Error rendering pages or merging PDFs:", error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
        browser = null;
      }
    }
  } catch (error) {
    console.error("Error generating chart:", error);
    throw error;
  }
}

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
