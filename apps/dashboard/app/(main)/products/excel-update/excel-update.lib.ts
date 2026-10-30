import { hasProductImage, type ProductStatus } from "@/lib/products/product-status.lib";
import { canonicalTime, readPrice, toPounds } from "../bulk-edit/bulk-edit.lib";
import {
  EXCEL_UPDATE_COLUMNS,
  EXCEL_UPDATE_MAX_PRICE,
  EXCEL_UPDATE_MAX_STOCK,
  EXCEL_UPDATE_SKU_MAX,
  type ExcelPreviewLine,
  type ExcelPreviewRow,
  type ExcelSkipReason,
  type ExcelUpdateColumn,
} from "./excel-update.dto";

/**
 * Pure part of "Update from Excel" (ROADMAP.md F-24c): sheet headers, cell
 * parsing, matching rows to the seller's products, and planning the writes.
 *
 * Money is computed in integer piastres (same helpers and limits as bulk
 * edit) and written back to the price jsonb in pounds. A blank cell never
 * changes anything. Each row is all-or-nothing: one bad cell skips the row
 * with a reason, other rows still apply. Status follows the Publish switch:
 * an image and an approved seller to go live; a product Tallaby stopped
 * ("rejected") is never changed.
 */

// ---------------------------------------------------------------- headers

/** Sheet headers by locale. Uploads accept either language (and a few aliases). */
export const EXCEL_UPDATE_HEADERS: Record<"en" | "ar", Record<ExcelUpdateColumn, string>> = {
  en: {
    productId: "Product ID",
    variantId: "Variant ID",
    title: "Product",
    variant: "Variant",
    sku: "SKU",
    price: "Price",
    salePrice: "Sale price",
    stock: "Stock",
    status: "Status",
  },
  ar: {
    productId: "رقم المنتج",
    variantId: "رقم النوع",
    title: "المنتج",
    variant: "النوع",
    sku: "كود المنتج SKU",
    price: "السعر",
    salePrice: "سعر الخصم",
    stock: "المخزون",
    status: "الحالة",
  },
};

/** Status words written to the sheet, per locale. */
export const EXCEL_STATUS_WORDS: Record<"en" | "ar", Record<"active" | "draft" | "rejected", string>> = {
  en: { active: "active", draft: "draft", rejected: "stopped" },
  ar: { active: "منشور", draft: "مسودة", rejected: "موقوف" },
};

/** Lowercase, Arabic-Indic digits to Latin, no spaces or punctuation. */
export function normalizeHeader(value: unknown): string {
  return toLatinDigits(String(value ?? ""))
    .toLowerCase()
    .replace(/[\s_\-().:#/\\|*]+/g, "")
    .replace(/[ً-ْـ]/g, "") // Arabic diacritics and tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

const HEADER_ALIASES: Record<string, ExcelUpdateColumn> = (() => {
  const map: Record<string, ExcelUpdateColumn> = {};
  for (const locale of ["en", "ar"] as const) {
    for (const key of EXCEL_UPDATE_COLUMNS) map[normalizeHeader(EXCEL_UPDATE_HEADERS[locale][key])] = key;
  }
  const extra: Record<string, ExcelUpdateColumn> = {
    id: "productId",
    productid: "productId",
    variantid: "variantId",
    title: "title",
    name: "title",
    sku: "sku",
    كود: "sku",
    كودالمنتج: "sku",
    regularprice: "price",
    listprice: "price",
    baseprice: "price",
    saleprice: "salePrice",
    finalprice: "salePrice",
    quantity: "stock",
    الكميه: "stock",
    isactive: "status",
  };
  return { ...map, ...extra };
})();

/** Maps each sheet header to a column; unknown headers are ignored. */
export function mapHeaders(headers: readonly string[]): Map<string, ExcelUpdateColumn> {
  const out = new Map<string, ExcelUpdateColumn>();
  for (const header of headers) {
    const key = HEADER_ALIASES[normalizeHeader(header)];
    if (key && ![...out.values()].includes(key)) out.set(header, key);
  }
  return out;
}

/** A sheet must have a way to find the product and at least one value to change. */
export function hasRequiredColumns(columns: Iterable<ExcelUpdateColumn>): boolean {
  const set = new Set(columns);
  const key = set.has("productId") || set.has("variantId") || set.has("sku");
  const value = set.has("price") || set.has("salePrice") || set.has("stock") || set.has("status") || set.has("sku");
  return key && value;
}

// ---------------------------------------------------------------- cells

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toLatinDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".") // Arabic decimal separator
    .replace(/٬/g, ","); // Arabic thousands separator
}

const INVALID = "invalid" as const;
type Invalid = typeof INVALID;

const isBlank = (value: unknown) => value == null || (typeof value === "string" && value.trim() === "");

function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return String(value).trim();
}

