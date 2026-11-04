import slugify from "slugify";
import { normalizeHeaderKey } from "@/lib/product-import-headers";
import { paragraphsToHtml, seoDescription, seoTitle } from "../ai/ai-autofill.lib";
import { flattenCategoryTree, normalizeSearchText, suggestCategories, tokenize } from "../add-product.lib";
import type { CategoryOption } from "../add-product.schema";
import { cleanKeywords } from "../meta-keywords.lib";
import {
  BULK_CREDITS_PER_AI_PRODUCT,
  BULK_FIELDS,
  BULK_LIMITS,
  type BulkCopyOutput,
  type BulkErrorCode,
  type BulkField,
  type BulkNote,
  type BulkProblem,
  type BulkSource,
  type ColumnMapping,
  type ColumnSample,
  type MappedRow,
  type PdfRowsOutput,
} from "./from-file.dto";

/**
 * The pure parts of "add many products from a file" (PLAN.md AI-3). The browser
 * runs these to show the confirm screen; the server runs them again on every
 * row it receives, so nothing the browser computed is trusted. File contents
 * are text here, never formulas and never instructions.
 */

// ── Cells ───────────────────────────────────────────────────────────────────

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Latin digits, and the Arabic decimal (٫) and thousands (٬) signs as `.` and `,`. */
export function normalizeDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

const INVISIBLE = /[​-‏‪-‮⁦-⁩﻿]/g;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/**
 * One cell as plain text. A formula is dropped whole (it has no value of its
 * own, and may be an attack on whoever opens the sheet later). A leading `@`,
 * or `+`/`-` not followed by a number, is a spreadsheet command prefix: removed,
 * and the text kept. Invisible marks go first, so they can't hide any of this.
 */
export function cleanCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(INVISIBLE, "").replace(CONTROL, "").trim();
  if (/^\{?=/.test(text)) return "";
  const safe = text.replace(/^@+/, "").replace(/^[+-](?!\s*[\d٠-٩۰-۹.])/, "").trim();
  return safe.slice(0, BULK_LIMITS.maxCellChars);
}

const hasArabic = (text: string) => /[؀-ۿ]/.test(text);

/** The numbers written in a cell, as they are. */
const numberTokens = (text: string) => text.match(/\d[\d.,]*\d|\d/g) ?? [];

/** A minus sign directly before the first number. */
const isNegative = (text: string) => /[-−–]\s*\d/.test(text.slice(0, (text.search(/\d/) + 1) || 0));

/**
 * The number in one token as whole and decimal digits, or null when it can't be
 * told. "1,200" is thousands, "12,50" is a decimal comma and "1.200,50" is both.
 * "1.200" could be 1200 or 1.2, and guessing wrong is a price off by a thousand,
 * so it is refused and the seller sees the row.
 */
function splitNumber(token: string): { whole: string; decimals: string } | null {
  const dots = token.split(".").length - 1;
  const commas = token.split(",").length - 1;
  if (dots && commas) {
    const decimalMark = token.lastIndexOf(".") > token.lastIndexOf(",") ? "." : ",";
    const groupMark = decimalMark === "." ? "," : ".";
    if (token.split(decimalMark).length !== 2) return null;
    const [whole = "", decimals = ""] = token.split(decimalMark);
    if (!/^\d{1,3}$/.test(whole.split(groupMark)[0] ?? "") || whole.split(groupMark).slice(1).some((part) => part.length !== 3)) return null;
    return { whole: whole.split(groupMark).join(""), decimals };
  }
  if (dots > 1 || commas > 1) {
    const mark = dots > 1 ? "." : ",";
    const parts = token.split(mark);
    if (!/^\d{1,3}$/.test(parts[0] ?? "") || parts.slice(1).some((part) => part.length !== 3)) return null;
    return { whole: parts.join(""), decimals: "" };
  }
  if (commas === 1) {
    const [whole = "", part = ""] = token.split(",");
    if (part.length === 3 && whole.length <= 3) return { whole: whole + part, decimals: "" };
    return part.length <= 2 ? { whole, decimals: part } : null;
  }
  if (dots === 1) {
    const [whole = "", part = ""] = token.split(".");
    if (part.length === 3) return null;
    return { whole, decimals: part };
  }
  return { whole: token, decimals: "" };
}

/**
 * A price cell in integer piastres (rule 7), or null when it is not one clear
 * positive price: no number, two numbers ("100 - 200", "2 for 100"), negative,
 * zero, or over the limit. Words around it ("1,200 جنيه", "EGP 350") are fine.
 */
export function parsePriceToPiastres(raw: string): number | null {
  const text = normalizeDigits(raw);
  const tokens = numberTokens(text);
  if (tokens.length !== 1 || isNegative(text)) return null;
  const parts = splitNumber(tokens[0]!);
  if (!parts) return null;
  const decimals = parts.decimals.padEnd(3, "0");
  const piastres = Number(parts.whole) * 100 + Number(decimals.slice(0, 2)) + (Number(decimals[2]) >= 5 ? 1 : 0);
  if (!Number.isSafeInteger(piastres) || piastres <= 0 || piastres > BULK_LIMITS.maxPrice * 100) return null;
  return piastres;
}

