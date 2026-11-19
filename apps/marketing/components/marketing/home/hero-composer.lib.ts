import { INTAKE_LIMITS, type IntakeFileSummary } from "@workspace/lib/store-builds";

/**
 * The free, instant reading of the visitor's product file in the hero
 * composer (ROADMAP.md F-82d, design §3): code only, no model. A small copy
 * of the dashboard's header guess (apps/dashboard/app/(main)/products/add/
 * from-file/from-file.lib.ts), just the name and price columns: the full
 * reader runs again in the builder after signup.
 */

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

const normalizeDigits = (text: string) =>
  text
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");

const cell = (value: unknown) => (value === null || value === undefined ? "" : String(value).trim());

/** Lower case, no spaces or marks, and the Arabic letters that are spelled either way made one. */
const headerKey = (header: string) =>
  normalizeDigits(header)
    .toLowerCase()
    .replace(/[\s_\-./:()]+/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

const NAME_WORDS = new Set([
  "name", "product", "productname", "title", "item", "itemname", "namear", "nameen", "arabicname", "englishname",
  "اسم", "الاسم", "اسمالمنتج", "المنتج", "منتج", "الصنف", "صنف", "اسمالصنف", "البيان", "الاسمبالعربي", "الاسمبالانجليزي",
]);
const PRICE_WORDS = new Set([
  "price", "sellingprice", "listprice", "regularprice", "saleprice", "finalprice",
  "السعر", "سعر", "سعرالبيع", "سعرالمنتج", "الثمن", "سعرالعرض",
]);

/** A positive price is written in the cell ("1,200 جنيه" and "EGP 350" count). */
export function hasPrice(raw: string): boolean {
  const numbers = normalizeDigits(raw).match(/\d[\d.,]*/g) ?? [];
  return numbers.some((n) => Number(n.replace(/,/g, "")) > 0);
}

export type SheetReading = IntakeFileSummary & { tooManyRows: boolean; tooManyColumns: boolean };

const HEADER_SCAN_ROWS = 15;

/**
 * Rows, rows with a product name, and named rows with no price. The header is
 * the first of the top rows with two or more cells and almost no digits; with
 * no header found, the first column is read as the name.
 */
export function readSheetRows(rawRows: readonly (readonly unknown[])[]): SheetReading {
  const rows = rawRows.map((cells) => cells.map(cell));
  const filled = (cells: readonly string[]) => cells.filter(Boolean).length;
  const width = rows.reduce((max, cells) => Math.max(max, cells.length), 0);

  const headerIndex = rows.slice(0, HEADER_SCAN_ROWS).findIndex((cells) => {
    const present = cells.filter(Boolean);
    return present.length >= 2 && present.filter((c) => !/[\d٠-٩۰-۹]/.test(c)).length / present.length >= 0.8;
  });
  const headers = headerIndex >= 0 ? rows[headerIndex]!.map((h) => h.slice(0, INTAKE_LIMITS.headerChars)) : [];
  const keys = headers.map(headerKey);
  const nameColumn = headerIndex >= 0 ? keys.findIndex((k) => NAME_WORDS.has(k)) : 0;
  const priceColumn = headerIndex >= 0 ? keys.findIndex((k) => PRICE_WORDS.has(k)) : -1;

  let count = 0;
  let valid = 0;
  let missingPrice = 0;
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const cells = rows[i]!;
    if (filled(cells) === 0) continue;
    count++;
    const name = nameColumn >= 0 ? (cells[nameColumn] ?? "") : (cells.find(Boolean) ?? "");
    if (!/\p{L}/u.test(name)) continue;
    valid++;
    if (priceColumn < 0 || !hasPrice(cells[priceColumn] ?? "")) missingPrice++;
  }

  const cap = (n: number) => Math.min(n, INTAKE_LIMITS.fileRows);
  return {
    rows: cap(count),
    valid: cap(valid),
    missingPrice: cap(missingPrice),
    headers: headers.filter(Boolean).slice(0, INTAKE_LIMITS.fileColumns),
    tooManyRows: count > INTAKE_LIMITS.fileRows,
    tooManyColumns: width > INTAKE_LIMITS.fileColumns,
  };
}

/**
 * A store link suggestion from the Latin words of the prompt ("Oud El Molouk
 * perfumes" → "oud-el"), for the signup dialog. Null when there are none.
 */
export function suggestSubdomain(prompt: string): string | null {
  const words = (prompt.match(/[a-z0-9]+/gi) ?? []).map((w) => w.toLowerCase()).filter((w) => /[a-z]/.test(w));
  if (words.length === 0) return null;
  const slug = words.slice(0, 2).join("-").slice(0, 30).replace(/-+$/, "");
  return slug.length >= 3 ? slug : null;
}

const HEX = /^#?([0-9a-f]{6})$/i;

/** "#0f766e" from what the visitor typed ("0F766E", "#0f766e"), or null. */
export function normalizeHex(value: string): string | null {
  const match = HEX.exec(value.trim());
  return match ? `#${match[1]!.toLowerCase()}` : null;
}
