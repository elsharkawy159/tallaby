import { describe, expect, it } from "vitest";
import { hasPrice, normalizeHex, readSheetRows, suggestSubdomain } from "./hero-composer.lib";

describe("readSheetRows", () => {
  it("counts products, valid names and rows missing a price", () => {
    const reading = readSheetRows([
      ["قائمة منتجات المحل"],
      ["اسم المنتج", "السعر", "الكمية"],
      ["عطر عود", "350 جنيه", "10"],
      ["عطر مسك", "", "5"],
      ["", "", ""],
      ["123", "200", "1"],
      ["بخور", "٤٥٠", "3"],
    ]);
    expect(reading).toMatchObject({ rows: 4, valid: 3, missingPrice: 1, tooManyRows: false, tooManyColumns: false });
    expect(reading.headers).toEqual(["اسم المنتج", "السعر", "الكمية"]);
  });

  it("reads English headers and flags files over the limits", () => {
    const rows: string[][] = [["Name", "Price"]];
    for (let i = 0; i < 501; i++) rows.push([`Item ${i}`, "10"]);
    const reading = readSheetRows(rows);
    expect(reading.tooManyRows).toBe(true);
    expect(reading.rows).toBe(500);
    expect(readSheetRows([Array.from({ length: 31 }, (_, i) => `h${i}`)]).tooManyColumns).toBe(true);
  });

  it("without a price column every named row misses a price", () => {
    expect(readSheetRows([["الاسم", "الوصف"], ["شنطة", "جلد"]])).toMatchObject({ rows: 1, valid: 1, missingPrice: 1 });
  });
});

describe("hasPrice", () => {
  it("finds a positive number in the cell", () => {
    expect(hasPrice("1,200 جنيه")).toBe(true);
    expect(hasPrice("EGP 350")).toBe(true);
    expect(hasPrice("٣٥٠")).toBe(true);
    expect(hasPrice("0")).toBe(false);
    expect(hasPrice("قريبًا")).toBe(false);
  });
});

describe("suggestSubdomain", () => {
  it("uses the prompt's Latin words", () => {
    expect(suggestSubdomain("متجر عطور اسمه Oud El Molouk")).toBe("oud-el");
    expect(suggestSubdomain("براند Zaki للملابس")).toBe("zaki");
    expect(suggestSubdomain("متجر عطور")).toBeNull();
    expect(suggestSubdomain("a 1")).toBeNull();
  });
});

describe("normalizeHex", () => {
  it("accepts six hex digits with or without #", () => {
    expect(normalizeHex("0F766E")).toBe("#0f766e");
    expect(normalizeHex(" #abcdef ")).toBe("#abcdef");
    expect(normalizeHex("#abc")).toBeNull();
    expect(normalizeHex("red")).toBeNull();
  });
});