/** A stock cell as a whole number, or null when it is not one clear count. */
export function parseStock(raw: string): number | null {
  const text = normalizeDigits(raw);
  const tokens = numberTokens(text);
  if (tokens.length !== 1 || isNegative(text)) return null;
  const parts = splitNumber(tokens[0]!);
  if (!parts || /[1-9]/.test(parts.decimals)) return null;
  const stock = Number(parts.whole);
  return Number.isSafeInteger(stock) && stock <= BULK_LIMITS.maxStock ? stock : null;
}

// ── Sheets ──────────────────────────────────────────────────────────────────

export type SheetRow = { row: number; cells: string[] };
export type SheetModel = { headers: string[]; rows: SheetRow[] };

const HEADER_SCAN_ROWS = 15;

/**
 * Finds the header: title lines above it have too few cells, and a header has
 * almost no digits. A file with no header at all keeps its first line as data.
 * `rowOffset` is where the sheet starts, so row numbers match what the seller sees.
 */
export function buildSheetModel(rawRows: readonly (readonly unknown[])[], rowOffset = 0): SheetModel {
  const clean = rawRows.map((cells) => cells.map(cleanCell));
  const filled = (cells: readonly string[]) => cells.filter(Boolean).length;
  const width = Math.min(BULK_LIMITS.maxColumns, clean.reduce((max, cells) => Math.max(max, cells.length), 0));
  const scan = clean.slice(0, HEADER_SCAN_ROWS);
  const widest = scan.reduce((max, cells) => Math.max(max, filled(cells)), 0);
  const looksFull = (cells: readonly string[]) => filled(cells) >= Math.max(2, Math.ceil(widest * 0.6));

  const firstFull = scan.findIndex(looksFull);
  const start = firstFull >= 0 ? firstFull : clean.findIndex((cells) => filled(cells) > 0);
  const candidate = start >= 0 ? clean[start]! : [];
  const present = candidate.filter(Boolean);
  const noDigits = present.filter((cell) => !/[\d٠-٩۰-۹]/.test(cell)).length;
  const isHeader = present.length >= 2 && noDigits / present.length >= 0.8;

  const pad = (cells: readonly string[]) => Array.from({ length: width }, (_, i) => cells[i] ?? "");
  const headers = isHeader ? pad(candidate).map((h) => h.slice(0, BULK_LIMITS.maxHeaderChars)) : pad([]);
  const firstData = start < 0 ? clean.length : isHeader ? start + 1 : start;

  const rows: SheetRow[] = [];
  for (let i = firstData; i < clean.length; i++) {
    const cells = clean[i]!;
    if (filled(cells) === 0) continue;
    rows.push({ row: i + rowOffset + 1, cells: pad(cells) });
  }
  return { headers, rows };
}

/** What the mapping call reads: each header and its first few values, cut short. */
export function columnSamples(model: SheetModel): ColumnSample[] {
  return model.headers.map((header, index) => {
    const samples: string[] = [];
    for (const { cells } of model.rows) {
      if (samples.length >= BULK_LIMITS.samplesPerColumn) break;
      const value = cells[index];
      if (value) samples.push(value.replace(/\s+/g, " ").slice(0, BULK_LIMITS.maxSampleChars));
    }
    return { index, header, samples };
  });
}

// ── Mapping ─────────────────────────────────────────────────────────────────

export const emptyMapping = (): ColumnMapping =>
  Object.fromEntries(BULK_FIELDS.map((field) => [field, null])) as ColumnMapping;

/** Keeps indexes that exist; a column used by an earlier field is not used twice. */
export function cleanMapping(raw: Partial<Record<BulkField, unknown>>, columnCount: number): ColumnMapping {
  const mapping = emptyMapping();
  const used = new Set<number>();
  for (const field of BULK_FIELDS) {
    const value = raw[field];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value >= columnCount || used.has(value)) continue;
    mapping[field] = value;
    used.add(value);
  }
  return mapping;
}

/** Headers of our own sheet (`PRODUCT_EXCEL_COLUMNS`), normalized by `normalizeHeaderKey`. */
const TEMPLATE_FIELDS: Partial<Record<string, BulkField>> = {
  title: "name",
  sku: "sku",
  description: "description",
  category: "category",
  brand: "brand",
  quantity: "stock",
  listprice: "price",
  finalprice: "salePrice",
  images: "images",
};
const TEMPLATE_REQUIRED = ["title", "sku", "description", "category", "brand", "quantity", "baseprice", "listprice", "finalprice", "images", "condition", "isactive"];

/** The mapping of a file in our own template; null for any other file. */
export function templateMapping(headers: readonly string[]): ColumnMapping | null {
  const keys = headers.map(normalizeHeaderKey);
  if (!TEMPLATE_REQUIRED.every((key) => keys.includes(key))) return null;
  const raw: Partial<Record<BulkField, number>> = {};
  keys.forEach((key, index) => {
    const field = TEMPLATE_FIELDS[key];
    if (field && raw[field] === undefined) raw[field] = index;
  });
  return cleanMapping(raw, headers.length);
}

