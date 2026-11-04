import { describe, expect, it } from "vitest";
import {
  cleanOrderNumber,
  cleanTrackingEntries,
  cleanTrackingNumber,
  extractTrackingRows,
  isValidTrackingNumber,
  WASSALHA_TRACKING_MAX_ROWS,
} from "./wassalha-tracking.lib";

describe("extractTrackingRows", () => {
  it("reads our own export's reference column with a tracking column added", () => {
    const result = extractTrackingRows([
      ["Package_Serial", "Customer_Name", "Package_Ref. Number", "Tracking Number"],
      [1, "Sara", "ORDABC12345", "EG123456789EG"],
    ]);
    expect(result).toEqual({ ok: true, entries: [{ row: 2, orderNumber: "ORDABC12345", trackingNumber: "EG123456789EG" }] });
  });

  it("reads Arabic headers, with letter forms and spacing that differ", () => {
    const result = extractTrackingRows([
      [" رقم  الطلب ", "رقم الشحنة"],
      ["ORDABC12345", 1234567890123],
    ]);
    expect(result).toEqual({ ok: true, entries: [{ row: 2, orderNumber: "ORDABC12345", trackingNumber: "1234567890123" }] });
    expect(extractTrackingRows([["رقم الأوردر", "الباركود"], ["ORD1", "X"]]).ok).toBe(true);
  });

  it("finds the header under a title and keeps the file's line numbers", () => {
    const result = extractTrackingRows([["Wassalha results"], [], ["Order Number", "AWB"], ["ORD11111", "A1234"], [], ["ORD22222", "B1234"]]);
    expect(result).toMatchObject({ ok: true, entries: [{ row: 4 }, { row: 6 }] });
  });

  it("never takes Package_Serial as the tracking number", () => {
    expect(extractTrackingRows([["Package_Serial", "Package_Ref. Number"], [1, "ORD11111"]])).toEqual({ ok: false, error: "no_tracking_column" });
  });

  it("refuses a file it would have to guess at", () => {
    expect(extractTrackingRows([])).toEqual({ ok: false, error: "empty" });
    expect(extractTrackingRows([["", ""], [null, undefined]])).toEqual({ ok: false, error: "empty" });
    expect(extractTrackingRows([["Order Number", "Tracking"]])).toEqual({ ok: false, error: "empty" });
    expect(extractTrackingRows([["Name", "Phone"], ["Sara", "010"]])).toEqual({ ok: false, error: "no_order_column" });
    expect(extractTrackingRows([["Order Number", "Phone"], ["ORD1", "010"]])).toEqual({ ok: false, error: "no_tracking_column" });
    expect(extractTrackingRows([["Order Number", "Tracking", "Barcode"], ["ORD1", "A", "B"]])).toEqual({ ok: false, error: "ambiguous_columns" });
    expect(extractTrackingRows([["Order Number", "Reference", "Tracking"], ["ORD1", "A", "B"]])).toEqual({ ok: false, error: "ambiguous_columns" });
  });

  it("refuses a file over the limit", () => {
    const rows = [["Order", "Tracking"], ...Array.from({ length: WASSALHA_TRACKING_MAX_ROWS + 1 }, (_, i) => [`ORD${i}`, `T${i}`])];
    expect(extractTrackingRows(rows)).toEqual({ ok: false, error: "too_many" });
  });
});

describe("cleaning", () => {
  it("normalises order and tracking numbers", () => {
    expect(cleanOrderNumber(" #ord ab12‏ ")).toBe("ORDAB12");
    expect(cleanOrderNumber("ORD٠١٢٣")).toBe("ORD0123");
    expect(cleanTrackingNumber(" eg ١٢٣٤  ")).toBe("eg1234");
  });

  it("refuses what isn't a tracking number, including Excel's rounded form", () => {
    expect(isValidTrackingNumber("EG123456789EG")).toBe(true);
    expect(isValidTrackingNumber("1234567890123")).toBe(true);
    expect(isValidTrackingNumber("abc")).toBe(false);
    expect(isValidTrackingNumber("1.23E+12")).toBe(false);
    expect(isValidTrackingNumber("1.23E12")).toBe(false);
    expect(isValidTrackingNumber("<script>")).toBe(false);
    expect(isValidTrackingNumber("A".repeat(41))).toBe(false);
  });
});

describe("cleanTrackingEntries", () => {
  const row = (r: number, orderNumber: string, trackingNumber: string) => ({ row: r, orderNumber, trackingNumber });

  it("reports each row it can't use, with its line", () => {
    const { entries, problems } = cleanTrackingEntries([
      row(2, "", "T12345"),
      row(3, "ORD11111", ""),
      row(4, "a b", "T12345"),
      row(5, "ORD22222", "1.2E+12"),
      row(6, "ord33333", "t33333"),
    ]);
    expect(entries).toEqual([row(6, "ORD33333", "t33333")]);
    expect(problems.map((p) => [p.row, p.reason])).toEqual([
      [2, "missing_order_number"],
      [3, "missing_tracking"],
      [4, "bad_order_number"],
      [5, "bad_tracking"],
    ]);
  });

  it("counts a row repeated exactly once", () => {
    const { entries, problems } = cleanTrackingEntries([row(2, "ORD11111", "T11111"), row(3, "ord11111", "t11111")]);
    expect(entries).toHaveLength(1);
    expect(problems).toEqual([]);
  });

  it("refuses every row of an order with two numbers", () => {
    const { entries, problems } = cleanTrackingEntries([row(2, "ORD11111", "T11111"), row(3, "ORD11111", "T22222")]);
    expect(entries).toEqual([]);
    expect(problems.map((p) => p.reason)).toEqual(["order_repeated", "order_repeated"]);
  });

  it("refuses every row of a number on two orders, ignoring case", () => {
    const { entries, problems } = cleanTrackingEntries([row(2, "ORD11111", "T11111"), row(3, "ORD22222", "t11111"), row(4, "ORD33333", "T33333")]);
    expect(entries.map((e) => e.orderNumber)).toEqual(["ORD33333"]);
    expect(problems.map((p) => p.reason)).toEqual(["tracking_repeated", "tracking_repeated"]);
  });

  it("survives junk from the client", () => {
    const junk = [{ row: "x", orderNumber: null, trackingNumber: 5 }] as unknown as Parameters<typeof cleanTrackingEntries>[0];
    const { entries, problems } = cleanTrackingEntries(junk);
    expect(entries).toEqual([]);
    expect(problems[0]).toMatchObject({ row: 0, reason: "missing_order_number" });
  });
});
