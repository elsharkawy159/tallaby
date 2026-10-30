"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import * as XLSX from "xlsx";
import { z } from "zod";
import {
  applyInvalidation,
  invalidateProduct,
  invalidateProductInventory,
  mergeInvalidations,
  type CacheInvalidation,
  type ProductCacheSnapshot,
} from "@workspace/cache";
import type { SQL } from "drizzle-orm";
import { and, db, eq, inArray, isNull, or, productTranslations, productVariants, products, sql } from "@workspace/db";
import { syncCategoryProductCountForProductChange } from "@workspace/db/categories";
import { setStockContext } from "@workspace/db/inventory";
import { isAccessError, requireSeller, type SellerContext } from "@/lib/auth/require-seller.server";
import type { ProductStatus } from "@/lib/products/product-status.lib";
import { canonicalTime } from "../bulk-edit/bulk-edit.lib";
import {
  EXCEL_UPDATE_MAX_BYTES,
  EXCEL_UPDATE_MAX_ROWS,
  type ExcelActionError,
  type ExcelApplyResult,
  type ExcelExportResult,
  type ExcelPreviewResult,
} from "./excel-update.dto";
import {
  buildUpdateSheet,
  hasRequiredColumns,
  mapHeaders,
  parseSheetRows,
  planExcelUpdate,
  previewFromPlan,
  type CatalogProduct,
  type ParsedSheetRow,
  type ProductEdit,
  type ProductWrite,
} from "./excel-update.lib";

/**
 * Update products from Excel (ROADMAP.md F-24c). The seller comes from the
 * session; the client sends only the file (preview and apply each parse it
 * again). Every read and write is scoped by seller_id, trashed products are
 * never written, and apply re-plans from rows locked FOR UPDATE inside one
 * transaction, so the preview is advisory and the write is authoritative.
 * Stock changes are logged as 'import' movements (0125, F-10).
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

type LoadedProduct = CatalogProduct & {
  sellerId: string;
  categoryId: string;
  brandId: string | null;
  isFeatured: boolean | null;
  isTrending: boolean | null;
  isSeasonal: boolean | null;
  isMostSelling: boolean | null;
  isPlatformChoice: boolean | null;
  sponsored: boolean | null;
  slugs: { locale: string; slug: string | null }[];
  createdAt?: string | null;
};

function failure(error: unknown, label: string): { success: false; error: ExcelActionError } {
  if (isAccessError(error)) return { success: false, error: error.code === "seller_blocked" ? "readOnly" : "unauthorized" };
  console.error(`[excel-update] ${label} failed`, error);
  return { success: false, error: "generic" };
}

/** Same rule as the Publish switch and bulk edit: only approved sellers make products live. */
const canPublishFor = (seller: SellerContext) => seller.status === "approved";

const isUuid = (value: unknown): value is string => typeof value === "string" && z.uuid().safeParse(value).success;

async function loadProducts(q: Queryable, sellerId: string, match: SQL, lock: boolean, locale: string): Promise<LoadedProduct[]> {
  const base = q
    .select({
      id: products.id,
      sellerId: products.sellerId,
      categoryId: products.categoryId,
      brandId: products.brandId,
      sku: products.sku,
      status: products.status,
      images: products.images,
      quantity: products.quantity,
      price: products.price,
      deletedAt: products.deletedAt,
      purgedAt: products.purgedAt,
      isFeatured: products.isFeatured,
      isTrending: products.isTrending,
      isSeasonal: products.isSeasonal,
      isMostSelling: products.isMostSelling,
      isPlatformChoice: products.isPlatformChoice,
      sponsored: products.sponsored,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(and(eq(products.sellerId, sellerId), match));
  const rows = lock ? await base.for("update") : await base;
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);

  // Sequential: inside a transaction both queries share one connection.
  const variants = await q
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      title: productVariants.title,
      sku: productVariants.sku,
      price: productVariants.price,
      stock: productVariants.stock,
      discountEndsAt: productVariants.discountEndsAt,
      position: productVariants.position,
    })
    .from(productVariants)
    .where(inArray(productVariants.productId, ids));
  const translations = await q
    .select({
      productId: productTranslations.productId,
      locale: productTranslations.locale,
      slug: productTranslations.slug,
      title: productTranslations.title,
    })
    .from(productTranslations)
    .where(inArray(productTranslations.productId, ids));

  return rows.map((row) => {
    const own = translations.filter((t) => t.productId === row.id);
    return {
      ...row,
      status: row.status as ProductStatus,
      quantity: Math.max(0, Math.trunc(Number(row.quantity) || 0)),
      state: row.purgedAt ? "purged" : row.deletedAt ? "trashed" : "live",
      title: own.find((t) => t.locale === locale)?.title || own.find((t) => t.title)?.title || "",
      slugs: own.map((t) => ({ locale: t.locale, slug: t.slug })),
      variants: variants
        .filter((v) => v.productId === row.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((v) => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          price: v.price,
          stock: v.stock ?? 0,
          discountEndsAt: canonicalTime(v.discountEndsAt),
        })),
    };
  });
}