/** Lower case, no spaces or marks, and the Arabic letters that are spelled either way made one. */
const headerKey = (header: string) =>
  normalizeDigits(header)
    .toLowerCase()
    .replace(/[\s_\-./:()]+/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

const HEADER_WORDS: Record<BulkField, readonly string[]> = {
  name: ["name", "product", "productname", "title", "item", "itemname", "اسم", "الاسم", "اسمالمنتج", "المنتج", "منتج", "الصنف", "صنف", "اسمالصنف", "البيان"],
  nameAr: ["namear", "arabicname", "titlear", "الاسمبالعربي", "الاسمعربي", "اسمعربي", "الاسمالعربي"],
  nameEn: ["nameen", "englishname", "titleen", "الاسمبالانجليزي", "الاسمانجليزي", "اسمانجليزي", "الاسمالانجليزي"],
  description: ["description", "desc", "details", "الوصف", "وصف", "التفاصيل", "وصفالمنتج"],
  descriptionAr: ["descriptionar", "arabicdescription", "الوصفبالعربي", "وصفعربي", "الوصفالعربي"],
  descriptionEn: ["descriptionen", "englishdescription", "الوصفبالانجليزي", "وصفانجليزي", "الوصفالانجليزي"],
  price: ["price", "sellingprice", "listprice", "regularprice", "السعر", "سعر", "سعرالبيع", "سعرالمنتج", "الثمن"],
  salePrice: ["saleprice", "offerprice", "discountprice", "finalprice", "سعرالعرض", "السعربعدالخصم", "سعرالخصم", "العرض"],
  cost: ["cost", "costprice", "purchaseprice", "wholesale", "wholesaleprice", "التكلفه", "سعرالتكلفه", "سعرالشراء", "سعرالجمله", "جمله"],
  stock: ["stock", "quantity", "qty", "inventory", "available", "الكميه", "كميه", "المخزون", "العدد", "المتوفر"],
  sku: ["sku", "code", "itemcode", "productcode", "barcode", "الكود", "كود", "الباركود", "باركود", "كودالمنتج", "رقمالصنف"],
  category: ["category", "department", "type", "producttype", "القسم", "قسم", "الفئه", "فئه", "التصنيف", "النوع"],
  brand: ["brand", "manufacturer", "الماركه", "ماركه", "البراند", "العلامهالتجاريه", "الشركه"],
  images: ["image", "images", "imageurl", "imageurls", "photo", "photos", "picture", "pictures", "الصوره", "الصور", "صوره", "صور", "رابطالصوره", "روابطالصور", "لينكالصوره"],
  colors: ["color", "colors", "colour", "colours", "اللون", "الالوان", "لون"],
  sizes: ["size", "sizes", "المقاس", "المقاسات", "مقاس", "الحجم"],
};

const FIELD_BY_WORD = new Map<string, BulkField>(
  (Object.entries(HEADER_WORDS) as [BulkField, readonly string[]][]).flatMap(([field, words]) => words.map((word) => [word, field] as const)),
);

/** Common headers in Arabic and English, read in code (docs/ai.md: the code does what it can). */
export function guessMapping(headers: readonly string[]): ColumnMapping {
  const raw: Partial<Record<BulkField, number>> = {};
  headers.forEach((header, index) => {
    const field = FIELD_BY_WORD.get(headerKey(header));
    if (field && raw[field] === undefined) raw[field] = index;
  });
  return cleanMapping(raw, headers.length);
}

/** Every header is one we know, and the name and price are among them: no AI needed. */
export function mappingIsConfident(headers: readonly string[], mapping: ColumnMapping): boolean {
  const known = headers.filter(Boolean).every((header) => FIELD_BY_WORD.has(headerKey(header)));
  const hasName = mapping.name !== null || mapping.nameAr !== null || mapping.nameEn !== null;
  return known && hasName && mapping.price !== null;
}

/** Every row through the mapping; rows the mapping finds nothing in are left out. */
export function applyMapping(model: SheetModel, mapping: ColumnMapping): MappedRow[] {
  const rows: MappedRow[] = [];
  for (const { row, cells } of model.rows) {
    const mapped: MappedRow = { row };
    let any = false;
    for (const field of BULK_FIELDS) {
      const column = mapping[field];
      const value = column === null ? "" : (cells[column] ?? "");
      if (value) {
        mapped[field] = value;
        any = true;
      }
    }
    if (any) rows.push(mapped);
  }
  return rows;
}

// ── Rows ────────────────────────────────────────────────────────────────────

export type ValidRow = {
  row: number;
  name: { ar: string | null; en: string | null };
  description: { ar: string | null; en: string | null };
  listPiastres: number;
  salePiastres: number | null;
  /** null: the file gave no usable count. */
  stock: number | null;
  sku: string | null;
  category: string | null;
  brand: string | null;
  images: string[];
  colors: string[];
  sizes: string[];
  notes: BulkNote[];
  /** A cell doesn't look like product data (`looksLikeProductName`): no AI, kept as written, saved as a draft. */
  flagged: boolean;
};

export type RowCheck = { ok: true; value: ValidRow } | { ok: false; row: number; problem: BulkProblem };

const TITLE_MAX = 200;
/** Anything longer is a sentence or a pasted paragraph. Marketplace titles run long, so this is generous. */
const MAX_NAME_WORDS = 30;
const HAS_LINK = /\b(?:https?:\/\/|www\.)\S+/i;
/** Words that give orders rather than describe a product. A false alarm only costs a draft. */
const INSTRUCTION = /\b(?:ignore|disregard|bypass|override|jailbreak|system prompt|you are now|previous instructions)\b|تجاهل|التعليمات السابقة|القواعد السابقة/i;

/**
 * Whether a name looks like a product. Given a name that isn't one, the model
 * filled the gap from the next row ("Headscarf" for an order to change the price;
 * live, 2026-11-04), so such a row never reaches the model.
 */
export function looksLikeProductName(name: string): boolean {
  if (!/\p{L}/u.test(name) || HAS_LINK.test(name) || INSTRUCTION.test(name)) return false;
  return name.trim().split(/\s+/).length <= MAX_NAME_WORDS;
}
const TAXONOMY_NAME_MAX = 80;

const lineOf = (text: string, max: number) => text.replace(/\s+/g, " ").trim().slice(0, max).trim();

/** A language-less column goes to the language it is written in; a column with its own language wins. */
function byLanguage(own: { ar: string; en: string }, any: string): { ar: string | null; en: string | null } {
  const ar = own.ar || (any && hasArabic(any) ? any : "");
  const en = own.en || (any && !hasArabic(any) ? any : "");
  return { ar: ar || null, en: en || null };
}

const splitList = (text: string) => [...new Set(text.split(/[,،;/|\n]+/).map((value) => value.trim()).filter(Boolean))];

/** Public https photo links only, without repeats, capped; other links are counted as dropped. */
export function splitImageLinks(text: string): { https: string[]; dropped: number } {
  const https: string[] = [];
  let dropped = 0;
  for (const token of text.split(/[\s,;|،]+/).filter(Boolean)) {
    try {
      const url = new URL(token);
      if (url.protocol === "https:" && !url.username && !url.password) {
        if (!https.includes(url.href)) https.push(url.href);
      } else dropped++;
    } catch {
      dropped++;
    }
  }
  return { https: https.slice(0, BULK_LIMITS.maxImagesPerProduct), dropped };
}

/** One row checked in code. Everything is cleaned again here, since the browser's word counts for nothing. */
export function validateRow(input: MappedRow): RowCheck {
  const text = (field: BulkField) => cleanCell(input[field]);
  const fail = (problem: BulkProblem): RowCheck => ({ ok: false, row: input.row, problem });

  const nameCell = (field: BulkField) => lineOf(text(field), TITLE_MAX);
  const names = byLanguage({ ar: nameCell("nameAr"), en: nameCell("nameEn") }, nameCell("name"));
  if (!names.ar && !names.en) return fail("noName");

  const priceCell = text("price");
  const saleCell = text("salePrice");
  if (!priceCell && !saleCell) return fail("noPrice");
  const notes: BulkNote[] = [];
  const list = parsePriceToPiastres(priceCell || saleCell);
  if (list === null) return fail("badPrice");
  let sale: number | null = null;
  if (priceCell && saleCell) {
    sale = parsePriceToPiastres(saleCell);
    // Equal is just "no sale" (our own export writes the price in both columns).
    if (sale !== list && (sale === null || sale > list)) notes.push("saleIgnored");
    if (sale === null || sale >= list) sale = null;
  }

  const sku = text("sku");
  if (sku.length > BULK_LIMITS.maxSkuLength) return fail("badSku");

  const links = splitImageLinks(text("images"));
  if (links.dropped > 0) notes.push("imageNotHttps");

  // Every other cell the prompt would carry is held to the same rule about orders.
  const flagged =
    [names.ar, names.en].some((name) => name !== null && !looksLikeProductName(name)) ||
    (["description", "descriptionAr", "descriptionEn", "category", "brand", "colors", "sizes"] as const).some((field) => INSTRUCTION.test(text(field)));
  if (flagged) notes.push("checkName");

  return {
    ok: true,
    value: {
      row: input.row,
      name: names,
      description: byLanguage({ ar: text("descriptionAr"), en: text("descriptionEn") }, text("description")),
      listPiastres: list,
      salePiastres: sale,
      stock: parseStock(text("stock")),
      sku: sku || null,
      category: lineOf(text("category").split(">").pop() ?? "", TAXONOMY_NAME_MAX) || null,
      brand: lineOf(text("brand"), TAXONOMY_NAME_MAX) || null,
      images: links.https,
      colors: splitList(text("colors")),
      sizes: splitList(text("sizes")),
      notes,
      flagged,
    },
  };
}

/** Shorter than this is not a description a shopper can use, so AI writes one. */
const GOOD_DESCRIPTION_CHARS = 30;
const GOOD_NAME_CHARS = 2;

const isGoodDescription = (text: string | null) => (text?.length ?? 0) >= GOOD_DESCRIPTION_CHARS;

/** Rows with a good name and description in both languages use no AI (and no credit), and neither do flagged rows. */
export function needsAiCopy(row: ValidRow): boolean {
  if (row.flagged) return false;
  const good = (name: string | null, description: string | null) =>
    (name?.length ?? 0) >= GOOD_NAME_CHARS && isGoodDescription(description);
  return !(good(row.name.ar, row.description.ar) && good(row.name.en, row.description.en));
}

export const estimateCredits = (rows: readonly ValidRow[]) => rows.filter(needsAiCopy).length * BULK_CREDITS_PER_AI_PRODUCT;

/** Would be saved as a draft even if everything goes well. The category can add more; only the server knows the categories. */
export const willBeDraft = (row: ValidRow) => row.images.length === 0 || row.stock === null || row.flagged;

export type RowsSummary = {
  found: number;
  ready: ValidRow[];
  problems: { row: number; problem: BulkProblem }[];
  drafts: number;
};

/** The confirm screen's numbers. Rows the file repeats are problems here, so nothing is added twice. */
export function summarizeRows(rows: readonly MappedRow[]): RowsSummary {
  const ready: ValidRow[] = [];
  const problems: RowsSummary["problems"] = [];
  const skus = new Set<string>();
  const seen = new Set<string>();
  for (const input of rows) {
    const check = validateRow(input);
    if (!check.ok) {
      problems.push({ row: check.row, problem: check.problem });
      continue;
    }
    const row = check.value;
    const skuKey = row.sku?.toLowerCase();
    if (skuKey && skus.has(skuKey)) {
      problems.push({ row: row.row, problem: "duplicateSku" });
      continue;
    }
    const rowKey = JSON.stringify([row.name.ar, row.name.en, row.listPiastres, row.colors, row.sizes]);
    if (seen.has(rowKey)) {
      problems.push({ row: row.row, problem: "duplicateRow" });
      continue;
    }
    if (skuKey) skus.add(skuKey);
    seen.add(rowKey);
    ready.push(row);
  }
  return { found: rows.length, ready, problems, drafts: ready.filter(willBeDraft).length };
}

const COLOR_OR_SIZE_WORDS = new Set([
  "red", "blue", "green", "black", "white", "yellow", "pink", "grey", "gray", "brown", "beige", "navy", "orange", "purple", "gold", "silver", "color", "colour",
  "xs", "s", "m", "l", "xl", "xxl", "xxxl", "small", "medium", "large", "size",
  "أحمر", "احمر", "أزرق", "ازرق", "أخضر", "اخضر", "أسود", "اسود", "أبيض", "ابيض", "أصفر", "اصفر", "بني", "رمادي", "بيج", "كحلي", "وردي", "برتقالي", "بنفسجي", "ذهبي", "فضي", "لون", "اللون",
  "صغير", "وسط", "كبير", "مقاس", "المقاس",
]);

/**
 * Rows that look like one product per color or size, for a warning: nothing is
 * merged, they become separate products. Same name once color and size words and
 * bare size numbers are gone. Only a hint, so it may also catch two real products.
 */
export function countVariantLikeRows(rows: readonly ValidRow[]): number {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const words = normalizeDigits(row.name.ar ?? row.name.en ?? "")
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word && !COLOR_OR_SIZE_WORDS.has(word) && !/^\d{2,3}$/.test(word));
    if (words.length === 0) continue;
    const key = words.join(" ");
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return [...groups.values()].filter((total) => total > 1).reduce((sum, total) => sum + total, 0);
}

