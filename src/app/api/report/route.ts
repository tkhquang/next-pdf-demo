/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import PdfPrinter from "pdfmake";
import fsPromise from "fs/promises";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { finished } from "stream";

// Convert fs.createWriteStream to a promise for better async handling
const streamFinished = promisify(finished);

async function renderChartToImage(id: string | null, timestamp: number) {
  try {
    // Use /tmp for temporary storage
    const dirPath = path.join("/tmp", `output/${timestamp}`);
    await fsPromise.mkdir(dirPath, { recursive: true });

    const browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        `https://github.com/Sparticuz/chromium/releases/download/v130.0.0/chromium-v130.0.0-pack.tar`
      ),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const chartUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/charts/blood-pressure?id=${id}`;
    await page.goto(chartUrl, { waitUntil: "networkidle0" });
    await page.waitForSelector("#chart-container");

    await page.setViewport({
      height: 550,
      width: 1400,
    });

    const screenshotPath = path.join(dirPath, "chart-screenshot.png");
    await page.screenshot({ path: screenshotPath, type: "png" });

    await browser.close();

    console.log(`Chart image saved at ${screenshotPath}`);
    return { screenshotPath, dirPath };
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
    const { screenshotPath, dirPath } = await renderChartToImage(id, timestamp);

    const fonts = {
      Roboto: {
        normal: "src/app/fonts/Roboto-Regular.ttf",
        bold: "src/app/fonts/Roboto-Medium.ttf",
        italics: "src/app/fonts/Roboto-Italic.ttf",
        bolditalics: "src/app/fonts/Roboto-MediumItalic.ttf",
      },
    };

    const printer = new PdfPrinter(fonts);
    const docDefinition = {
      content: [
        {
          image: screenshotPath,
          width: 500,
        },
      ],
    } as any;

    const pdfFilePath = path.join(dirPath, "document.pdf");
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const writeStream = fs.createWriteStream(pdfFilePath);
    pdfDoc.pipe(writeStream);
    pdfDoc.end();

    // Wait for the stream to finish writing before proceeding
    await streamFinished(writeStream);

    // Read the PDF file to send as a response
    const pdfBuffer = await fsPromise.readFile(pdfFilePath);

    // Remove the timestamped directory after the PDF is created
    await fsPromise.rm(dirPath, { recursive: true, force: true });

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