function cellNumber(value: unknown): number | null | Invalid {
  if (isBlank(value)) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : INVALID;
  const text = toLatinDigits(String(value))
    .replace(/(ج\.?\s*م\.?|جنيه|egp|le|l\.e\.?)/gi, "")
    .replace(/,/g, "")
    .trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) return INVALID;
  return Number(text);
}

/** A price cell in piastres: null = blank (unchanged). 0 is allowed here (sale price 0 = no discount). */
export function parseMoney(value: unknown): number | null | Invalid {
  const n = cellNumber(value);
  if (n === null || n === INVALID) return n;
  if (n < 0 || n > EXCEL_UPDATE_MAX_PRICE) return INVALID;
  return Math.round(n * 100);
}

export function parseStock(value: unknown): number | null | Invalid {
  const n = cellNumber(value);
  if (n === null || n === INVALID) return n;
  if (!Number.isInteger(n) || n < 0 || n > EXCEL_UPDATE_MAX_STOCK) return INVALID;
  return n;
}

export type SheetStatus = "active" | "draft" | "rejected";

const STATUS_WORDS: Record<string, SheetStatus> = {
  active: "active",
  published: "active",
  publish: "active",
  live: "active",
  true: "active",
  yes: "active",
  "1": "active",
  منشور: "active",
  نشط: "active",
  draft: "draft",
  hidden: "draft",
  unpublished: "draft",
  false: "draft",
  no: "draft",
  "0": "draft",
  مسوده: "draft",
  مخفي: "draft",
  غيرمنشور: "draft",
  stopped: "rejected",
  rejected: "rejected",
  موقوف: "rejected",
};

export function parseStatus(value: unknown): SheetStatus | null | Invalid {
  if (isBlank(value)) return null;
  if (typeof value === "boolean") return value ? "active" : "draft";
  return STATUS_WORDS[normalizeHeader(value)] ?? INVALID;
}

function parseId(value: unknown): string | null | Invalid {
  const text = cellText(value);
  if (!text) return null;
  return UUID_RE.test(text) ? text.toLowerCase() : INVALID;
}

export type ParsedSheetRow = {
  /** Sheet row number (the header is row 1). */
  row: number;
  productId: string | null | Invalid;
  variantId: string | null | Invalid;
  sku: string | null;
  title: string;
  variant: string | null;
  /** Piastres; null = unchanged. */
  price: number | null | Invalid;
  /** Piastres; null = unchanged; 0 = no discount. */
  salePrice: number | null | Invalid;
  stock: number | null | Invalid;
  status: SheetStatus | null | Invalid;
};

/**
 * Sheet records (SheetJS `sheet_to_json` objects, header → cell) to parsed
 * rows. Wholly empty rows are dropped.
 */
export function parseSheetRows(records: readonly Record<string, unknown>[], headers: Map<string, ExcelUpdateColumn>): ParsedSheetRow[] {
  const out: ParsedSheetRow[] = [];
  records.forEach((record, index) => {
    const cells: Partial<Record<ExcelUpdateColumn, unknown>> = {};
    for (const [header, key] of headers) cells[key] = record[header];
    const meaningful: ExcelUpdateColumn[] = ["productId", "variantId", "sku", "price", "salePrice", "stock", "status"];
    if (meaningful.every((key) => isBlank(cells[key]))) return;
    const sku = cellText(cells.sku);
    out.push({
      row: index + 2,
      productId: parseId(cells.productId),
      variantId: parseId(cells.variantId),
      sku: sku || null,
      title: cellText(cells.title),
      variant: cellText(cells.variant) || null,
      price: parseMoney(cells.price),
      salePrice: parseMoney(cells.salePrice),
      stock: parseStock(cells.stock),
      status: parseStatus(cells.status),
    });
  });
  return out;
}

// ---------------------------------------------------------------- catalog