/** Rows that need no AI go first: running out of credits never holds them back. */
export function orderForRun(rows: readonly MappedRow[]): MappedRow[] {
  const free: MappedRow[] = [];
  const paid: MappedRow[] = [];
  for (const row of rows) {
    const check = validateRow(row);
    (check.ok && needsAiCopy(check.value) ? paid : free).push(row);
  }
  return [...free, ...paid];
}

function shortHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).toUpperCase();
}

/**
 * The SKU a row is saved under, which is also what makes adding idempotent: the
 * database allows one product per seller and SKU (`unique_product_seller_sku_idx`),
 * so a retry, a double click or the same file uploaded again can't make a second
 * product, with no migration. A row with its own SKU uses it. A sheet row is
 * keyed by file and row number; a PDF row by file and product, since a second
 * reading can list products in another order.
 */
export function importSku(fileKey: string, source: BulkSource, row: ValidRow): string {
  if (row.sku) return row.sku;
  const ref = source === "pdf" ? shortHash(JSON.stringify([row.name.ar, row.name.en, row.listPiastres])) : String(row.row);
  return `IMP-${fileKey.slice(0, 10).toUpperCase()}-${ref}`;
}

// ── Limits ──────────────────────────────────────────────────────────────────

/** The file-level limits, on what the browser declares (the batches are capped on their own). */
export function checkDeclaredFile(file: { fileBytes: number; totalRows: number }): Extract<BulkErrorCode, "tooLarge" | "tooManyProducts"> | null {
  if (file.fileBytes > BULK_LIMITS.maxFileBytes) return "tooLarge";
  if (file.totalRows > BULK_LIMITS.maxProducts) return "tooManyProducts";
  return null;
}

