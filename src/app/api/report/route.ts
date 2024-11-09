/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import fsPromise from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import type { Browser } from "puppeteer";

const isProduction = process.env.NODE_ENV === "production";

let puppeteer: any = null;
let browser: Browser | null = null;
let executablePath: string | null = null;

// Launch or reuse the browser instance
async function getBrowserInstance(): Promise<Browser> {
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
            executablePath,
          }
        : {}),
    });
    return browser!;
  }

  console.log("Reusing existing browser instance...");
  return browser!;
}

// Render a page to a PDF
async function renderPageToPDF(url: string, pdfPath: string): Promise<void> {
  const page = await browser!.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle0" });

    if (!isProduction) {
      // Take a screenshot for debugging in development
      await page.screenshot({
        path: pdfPath.replace(".pdf", ".png"),
        fullPage: true,
      });
    }

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
    console.error(`Error rendering page at ${url} to PDF:`, error);
  } finally {
    await page.close();
  }
}

// Merge multiple PDFs into a single buffer
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

async function renderPagesToMergedPDF(
  id: string | null,
  timestamp: number
): Promise<{ dirPath: string; mergedPdfBuffer: Buffer }> {
  const dirPath = isProduction
    ? path.join("/tmp", `output/${timestamp}`)
    : `output/${timestamp}`;
  const mainPdfPath = path.join(dirPath, "main-document.pdf");
  const additionalPdfPath = path.join(dirPath, "additional-page.pdf");
  await fsPromise.mkdir(dirPath, { recursive: true });

  try {
    const mainUrl = `${process.env.NEXT_PUBLIC_BASE_URL}?id=${id}`;
    const additionalPageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/other-page`;

    await Promise.all([
      renderPageToPDF(mainUrl, mainPdfPath),
      renderPageToPDF(additionalPageUrl, additionalPdfPath),
    ]);

    const mergedPdfBuffer = await mergePDFs([mainPdfPath, additionalPdfPath]);
    return { dirPath, mergedPdfBuffer };
  } catch (error) {
    console.error("Error rendering or merging PDFs:", error);
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

  if (!puppeteer) {
    puppeteer = isProduction
      ? await import("puppeteer-core")
      : await import("puppeteer");
  }

  if (!executablePath) {
    executablePath = await chromium.executablePath();
  }

  if (!browser) {
    browser = await getBrowserInstance();
  }

  try {
    const { dirPath, mergedPdfBuffer } = await renderPagesToMergedPDF(
      id,
      timestamp
    );

    if (isProduction) {
      // Clean up temporary directory
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

// Clean up browser on process exit
const cleanupBrowser = async () => {
  if (browser) {
    await browser.close();
    browser = null;
    console.log("Browser instance closed");
  }
};

process.on("SIGINT", cleanupBrowser);
process.on("exit", cleanupBrowser);