export type CatalogVariant = {
  id: string;
  title: string | null;
  sku: string | null;
  price: unknown;
  stock: number;
  discountEndsAt: string | null;
};

export type CatalogProduct = {
  id: string;
  title: string;
  sku: string | null;
  status: ProductStatus;
  images: unknown;
  quantity: number;
  price: unknown;
  /** live: editable; trashed: in Trash (0123); purged: deleted for good (kept for orders). */
  state: "live" | "trashed" | "purged";
  variants: CatalogVariant[];
};

const skuKey = (sku: string) => sku.trim().toLowerCase();

export type CatalogIndex = {
  byId: Map<string, CatalogProduct>;
  bySku: Map<string, CatalogProduct[]>;
  variantById: Map<string, { product: CatalogProduct; variant: CatalogVariant }>;
  variantBySku: Map<string, { product: CatalogProduct; variant: CatalogVariant }[]>;
};

export function buildCatalogIndex(products: readonly CatalogProduct[]): CatalogIndex {
  const index: CatalogIndex = { byId: new Map(), bySku: new Map(), variantById: new Map(), variantBySku: new Map() };
  for (const product of products) {
    index.byId.set(product.id, product);
    if (product.sku) {
      const key = skuKey(product.sku);
      index.bySku.set(key, [...(index.bySku.get(key) ?? []), product]);
    }
    for (const variant of product.variants) {
      index.variantById.set(variant.id, { product, variant });
      if (variant.sku) {
        const key = skuKey(variant.sku);
        index.variantBySku.set(key, [...(index.variantBySku.get(key) ?? []), { product, variant }]);
      }
    }
  }
  return index;
}

export type RowMatch =
  | { kind: "product"; product: CatalogProduct; by: "id" | "sku" }
  | { kind: "variant"; product: CatalogProduct; variant: CatalogVariant; by: "id" | "sku" }
  | { kind: "skip"; reason: ExcelSkipReason };

const notLive = (product: CatalogProduct): ExcelSkipReason | null =>
  product.state === "trashed" ? "inTrash" : product.state === "purged" ? "notFound" : null;

/**
 * Finds the row's product or variant among the seller's own products:
 * Variant ID, else Product ID, else SKU (a product's SKU first, then a
 * variant's). Only live products match; a trashed one says so.
 */
export function matchRow(row: ParsedSheetRow, index: CatalogIndex): RowMatch {
  if (row.productId === INVALID || row.variantId === INVALID) return { kind: "skip", reason: "badId" };

  if (row.variantId) {
    const hit = index.variantById.get(row.variantId);
    if (!hit) return { kind: "skip", reason: "notFound" };
    if (row.productId && row.productId !== hit.product.id) return { kind: "skip", reason: "variantMismatch" };
    const state = notLive(hit.product);
    if (state) return { kind: "skip", reason: state };
    return { kind: "variant", product: hit.product, variant: hit.variant, by: "id" };
  }

  if (row.productId) {
    const product = index.byId.get(row.productId);
    if (!product) return { kind: "skip", reason: "notFound" };
    const state = notLive(product);
    if (state) return { kind: "skip", reason: state };
    return { kind: "product", product, by: "id" };
  }

  if (row.sku) {
    const key = skuKey(row.sku);
    const products = index.bySku.get(key) ?? [];
    const live = products.filter((p) => p.state === "live");
    const variants = (index.variantBySku.get(key) ?? []).filter((v) => v.product.state === "live");
    // A product's SKU comes before a variant's (variants often repeat the product SKU).
    if (live.length === 1) return { kind: "product", product: live[0]!, by: "sku" };
    if (live.length > 1) return { kind: "skip", reason: "ambiguousSku" };
    if (variants.length === 1) return { kind: "variant", product: variants[0]!.product, variant: variants[0]!.variant, by: "sku" };
    if (variants.length > 1) return { kind: "skip", reason: "ambiguousSku" };
    const hidden = products.map(notLive).find(Boolean);
    return { kind: "skip", reason: hidden ?? "notFound" };
  }

  return { kind: "skip", reason: "noKey" };
}

// ---------------------------------------------------------------- prices

export type PriceUpdate = { next: Record<string, unknown>; removedDiscount: boolean } | { same: true } | { fail: ExcelSkipReason };