/** Page ranges (from inclusive, to exclusive) for a PDF, or null when the page count is not allowed. */
export function chunkPdfPages(totalPages: number): { from: number; to: number }[] | null {
  if (totalPages < 1 || totalPages > BULK_LIMITS.maxPdfPages) return null;
  const chunks: { from: number; to: number }[] = [];
  for (let from = 0; from < totalPages; from += BULK_LIMITS.pdfPagesPerCall) {
    chunks.push({ from, to: Math.min(totalPages, from + BULK_LIMITS.pdfPagesPerCall) });
  }
  return chunks;
}

// ── After the model ─────────────────────────────────────────────────────────

/** What the model read from a PDF is untrusted like any cell: cleaned the same, and capped. */
export function cleanPdfRows(output: PdfRowsOutput): Omit<MappedRow, "row">[] {
  const rows: Omit<MappedRow, "row">[] = [];
  for (const raw of output.rows ?? []) {
    const row: Omit<MappedRow, "row"> = {};
    for (const key of ["name", "price", "salePrice", "stock", "sku", "category", "brand", "description", "colors", "sizes"] as const) {
      const value = cleanCell(raw[key]);
      if (value) row[key] = value;
    }
    if (row.name) rows.push(row);
    if (rows.length === BULK_LIMITS.maxRowsPerPdfCall) break;
  }
  return rows;
}

