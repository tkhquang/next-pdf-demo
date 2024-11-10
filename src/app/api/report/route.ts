/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import fsPromise from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import type { Browser } from "puppeteer";

const isProduction = process.env.NODE_ENV === "production";

const executablePath = await chromium.executablePath();
const puppeteer: any = isProduction
  ? await import("puppeteer-core")
  : await import("puppeteer");
let browser: Browser | null = null;
await getBrowserInstance();

const staticDir = path.join(process.cwd(), "public/static");
const staticURLPath = "/static";

const mimeTypes: Record<string, string> = {
  html: "text/html",
  js: "text/javascript",
  css: "text/css",
  png: "image/png",
  jpg: "image/jpg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
};

function getContentTypeFromPath(filePath: string): string | undefined {
  const extname = path.extname(filePath).slice(1);
  return mimeTypes[extname];
}

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
      ],
      headless: true,
      ...(isProduction
        ? {
            executablePath,
          }
        : {}),
    });
  }
  return browser!;
}

// Render a page to a PDF
async function renderPageToPDF(url: string, pdfPath: string): Promise<void> {}

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

    const browser = await getBrowserInstance();
    const page = await browser.newPage();

    // Intercept requests to serve static files
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.isInterceptResolutionHandled()) {
        return;
      }

      const requestUrl = new URL(request.url());
      const requestPath = requestUrl.pathname;
      const requestOrigin = requestUrl.origin;

      if (
        requestOrigin === process.env.NEXT_PUBLIC_BASE_URL &&
        (requestPath.startsWith(staticURLPath) ||
          requestPath.startsWith("/_next/static"))
      ) {
        let filePath;
        if (requestPath.startsWith("/_next/static")) {
          // Handle Next.js static assets
          const nextStaticDir = path.join(process.cwd(), ".next/static");
          filePath = path.join(
            nextStaticDir,
            requestPath.replace("/_next/static/", "")
          );
        } else {
          // Handle custom static assets in the public/static directory
          filePath = path.join(
            staticDir,
            requestPath.slice(staticURLPath.length)
          );
        }

        console.log(`Attempting to serve file from: ${filePath}`);

        const contentType = getContentTypeFromPath(filePath);
        let fileContent;

        if (contentType) {
          try {
            fileContent = fs.readFileSync(filePath);
            console.log(`Intercepted request for ${filePath}: Success`);
          } catch {
            console.error(`Failed to read file at ${filePath}`);
          }
        }

        if (fileContent) {
          request.respond({
            status: 200,
            contentType,
            headers: {
              "Cache-Control": "max-age=600, stale-while-revalidate=300",
            },
            body: fileContent,
          });
        } else {
          console.error(`File not found: ${filePath}`);
          request.respond({
            status: 404,
            contentType: "text/html",
            body: "File not found",
          });
        }
      } else {
        console.log(`Request passed through: ${request.url()}`);
        request.continue();
      }
    });

    try {
      await page.goto(mainUrl, { waitUntil: "networkidle0" });

      if (!isProduction) {
        await page.screenshot({
          path: mainPdfPath.replace(".pdf", ".png"),
          fullPage: true,
        });
      }

      await page.emulateMediaType("print");
      await page.pdf({
        format: "A4",
        path: mainPdfPath,
        printBackground: true,
        margin: {
          top: "0in",
          right: "0in",
          bottom: "0in",
          left: "0in",
        },
      });

      await page.emulateMediaType("screen");

      await page.click("#go-next");
      await page.waitForNavigation({ waitUntil: "networkidle0" });

      if (!isProduction) {
        await page.screenshot({
          path: additionalPdfPath.replace(".pdf", ".png"),
          fullPage: true,
        });
      }

      await page.emulateMediaType("print");
      await page.pdf({
        format: "A4",
        path: additionalPdfPath,
        printBackground: true,
        margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
      });
    } catch (error) {
      console.error(`Error rendering pages to PDF:`, error);
    } finally {
      await page.close();
    }

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