/** Regular (list) and customer (final) price in piastres; null when there is no price. */
export function readRegularSale(price: unknown): { regular: number; sale: number } | null {
  const parts = readPrice(price);
  if (!parts) return null;
  const regular = parts.list ?? parts.base ?? parts.final!;
  return { regular, sale: Math.min(parts.final!, regular) };
}

/**
 * New price jsonb from the sheet's Price and Sale price (piastres; null =
 * unchanged, sale 0 = no discount). A sale price above the price is refused.
 * A percent discount stays a percent when the new prices still match it;
 * otherwise the discount is stored as an amount (what the shopper saves).
 */
export function applySheetPrice(price: unknown, regularIn: number | null, saleIn: number | null): PriceUpdate {
  const current = readRegularSale(price);
  if (!current && regularIn == null) return { fail: "noPrice" };
  const regular = regularIn ?? current!.regular;
  if (regular <= 0) return { fail: "invalidPrice" };

  let sale: number;
  if (saleIn === 0) sale = regular;
  else if (saleIn != null) sale = saleIn;
  else if (!current || current.sale >= current.regular) sale = regular; // no discount before: follow the price
  else sale = current.sale; // keep the sale price
  if (sale > regular) return { fail: "saleAboveRegular" };

  if (current && current.regular === regular && current.sale === sale) return { same: true };

  const obj = price && typeof price === "object" && !Array.isArray(price) ? (price as Record<string, unknown>) : {};
  const next: Record<string, unknown> = { ...obj, base: toPounds(regular), list: toPounds(regular), final: toPounds(sale) };
  const hadDiscount = Boolean(current && current.sale < current.regular);
  if (sale === regular) {
    next.discountType = null;
    next.discountValue = null;
    if ("discountEndsAt" in obj) next.discountEndsAt = null;
  } else {
    const pct = Number(obj.discountValue);
    const keepsPercent =
      obj.discountType === "percent" && Number.isFinite(pct) && Math.round(regular * (1 - pct / 100)) === sale;
    next.discountType = keepsPercent ? "percent" : "amount";
    next.discountValue = keepsPercent ? pct : toPounds(regular - sale);
  }
  return { next, removedDiscount: hadDiscount && sale === regular };
}

// ---------------------------------------------------------------- planning

export type VariantWrite = { id: string; price?: unknown; stock?: number; sku?: string; discountEndsAt?: string | null };
export type ProductWrite = { price?: unknown; quantity?: number; status?: ProductStatus; sku?: string; variants?: VariantWrite[] };

export type ProductEdit = { product: CatalogProduct; before: ProductWrite; after: ProductWrite; rows: number[] };

export type PlannedRow =
  | { row: number; outcome: "change"; productId: string; title: string; variant: string | null; lines: ExcelPreviewLine[] }
  | { row: number; outcome: "same"; productId: string }
  | { row: number; outcome: "skip"; reason: ExcelSkipReason; title: string; variant: string | null };

export type ExcelPlan = { rows: PlannedRow[]; edits: ProductEdit[] };

export type ExcelPlanContext = { canPublish: boolean };

/** The status word a product shows in the sheet. */
export const sheetStatusOf = (status: ProductStatus): SheetStatus =>
  status === "active" ? "active" : status === "rejected" ? "rejected" : "draft";

const pounds = (piastres: number) => toPounds(piastres);

function validSku(sku: string): boolean {
  return sku.length > 0 && sku.length <= EXCEL_UPDATE_SKU_MAX && !/[\u0000-\u001f\u007f]/.test(sku);
}

function priceLines(before: unknown, after: unknown): ExcelPreviewLine[] {
  const b = readRegularSale(before);
  const a = readRegularSale(after);
  const lines: ExcelPreviewLine[] = [];
  if (b?.regular !== a?.regular) lines.push({ field: "price", before: b ? pounds(b.regular) : null, after: a ? pounds(a.regular) : null });
  if (b?.sale !== a?.sale) lines.push({ field: "salePrice", before: b ? pounds(b.sale) : null, after: a ? pounds(a.sale) : null });
  return lines;
}

/**
 * Plans every row against the seller's catalog: which rows change, which are
 * the same and which are skipped (with why), and one write per product.
 * `skuOwners` maps a lower-cased SKU to the product that holds it (all of the
 * seller's products, trashed ones too: the unique index covers them).
 */