/**
 * The seller's products a sheet can touch: by product id, by SKU (any case),
 * or holding a listed variant id or variant SKU. Trashed and purged ones are
 * loaded too, so their rows say why they are skipped and their SKUs count as
 * taken.
 */
function sheetMatch(rows: ParsedSheetRow[]): SQL | null {
  const ids = [...new Set(rows.map((r) => r.productId).filter(isUuid))];
  const variantIds = [...new Set(rows.map((r) => r.variantId).filter(isUuid))];
  const skus = [...new Set(rows.map((r) => r.sku?.trim().toLowerCase()).filter((s): s is string => Boolean(s)))];
  const parts: SQL[] = [];
  if (ids.length) parts.push(inArray(products.id, ids));
  if (skus.length) parts.push(inArray(sql`lower(btrim(${products.sku}))`, skus));
  if (variantIds.length || skus.length) {
    const variantMatch = or(
      variantIds.length ? inArray(productVariants.id, variantIds) : undefined,
      skus.length ? inArray(sql`lower(btrim(${productVariants.sku}))`, skus) : undefined,
    );
    parts.push(
      inArray(
        products.id,
        db.select({ id: sql<string>`${productVariants.productId}` }).from(productVariants).where(variantMatch),
      ),
    );
  }
  return parts.length ? (or(...parts) ?? null) : null;
}

type SheetRead = { ok: true; rows: ParsedSheetRow[] } | { ok: false; error: ExcelActionError };

/** Parses the uploaded workbook's first sheet with SheetJS (the same library as the product import). */
async function readSheet(formData: unknown): Promise<SheetRead> {
  if (!(formData instanceof FormData)) return { ok: false, error: "noFile" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "noFile" };
  if (file.size > EXCEL_UPDATE_MAX_BYTES) return { ok: false, error: "tooBig" };

  let sheet: XLSX.WorkSheet | undefined;
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  } catch {
    return { ok: false, error: "badFile" };
  }
  if (!sheet) return { ok: false, error: "badFile" };

  const [headerRow] = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
  const headers = mapHeaders((headerRow ?? []).map((h) => String(h ?? "")));
  if (!hasRequiredColumns(headers.values())) return { ok: false, error: "missingColumns" };

  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
  if (records.length > EXCEL_UPDATE_MAX_ROWS + 50) return { ok: false, error: "tooManyRows" };
  const rows = parseSheetRows(records, headers);
  if (!rows.length) return { ok: false, error: "noRows" };
  if (rows.length > EXCEL_UPDATE_MAX_ROWS) return { ok: false, error: "tooManyRows" };
  return { ok: true, rows };
}

async function planFor(q: Queryable, seller: SellerContext, rows: ParsedSheetRow[], lock: boolean, locale: string) {
  const match = sheetMatch(rows);
  const catalog = match ? await loadProducts(q, seller.sellerId, match, lock, locale) : [];
  return { catalog, plan: planExcelUpdate(rows, catalog, { canPublish: canPublishFor(seller) }) };
}

/** Before → after for every row of the uploaded sheet; writes nothing. */
export async function previewExcelUpdateAction(formData: FormData): Promise<ExcelPreviewResult> {
  try {
    const seller = await requireSeller();
    const sheet = await readSheet(formData);
    if (!sheet.ok) return { success: false, error: sheet.error };
    const { plan } = await planFor(db, seller, sheet.rows, false, await getLocale());
    return { success: true, ...previewFromPlan(plan) };
  } catch (error) {
    return failure(error, "preview");
  }
}

function snapshot(row: LoadedProduct, values: ProductWrite = {}): ProductCacheSnapshot {
  return {
    id: row.id,
    sellerId: row.sellerId,
    categoryId: row.categoryId,
    brandId: row.brandId,
    slugs: row.slugs,
    status: values.status ?? row.status,
    isFeatured: row.isFeatured ?? false,
    isTrending: row.isTrending ?? false,
    isSeasonal: row.isSeasonal ?? false,
    isMostSelling: row.isMostSelling ?? false,
    isPlatformChoice: row.isPlatformChoice ?? false,
    sponsored: row.sponsored ?? false,
    priceKey: JSON.stringify(("price" in values ? values.price : row.price) ?? null),
  };
}