export type RowCopy = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  bulletsAr: string[];
  bulletsEn: string[];
  keywordsAr: string[];
  keywordsEn: string[];
  categoryHint: string | null;
};

const COPY_TITLE_MAX = 120;
const COPY_DESCRIPTION_MAX = 600;
const COPY_BULLETS_MAX = 3;
const COPY_BULLET_CHARS = 160;
const COPY_HINT_CHARS = 60;

const noTags = (text: string | null | undefined) => (text ?? "").replace(/<[^>]*>/g, "");
const copyLine = (text: string | null | undefined, max: number) => lineOf(noTags(text), max);
const copyLines = (values: readonly string[] | null | undefined) =>
  (values ?? []).map((value) => copyLine(value, COPY_BULLET_CHARS)).filter(Boolean).slice(0, COPY_BULLETS_MAX);

/** The model's answer, clamped, keyed by row. Only rows that were asked about, with a title in both languages. */
export function cleanCopyOutput(output: BulkCopyOutput, askedRows: readonly number[]): Map<number, RowCopy> {
  const asked = new Set(askedRows);
  const cleaned = new Map<number, RowCopy>();
  for (const raw of output.products ?? []) {
    if (!asked.has(raw.row) || cleaned.has(raw.row)) continue;
    const titleAr = copyLine(raw.titleAr, COPY_TITLE_MAX);
    const titleEn = copyLine(raw.titleEn, COPY_TITLE_MAX);
    if (!titleAr || !titleEn) continue;
    cleaned.set(raw.row, {
      titleAr,
      titleEn,
      descriptionAr: copyLine(raw.descriptionAr, COPY_DESCRIPTION_MAX),
      descriptionEn: copyLine(raw.descriptionEn, COPY_DESCRIPTION_MAX),
      bulletsAr: copyLines(raw.bulletsAr),
      bulletsEn: copyLines(raw.bulletsEn),
      keywordsAr: cleanKeywords(raw.keywordsAr.map(noTags)),
      keywordsEn: cleanKeywords(raw.keywordsEn.map(noTags)),
      categoryHint: copyLine(raw.categoryHint, COPY_HINT_CHARS) || null,
    });
  }
  return cleaned;
}

type LocaleCopy = { title: string; description: string; bullets: string[]; keywords: string[] };
export type ProductCopy = { ar: LocaleCopy; en: LocaleCopy };

/**
 * The final copy. A name the seller wrote always stays as written, whatever the
 * model answered for it. A description wins when it is one; a short note in that
 * column ("ضمان سنة") went to the model as a fact, and what the model wrote from it
 * reads better. With no AI at all (a flagged row), the other language's text stands in.
 */
const pickDescription = (own: string | null, ai: string | undefined) => (isGoodDescription(own) ? own! : ai || own || "");

export function mergeCopy(row: ValidRow, ai: RowCopy | null): ProductCopy {
  return {
    ar: {
      title: row.name.ar ?? ai?.titleAr ?? row.name.en ?? "",
      description: pickDescription(row.description.ar, ai?.descriptionAr) || (row.description.en ?? ""),
      bullets: ai?.bulletsAr ?? [],
      keywords: ai?.keywordsAr ?? [],
    },
    en: {
      title: row.name.en ?? ai?.titleEn ?? row.name.ar ?? "",
      description: pickDescription(row.description.en, ai?.descriptionEn) || (row.description.ar ?? ""),
      bullets: ai?.bulletsEn ?? [],
      keywords: ai?.keywordsEn ?? [],
    },
  };
}

