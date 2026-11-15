"use client";

import { BULK_LIMITS, type BulkErrorCode, type MappedRow, type PdfChunkResponse } from "./from-file.dto";
import { buildSheetModel, chunkPdfPages, type SheetModel } from "./from-file.lib";

/**
 * Reads the seller's file in the browser (PLAN.md AI-3). Three reasons: a 5 MB
 * file doesn't fit a server action (1 MB) or a Vercel request (4.5 MB); SheetJS
 * 0.18.5 has unpatched advisories for crafted files (prototype pollution, ReDoS),
 * and here a bad file can only hurt its own tab; and only the short batches the
 * server re-checks ever leave the browser.
 */

export const SHEET_EXTENSIONS = [".xlsx", ".xls", ".csv", ".tsv"] as const;
export const ACCEPTED_FILE_TYPES = [...SHEET_EXTENSIONS, ".pdf"].join(",");

/** Enough to notice a file is over the limit without reading a huge sheet to its end. */
const SHEET_ROW_READ_LIMIT = 2000;

export class FileReadError extends Error {
  constructor(readonly code: Extract<BulkErrorCode, "tooLarge" | "tooManyProducts" | "pdfTooLong" | "invalid"> | "empty" | "unsupported") {
    super(code);
    this.name = "FileReadError";
  }
}

export const isPdfFile = (file: File) => /\.pdf$/i.test(file.name) || file.type === "application/pdf";

/** Size and type, before anything is read. */
export function checkPickedFile(file: File): void {
  if (file.size > BULK_LIMITS.maxFileBytes) throw new FileReadError("tooLarge");
  if (!isPdfFile(file) && !SHEET_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))) {
    throw new FileReadError("unsupported");
  }
}

/** The file's identity: the same bytes give the same key, so uploading it again finds what was added. */
export async function hashFile(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** A CSV from Excel on an Arabic Windows is often not UTF-8. */
function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1256").decode(buffer);
  }
}

export type ReadSheet = { model: SheetModel; sheetCount: number; sheetName: string };

/**
 * The first sheet with anything in it, as rows of text. Formulas are not read
 * (only the value a spreadsheet saved), and a CSV stays raw text so a code like
 * 00123 keeps its zeros. Rows are arrays, so a header can't name an object key.
 */
export async function readSheetFile(file: File, buffer: ArrayBuffer): Promise<ReadSheet> {
  const XLSX = await import("xlsx");
  const isText = /\.(csv|tsv)$/i.test(file.name);
  const workbook = isText
    ? XLSX.read(decodeText(buffer), { type: "string", raw: true, sheetRows: SHEET_ROW_READ_LIMIT })
    : XLSX.read(buffer, { type: "array", cellFormula: false, cellHTML: false, cellStyles: false, sheetRows: SHEET_ROW_READ_LIMIT });

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet?.["!ref"]) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "", blankrows: true });
    const offset = XLSX.utils.decode_range(sheet["!ref"]).s.r;
    const model = buildSheetModel(rows, offset);
    if (model.rows.length === 0) continue;
    if (model.rows.length > BULK_LIMITS.maxProducts) throw new FileReadError("tooManyProducts");
    return { model, sheetCount: workbook.SheetNames.length, sheetName: name };
  }
  throw new FileReadError("empty");
}

export type PdfProgress = { doneCalls: number; totalCalls: number };

/** One failed page batch is tried again this many times before the file gives up. */
const PDF_TRIES = 3;
const RETRYABLE: readonly BulkErrorCode[] = ["busy", "timeout", "failed", "rateLimited"];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendPdfChunk(body: FormData): Promise<PdfChunkResponse> {
  for (let attempt = 1; ; attempt++) {
    let response: PdfChunkResponse;
    try {
      const reply = await fetch("/api/ai/product-bulk-pdf", { method: "POST", body });
      response = (await reply.json()) as PdfChunkResponse;
    } catch {
      response = { ok: false, error: "failed" };
    }
    if (response.ok || !RETRYABLE.includes(response.error) || attempt >= PDF_TRIES) return response;
    await wait(2000 * attempt);
  }
}

/**
 * Splits a PDF into small page batches here, then the model reads each batch.
 * A page is billed each time it is sent, so sending the whole file with "read
 * pages 6 to 10" would pay for all 20 pages four times. Object streams are off
 * so the server can count the pages it receives.
 */
export async function readPdfRows(file: File, buffer: ArrayBuffer, onProgress: (progress: PdfProgress) => void): Promise<MappedRow[]> {
  const { PDFDocument } = await import("pdf-lib");
  let document: Awaited<ReturnType<typeof PDFDocument.load>>;
  try {
    document = await PDFDocument.load(buffer);
  } catch {
    // Damaged, or locked with a password.
    throw new FileReadError("invalid");
  }
  const totalPages = document.getPageCount();
  const chunks = chunkPdfPages(totalPages);
  if (!chunks) throw new FileReadError(totalPages === 0 ? "empty" : "pdfTooLong");

  const rows: MappedRow[] = [];
  for (const [index, { from, to }] of chunks.entries()) {
    onProgress({ doneCalls: index, totalCalls: chunks.length });
    const part = await PDFDocument.create();
    const pages = await part.copyPages(document, Array.from({ length: to - from }, (_, i) => from + i));
    for (const page of pages) part.addPage(page);
    const bytes = await part.save({ useObjectStreams: false });
    if (bytes.byteLength > BULK_LIMITS.maxPdfChunkBytes) throw new FileReadError("tooLarge");

    const body = new FormData();
    body.append("file", new File([bytes.slice()], "pages.pdf", { type: "application/pdf" }));
    body.append("from", String(from));
    body.append("to", String(to));
    body.append("totalPages", String(totalPages));
    body.append("fileBytes", String(file.size));

    const response = await sendPdfChunk(body);
    if (!response.ok) throw new PdfReadFailure(response.error);
    for (const row of response.rows) {
      rows.push({ row: rows.length + 1, ...row });
      if (rows.length > BULK_LIMITS.maxProducts) throw new FileReadError("tooManyProducts");
    }
  }
  onProgress({ doneCalls: chunks.length, totalCalls: chunks.length });
  if (rows.length === 0) throw new FileReadError("empty");
  return rows;
}

export class PdfReadFailure extends Error {
  constructor(readonly code: BulkErrorCode) {
    super(code);
    this.name = "PdfReadFailure";
  }
}