/** Writes one product's planned values inside `tx`, scoped by seller and never to a trashed product. */
async function writeEdit(tx: Tx, sellerId: string, edit: ProductEdit, now: string): Promise<boolean> {
  const { after } = edit;
  const set: Partial<typeof products.$inferInsert> = { updatedAt: now };
  if ("price" in after) set.price = after.price as typeof products.$inferInsert.price;
  if ("quantity" in after) set.quantity = String(after.quantity ?? 0);
  if (after.status) set.status = after.status;
  if (after.sku) set.sku = after.sku;
  const updated = await tx
    .update(products)
    .set(set)
    .where(and(eq(products.id, edit.product.id), eq(products.sellerId, sellerId), isNull(products.deletedAt)))
    .returning({ id: products.id });
  if (!updated.length) return false;

  for (const v of after.variants ?? []) {
    const vset: Partial<typeof productVariants.$inferInsert> = { updatedAt: now };
    if ("price" in v) vset.price = v.price as typeof productVariants.$inferInsert.price;
    if ("stock" in v) vset.stock = Math.max(0, v.stock ?? 0);
    if ("discountEndsAt" in v) vset.discountEndsAt = v.discountEndsAt ?? null;
    if (v.sku) vset.sku = v.sku;
    // The product row above is already checked to be this seller's.
    await tx
      .update(productVariants)
      .set(vset)
      .where(and(eq(productVariants.id, v.id), eq(productVariants.productId, edit.product.id)));
  }
  return true;
}

/** Category counts and cache purge, as bulk edit does. */
async function afterWrite(edits: { row: LoadedProduct; before: ProductWrite; after: ProductWrite }[]): Promise<void> {
  const invalidations: CacheInvalidation[] = [];
  const inventory: Parameters<typeof invalidateProductInventory>[0][number][] = [];
  for (const { row, before, after } of edits) {
    if (after.status && before.status !== after.status) {
      await syncCategoryProductCountForProductChange({
        categoryId: row.categoryId,
        previousStatus: before.status ?? row.status,
        nextStatus: after.status,
      });
    }
    invalidations.push(invalidateProduct(snapshot(row, before), snapshot(row, after)));
    if ("quantity" in after || after.variants?.some((v) => "stock" in v)) {
      const wasInStock = (before.quantity ?? row.quantity) > 0;
      const isInStock = (after.quantity ?? row.quantity) > 0;
      inventory.push({ snapshot: snapshot(row, after), stockBoundaryCrossed: wasInStock !== isInStock });
    }
  }
  if (inventory.length) invalidations.push(invalidateProductInventory(inventory));
  if (invalidations.length) {
    await applyInvalidation(mergeInvalidations(...invalidations), { from: "dashboard", mode: "action" });
  }
  revalidatePath("/products", "layout");
}

/** Applies the sheet in one transaction (rows locked, re-planned) and clears caches. */
export async function applyExcelUpdateAction(formData: FormData): Promise<ExcelApplyResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const sheet = await readSheet(formData);
    if (!sheet.ok) return { success: false, error: sheet.error };
    const locale = await getLocale();
    const now = new Date().toISOString();

    const result = await db.transaction(async (tx) => {
      await setStockContext(tx, { reason: "import", actorId: seller.userId });
      const { catalog, plan } = await planFor(tx, seller, sheet.rows, true, locale);
      const byId = new Map(catalog.map((p) => [p.id, p]));
      const done: { row: LoadedProduct; before: ProductWrite; after: ProductWrite }[] = [];
      let changedRows = 0;
      for (const edit of plan.edits) {
        const row = byId.get(edit.product.id);
        if (!row) continue;
        if (await writeEdit(tx, seller.sellerId, edit, now)) {
          done.push({ row, before: edit.before, after: edit.after });
          changedRows += edit.rows.length;
        }
      }
      const skipped = plan.rows.filter((r) => r.outcome === "skip").length;
      return { done, changedRows, skipped };
    });

    await afterWrite(result.done);
    return { success: true, changedRows: result.changedRows, changedProducts: result.done.length, skipped: result.skipped };
  } catch (error) {
    if (error && typeof error === "object" && (error as { code?: string }).code === "23505") {
      // A SKU taken between preview and apply (another tab): nothing was written.
      return { success: false, error: "generic" };
    }
    return failure(error, "apply");
  }
}

const exportIdsSchema = z.array(z.uuid()).max(EXCEL_UPDATE_MAX_ROWS);

/**
 * The update sheet for the given products (the list the seller is looking
 * at), or every live product when no ids are sent. Seller-scoped; trashed
 * products are left out.
 */
export async function exportExcelUpdateSheetAction(ids: unknown): Promise<ExcelExportResult> {
  try {
    const seller = await requireSeller();
    const parsed = exportIdsSchema.safeParse(ids ?? []);
    if (!parsed.success) return { success: false, error: "generic" };
    const wanted = [...new Set(parsed.data)];
    const locale = (await getLocale()) === "en" ? "en" : "ar";
    const match = wanted.length ? inArray(products.id, wanted) : sql`true`;
    const loaded = await loadProducts(db, seller.sellerId, and(match, isNull(products.deletedAt), isNull(products.purgedAt))!, false, locale);
    const order = new Map(wanted.map((id, i) => [id, i]));
    loaded.sort((a, b) =>
      wanted.length
        ? (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
        : String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")),
    );
    const sheet = buildUpdateSheet(loaded, locale, EXCEL_UPDATE_MAX_ROWS);
    return { success: true, ...sheet };
  } catch (error) {
    return failure(error, "export");
  }
}
