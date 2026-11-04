/**
 * Reads a Wassalha result file into rows of cells, in the browser (ROADMAP.md
 * F-12e). The server never parses the seller's file: it gets the two columns and
 * checks them again. SheetJS loads only when a file is chosen.
 */

export const WASSALHA_TRACKING_MAX_BYTES = 5 * 1024 * 1024;

/**
 * CSV from Excel on Arabic Windows is usually Windows-1256, not UTF-8. Fatal
 * decoding finds that out instead of showing garbled headers.
 */
function decodeCsv(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1256").decode(buffer);
  }
}

/** The first sheet with something in it, as written: nothing is converted to a number or a date. */
export async function readSpreadsheetRows(file: { name: string; arrayBuffer(): Promise<ArrayBuffer> }): Promise<unknown[][]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = /\.csv$/i.test(file.name)
    ? XLSX.read(decodeCsv(buffer), { type: "string", raw: true })
    : XLSX.read(buffer, { type: "array" });

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    // raw: a number cell stays a number, so a long tracking number keeps its digits
    // whatever format the sheet shows it in.
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, blankrows: true, defval: "" });
    if (rows.some((row) => row.some((value) => value !== ""))) return rows;
  }
  return [];
}