const titleWords = (text: string) => new Set(normalizeDigits(text).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
const isSubset = (small: ReadonlySet<string>, large: ReadonlySet<string>) => small.size > 0 && [...small].every((word) => large.has(word));

/**
 * The translated title can't be checked against its source in code, but two
 * cheap signs of a title taken from another row can: it drops a number its name
 * has, or all its words are in another row's title though the names don't share
 * those words. "شيء" → "Headscarf" next to "طرحة شيفون" → "Chiffon Headscarf".
 * Calling each row alone wouldn't be simple: ten calls per batch for the same text.
 */
export function findBorrowedTitles(rows: readonly ValidRow[], copies: ReadonlyMap<number, RowCopy>): Set<number> {
  const translated = rows.flatMap((row) => {
    const copy = copies.get(row.row);
    // Both names given: nothing was translated.
    if (!copy || (row.name.ar && row.name.en)) return [];
    const title = row.name.ar ? copy.titleEn : copy.titleAr;
    const source = row.name.ar ?? row.name.en ?? "";
    return [{ row: row.row, title: titleWords(title), source: titleWords(source), numbers: numberTokens(normalizeDigits(source)), raw: normalizeDigits(title) }];
  });
  const borrowed = new Set<number>();
  for (const entry of translated) {
    if (entry.numbers.some((value) => !entry.raw.includes(value))) borrowed.add(entry.row);
    for (const other of translated) {
      if (other.row !== entry.row && isSubset(entry.title, other.title) && !isSubset(entry.source, other.source)) borrowed.add(entry.row);
    }
  }
  return borrowed;
}

// ── Categories ──────────────────────────────────────────────────────────────

/** Flat rows into the nested shape `suggestCategories` reads. */
export function nestCategories<T extends { id: string; parentId: string | null }>(rows: readonly T[]): (T & { categories: unknown[] })[] {
  const nodes = new Map(rows.map((row) => [row.id, { ...row, categories: [] as unknown[] }]));
  const roots: (T & { categories: unknown[] })[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : null;
    if (parent) parent.categories.push(node);
    else roots.push(node);
  }
  return roots;
}

const CATEGORY_CANDIDATES = 12;
const wordsOf = (text: string) => new Set(text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));

export type CategoryPick = {
  id: string;
  /** False: the seller must check it, so the product is saved as a draft. */
  strong: boolean;
};

/**
 * A category's whole name is in what the seller or the AI said it is. "Sneakers"
 * for "sneakers" is; "Formal Shoes" for "sports shoes", "Face Makeup" for "face
 * cream", "Oils & Fluids" for "olive oil" and "Coffee Whisks" for "coffee table"
 * share a word and no more (all four live, 2026-11-04). This also drafts good ones
 * such as "Mugs & Cups" for "mug", on purpose: code can't tell those two kinds apart.
 * A one-letter word doesn't count as covered: tokens drop it, which made "T-Shirts"
 * look like a full match for "shirt" and put linen shirts live there.
 */
const nameCovered = (category: CategoryOption, given: readonly string[]) =>
  [category.name, category.nameAr].some((name) => {
    const tokens = tokenize(name);
    const hasLoneLetter = normalizeSearchText(name ?? "").split(" ").some((word) => word.length === 1);
    return tokens.length > 0 && !hasLoneLetter && tokens.every((token) => given.includes(token));
  });

/**
 * The category and how sure the code is (no list in the prompt, docs/ai.md). The
 * hint and the seller's own category name are matched first and alone: with the
 * title in the mix, a word like "men's" pulled in Men's Skincare for a shirt. Strong
 * only when one category wins outright and its whole name is in the seller's text
 * or the hint, and for the hint also the word that says what the thing is (its
 * last). A tie (Jeans under both Men and Women) is settled by the title's words but
 * stays weak, and so does a match from the title alone. No match returns null.
 */
export function matchCategory(tree: readonly CategoryOption[], row: ValidRow, copy: ProductCopy, hint: string | null): CategoryPick | null {
  const candidates = suggestCategories([...tree], { titles: [hint ?? undefined, row.category ?? undefined] }, CATEGORY_CANDIDATES);
  const top = candidates[0];
  if (!top) {
    const byTitle = suggestCategories([...tree], { titles: [copy.en.title, copy.ar.title], description: copy.en.description }, 1)[0];
    return byTitle ? { id: byTitle.category.id, strong: false } : null;
  }

  const title = wordsOf(`${copy.en.title} ${copy.ar.title}`);
  const pathHits = (path: readonly CategoryOption[]) =>
    path.filter((node) => [...wordsOf(`${node.name} ${node.nameAr ?? ""}`)].some((word) => title.has(word))).length;
  const tied = candidates.filter((candidate) => candidate.score === top.score);
  const pick = tied.reduce((best, candidate) => (pathHits(candidate.path) > pathHits(best.path) ? candidate : best), top);

  const hintTokens = tokenize(hint);
  const headWord = hintTokens[hintTokens.length - 1];
  const ownTokens = [...tokenize(pick.category.name), ...tokenize(pick.category.nameAr)];
  const fromSeller = nameCovered(pick.category, tokenize(row.category));
  const fromHint = nameCovered(pick.category, hintTokens) && headWord !== undefined && ownTokens.includes(headWord);
  return { id: pick.category.id, strong: tied.length === 1 && (fromSeller || fromHint) };
}