export function planExcelUpdate(
  rows: readonly ParsedSheetRow[],
  catalog: readonly CatalogProduct[],
  ctx: ExcelPlanContext,
): ExcelPlan {
  const index = buildCatalogIndex(catalog);
  const skuOwners = new Map<string, string>();
  for (const product of catalog) if (product.sku) skuOwners.set(skuKey(product.sku), product.id);

  const seen = new Set<string>();
  const edits = new Map<string, ProductEdit>();
  const planned: PlannedRow[] = [];

  const editFor = (product: CatalogProduct): ProductEdit => {
    let edit = edits.get(product.id);
    if (!edit) {
      edit = { product, before: {}, after: {}, rows: [] };
      edits.set(product.id, edit);
    }
    return edit;
  };

  for (const row of rows) {
    const match = matchRow(row, index);
    const fallbackTitle = row.title;
    if (match.kind === "skip") {
      planned.push({ row: row.row, outcome: "skip", reason: match.reason, title: fallbackTitle, variant: row.variant });
      continue;
    }
    const { product } = match;
    const variant = match.kind === "variant" ? match.variant : null;
    const title = product.title || fallbackTitle;
    const variantLabel = variant ? variant.title?.trim() || row.variant || "—" : null;
    const skip = (reason: ExcelSkipReason) =>
      planned.push({ row: row.row, outcome: "skip", reason, title, variant: variantLabel });

    const key = variant ? `v:${variant.id}` : `p:${product.id}`;
    if (seen.has(key)) {
      skip("duplicateRow");
      continue;
    }
    seen.add(key);

    if (row.price === INVALID) { skip("invalidPrice"); continue; }
    if (row.salePrice === INVALID) { skip("invalidSalePrice"); continue; }
    if (row.price === 0) { skip("invalidPrice"); continue; }
    if (row.stock === INVALID) { skip("invalidStock"); continue; }
    if (!variant && row.status === INVALID) { skip("invalidStatus"); continue; }

    const lines: ExcelPreviewLine[] = [];
    // Each product or variant is planned by one row only (duplicates are skipped above).
    const current = {
      price: variant ? variant.price : product.price,
      stock: variant ? variant.stock : product.quantity,
      sku: variant ? variant.sku : product.sku,
    };

    // Price
    let nextPrice: Record<string, unknown> | undefined;
    let removedDiscount = false;
    if (row.price != null || row.salePrice != null) {
      const result = applySheetPrice(current.price, row.price, row.salePrice);
      if ("fail" in result) { skip(result.fail); continue; }
      if ("next" in result) {
        nextPrice = result.next;
        removedDiscount = result.removedDiscount;
        lines.push(...priceLines(current.price, result.next));
      }
    }

    // Stock
    const nextStock = row.stock != null && row.stock !== current.stock ? row.stock : undefined;
    if (nextStock != null) lines.push({ field: "stock", before: current.stock, after: nextStock });

    // SKU: changeable when the row is found by id (a SKU-matched row's SKU is its key).
    let nextSku: string | undefined;
    if (match.by === "id" && row.sku && row.sku !== (current.sku ?? "")) {
      if (!validSku(row.sku)) { skip("invalidSku"); continue; }
      if (!variant) {
        const owner = skuOwners.get(skuKey(row.sku));
        if (owner && owner !== product.id) { skip("skuTaken"); continue; }
      }
      nextSku = row.sku;
      lines.push({ field: "sku", before: current.sku ?? "", after: row.sku });
    }

    // Status (product rows only), same rules as the Publish switch.
    let nextStatus: ProductStatus | undefined;
    if (!variant && row.status && row.status !== INVALID && row.status !== sheetStatusOf(product.status)) {
      if (product.status === "rejected" || row.status === "rejected") { skip(product.status === "rejected" ? "rejected" : "invalidStatus"); continue; }
      if (row.status === "active") {
        if (!ctx.canPublish) { skip("cannotPublish"); continue; }
        if (!hasProductImage(product.images)) { skip("needsImage"); continue; }
        nextStatus = "active";
      } else {
        nextStatus = "draft";
      }
      lines.push({ field: "status", before: sheetStatusOf(product.status), after: nextStatus });
    }

    if (!lines.length) {
      planned.push({ row: row.row, outcome: "same", productId: product.id });
      continue;
    }

    const target = editFor(product);
    target.rows.push(row.row);
    if (variant) {
      const before: VariantWrite = { id: variant.id };
      const after: VariantWrite = { id: variant.id };
      if (nextPrice) {
        before.price = variant.price ?? null;
        after.price = nextPrice;
        if (removedDiscount && variant.discountEndsAt) {
          before.discountEndsAt = canonicalTime(variant.discountEndsAt);
          after.discountEndsAt = null;
        }
      }
      if (nextStock != null) {
        before.stock = variant.stock;
        after.stock = nextStock;
      }
      if (nextSku != null) {
        before.sku = variant.sku ?? "";
        after.sku = nextSku;
      }
      target.before.variants = [...(target.before.variants ?? []), before];
      target.after.variants = [...(target.after.variants ?? []), after];
    } else {
      if (nextPrice) {
        target.before.price = product.price ?? null;
        target.after.price = nextPrice;
      }
      if (nextStock != null) {
        target.before.quantity = product.quantity;
        target.after.quantity = nextStock;
      }
      if (nextSku != null) {
        target.before.sku = product.sku ?? "";
        target.after.sku = nextSku;
        if (product.sku) skuOwners.delete(skuKey(product.sku));
        skuOwners.set(skuKey(nextSku), product.id);
      }
      if (nextStatus) {
        target.before.status = product.status;
        target.after.status = nextStatus;
      }
    }
    planned.push({ row: row.row, outcome: "change", productId: product.id, title, variant: variantLabel, lines });
  }

  return { rows: planned, edits: [...edits.values()] };
}

