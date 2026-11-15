import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { extractTrackingRows } from "@workspace/lib/shipping/wassalha-tracking";
import { readSpreadsheetRows } from "./wassalha-tracking-file.lib";

const asFile = (name: string, bytes: Uint8Array) => ({
  name,
  arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
});

function xlsxFile(sheets: Record<string, unknown[][]>) {
  const workbook = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
  return asFile("result.xlsx", new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xlsx" })));
}

describe("readSpreadsheetRows", () => {
  it("reads an xlsx, keeping a long number's digits", async () => {
    const rows = await readSpreadsheetRows(xlsxFile({ Sheet1: [["Package_Ref. Number", "Barcode"], ["ORDABC12345", 1234567890123]] }));
    expect(extractTrackingRows(rows)).toEqual({ ok: true, entries: [{ row: 2, orderNumber: "ORDABC12345", trackingNumber: "1234567890123" }] });
  });

  it("skips an empty first sheet", async () => {
    const rows = await readSpreadsheetRows(xlsxFile({ Empty: [], Data: [["Order", "Tracking"], ["ORD11111", "EG1"]] }));
    expect(rows[0]).toEqual(["Order", "Tracking"]);
  });

  it("reads a UTF-8 CSV with Arabic headers and a byte order mark", async () => {
    const text = "﻿رقم الطلب,رقم التتبع\nORD11111,0012345\n";
    const rows = await readSpreadsheetRows(asFile("result.csv", new TextEncoder().encode(text)));
    // Leading zeros stay: a CSV cell is never turned into a number.
    expect(extractTrackingRows(rows)).toEqual({ ok: true, entries: [{ row: 2, orderNumber: "ORD11111", trackingNumber: "0012345" }] });
  });

  it("reads a Windows-1256 CSV saved by Arabic Excel", async () => {
    // "رقم الطلب,Tracking" in Windows-1256.
    const header = [0xd1, 0xde, 0xe3, 0x20, 0xc7, 0xe1, 0xd8, 0xe1, 0xc8];
    const rest = new TextEncoder().encode(",Tracking\nORD11111,EG12345\n");
    const rows = await readSpreadsheetRows(asFile("result.csv", new Uint8Array([...header, ...rest])));
    expect(extractTrackingRows(rows)).toEqual({ ok: true, entries: [{ row: 2, orderNumber: "ORD11111", trackingNumber: "EG12345" }] });
  });

  it("returns nothing for an empty file", async () => {
    expect(await readSpreadsheetRows(asFile("result.csv", new Uint8Array()))).toEqual([]);
  });
});
