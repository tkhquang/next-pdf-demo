/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import PdfPrinter from "pdfmake";
import fsPromise from "fs/promises";
import fs from "fs";
import path from "path";

async function renderChartToImage(id: string | null) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const chartUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/charts/blood-pressure?id=${id}`;
    await page.goto(chartUrl, { waitUntil: "networkidle0" });
    await page.waitForSelector("#chart-container");

    await page.setViewport({
      height: 550,
      width: 1400,
    });

    const screenshot = await page.screenshot({ type: "png" });

    await browser.close();

    // Ensure the 'output' directory exists
    const dirPath = path.join(process.cwd(), "output");
    try {
      await fsPromise.mkdir(dirPath, { recursive: true });
    } catch (mkdirError) {
      console.error("Error creating directory:", mkdirError);
      throw mkdirError;
    }

    /**
     * Save the screenshot to the 'output' directory
     * output/chart-screenshot.png
     * */
    const filePath = path.join(dirPath, "chart-screenshot.png");
    await fsPromise.writeFile(filePath, screenshot);

    console.log(`Chart image saved at ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Error generating chart:", error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  const chartImagePath = await renderChartToImage(id);

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
        image: chartImagePath,
        width: 500,
      },
    ],
  } as any;

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  pdfDoc.pipe(fs.createWriteStream("output/document.pdf"));
  pdfDoc.end();

  const response = new NextResponse(pdfDoc as any);
  response.headers.set("Content-Type", "application/pdf");

  response.headers.set(
    "Content-Disposition",
    "attachment; filename=document.pdf"
  );
  return response;
}