/** Last resort for a product that must be saved somewhere: it is a draft, and the seller is told to check it. */
export const firstLeafCategory = (tree: readonly CategoryOption[]) => flattenCategoryTree([...tree]).find((entry) => entry.isLeaf)?.category.id ?? null;

export const categoryNames = (tree: readonly CategoryOption[]) => new Map(flattenCategoryTree([...tree]).map(({ category }) => [category.id, category.nameAr || category.name]));

// ── The product ─────────────────────────────────────────────────────────────

const pounds = (piastres: number) => piastres / 100;

const OPTION_LABELS = {
  colors: { ar: "اللون", en: "Color", kind: "color" as const },
  sizes: { ar: "المقاس", en: "Size", kind: "size" as const },
};

export type PlainVariant = {
  title: string;
  sku: string;
  price: number;
  listPrice: number;
  stock: number;
  isDefault: boolean;
  position: number;
  option1?: string;
  option2?: string;
  localized: {
    ar: { title: string; option1?: string; option2?: string };
    en: { title: string; option1?: string; option2?: string };
    optionMeta: { kind: "color" | "size" }[];
  };
};

/**
 * Plain colors and sizes as the variant rows the product form saves. A single
 * value is no choice. The values stay as the seller wrote them in both
 * languages. The stock count is shared evenly, the first variants taking what's
 * left over, since a sheet with one row per product can't say more.
 */
export function buildPlainVariants(row: ValidRow, sku: string): { variants: PlainVariant[]; ignored: boolean } {
  const options = (["colors", "sizes"] as const)
    .map((key) => ({ ...OPTION_LABELS[key], values: row[key] }))
    .filter((option) => option.values.length > 1);
  if (options.length === 0) return { variants: [], ignored: false };

  const combos = options.reduce<string[][]>((all, option) => all.flatMap((combo) => option.values.map((value) => [...combo, value])), [[]]);
  if (combos.length > BULK_LIMITS.maxVariantsPerProduct) return { variants: [], ignored: true };

  const stock = row.stock ?? 0;
  const share = Math.floor(stock / combos.length);
  const extra = stock % combos.length;
  const variants = combos.map((combo, index) => {
    const title = combo.join(" / ");
    const named = (locale: "ar" | "en") => combo.map((value, i) => `${options[i]![locale]}: ${value}`);
    const en = named("en");
    const ar = named("ar");
    return {
      title,
      sku: `${sku}-${index + 1}`,
      price: pounds(row.salePiastres ?? row.listPiastres),
      listPrice: pounds(row.listPiastres),
      stock: share + (index < extra ? 1 : 0),
      isDefault: index === 0,
      position: index + 1,
      ...(en[0] ? { option1: en[0] } : {}),
      ...(en[1] ? { option2: en[1] } : {}),
      localized: {
        ar: { title, ...(ar[0] ? { option1: ar[0] } : {}), ...(ar[1] ? { option2: ar[1] } : {}) },
        en: { title, ...(en[0] ? { option1: en[0] } : {}), ...(en[1] ? { option2: en[1] } : {}) },
        optionMeta: options.map((option) => ({ kind: option.kind })),
      },
    };
  });
  return { variants, ignored: false };
}

export type ProductPayloadContext = {
  sku: string;
  categoryId: string;
  sellerCategoryId: string | null;
  sellerBrandId: string | null;
  /** Paths in the "products" bucket. */
  imagePaths: string[];
  aiWritten: boolean;
  now: string;
};

/** What `createProduct` takes, the same fields the product form sends. Money was computed in piastres. */
export function buildProductPayload(row: ValidRow, copy: ProductCopy, ctx: ProductPayloadContext) {
  const final = row.salePiastres ?? row.listPiastres;
  const discount = row.listPiastres - final;
  const { variants } = buildPlainVariants(row, ctx.sku);
  const slug = slugify(copy.en.title, { lower: true, strict: true });
  const localized = (locale: "ar" | "en") => ({
    title: copy[locale].title,
    slug,
    description: paragraphsToHtml(copy[locale].description),
    content: "",
    bulletPoints: copy[locale].bullets,
    metaTitle: seoTitle(copy[locale].title),
    metaDescription: seoDescription(copy[locale].description),
    metaKeywords: copy[locale].keywords,
  });
  return {
    sku: ctx.sku,
    categoryId: ctx.categoryId,
    sellerCategoryId: ctx.sellerCategoryId,
    sellerBrandId: ctx.sellerBrandId,
    quantity: row.stock ?? 0,
    trackStock: true,
    images: ctx.imagePaths,
    price: {
      base: pounds(row.listPiastres),
      list: pounds(row.listPiastres),
      final: pounds(final),
      discountType: discount > 0 ? ("amount" as const) : null,
      discountValue: discount > 0 ? pounds(discount) : null,
      discountEndsAt: null,
    },
    condition: "new",
    fulfillmentType: "seller_fulfilled",
    handlingTime: 1,
    taxClass: "standard",
    variants,
    localized: { en: localized("en"), ar: localized("ar") },
    ...(ctx.aiWritten ? { aiSource: "autofill_add" as const, aiAssistedAt: ctx.now } : {}),
  };
}
