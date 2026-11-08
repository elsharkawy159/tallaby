"use client";

import { INTAKE_LIMITS } from "@workspace/lib/store-builds";
import { dominantColorsFromPixels } from "@workspace/store-sections/logo-colors";
import { readSheetRows, type SheetReading } from "./hero-composer.lib";

/**
 * Reads the visitor's files in the browser, free and instant (ROADMAP.md
 * F-82d): SheetJS is loaded only when a sheet is attached, and the logo's
 * main colours come from a small canvas. Nothing here leaves the browser.
 */

/** A CSV from Excel on an Arabic Windows is often not UTF-8. */
function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1256").decode(buffer);
  }
}

/** The first sheet with anything in it. Formulas aren't read, only saved values. */
export async function readProductFile(file: File): Promise<SheetReading> {
  const [XLSX, buffer] = await Promise.all([import("xlsx"), file.arrayBuffer()]);
  // Enough rows to tell "over 500" apart, plus a few title lines above the header.
  const sheetRows = INTAKE_LIMITS.fileRows + 20;
  const workbook = /\.csv$/i.test(file.name)
    ? XLSX.read(decodeText(buffer), { type: "string", raw: true, sheetRows })
    : XLSX.read(buffer, { type: "array", cellFormula: false, cellHTML: false, cellStyles: false, sheetRows });

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet?.["!ref"]) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "", blankrows: false });
    const reading = readSheetRows(rows);
    if (reading.rows > 0 || reading.tooManyColumns) return reading;
  }
  return { rows: 0, valid: 0, missingPrice: 0, headers: [], tooManyRows: false, tooManyColumns: false };
}

/** Up to four main colours of the logo, as hex. Empty when the image can't be drawn. */
export async function readLogoColors(file: File): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    const size = 64;
    const scale = Math.min(1, size / Math.max(image.naturalWidth, image.naturalHeight, 1));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return [];
    context.drawImage(image, 0, 0, width, height);
    return dominantColorsFromPixels(context.getImageData(0, 0, width, height).data, { max: 4 });
  } catch {
    return [];
  } finally {
    URL.revokeObjectURL(url);
  }
}