/** Preview rows for the dialog: changes and skips, in sheet order ("same" rows are only counted). */
export function previewFromPlan(plan: ExcelPlan): {
  rows: ExcelPreviewRow[];
  changeCount: number;
  sameCount: number;
  skipCount: number;
  productCount: number;
} {
  const rows: ExcelPreviewRow[] = [];
  let changeCount = 0;
  let sameCount = 0;
  let skipCount = 0;
  for (const row of plan.rows) {
    if (row.outcome === "same") {
      sameCount += 1;
      continue;
    }
    if (row.outcome === "change") {
      changeCount += 1;
      rows.push({ row: row.row, title: row.title, variant: row.variant, outcome: "change", lines: row.lines });
    } else {
      skipCount += 1;
      rows.push({ row: row.row, title: row.title, variant: row.variant, outcome: "skip", reason: row.reason, lines: [] });
    }
  }
  return { rows, changeCount, sameCount, skipCount, productCount: plan.edits.length };
}

// ---------------------------------------------------------------- export

/**
 * The update sheet: one row per product, then one per variant. Price and
 * Sale price are the regular and customer prices in pounds (a variant with no
 * own price leaves both blank: it uses the product's).
 */
export function buildUpdateSheet(
  products: readonly CatalogProduct[],
  locale: "en" | "ar",
  maxRows: number,
): { header: string[]; rows: Record<string, string | number>[]; productCount: number; truncated: boolean } {
  const h = EXCEL_UPDATE_HEADERS[locale];
  const words = EXCEL_STATUS_WORDS[locale];
  const header = EXCEL_UPDATE_COLUMNS.map((key) => h[key]);
  const rows: Record<string, string | number>[] = [];
  let productCount = 0;
  for (const product of products) {
    if (product.state !== "live") continue;
    if (rows.length + 1 + product.variants.length > maxRows) return { header, rows, productCount, truncated: true };
    const price = readRegularSale(product.price);
    rows.push({
      [h.productId]: product.id,
      [h.variantId]: "",
      [h.title]: product.title,
      [h.variant]: "",
      [h.sku]: product.sku ?? "",
      [h.price]: price ? pounds(price.regular) : "",
      [h.salePrice]: price ? pounds(price.sale) : "",
      [h.stock]: product.quantity,
      [h.status]: words[sheetStatusOf(product.status)],
    });
    for (const variant of product.variants) {
      const own = readRegularSale(variant.price);
      rows.push({
        [h.productId]: product.id,
        [h.variantId]: variant.id,
        [h.title]: product.title,
        [h.variant]: variant.title ?? "",
        [h.sku]: variant.sku ?? "",
        [h.price]: own ? pounds(own.regular) : "",
        [h.salePrice]: own ? pounds(own.sale) : "",
        [h.stock]: variant.stock,
        [h.status]: "",
      });
    }
    productCount += 1;
  }
  return { header, rows, productCount, truncated: false };
}
