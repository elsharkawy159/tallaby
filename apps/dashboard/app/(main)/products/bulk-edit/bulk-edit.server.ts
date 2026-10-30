"use server";

import { revalidatePath } from "next/cache";
import {
  applyInvalidation,
  invalidateProduct,
  invalidateProductInventory,
  mergeInvalidations,
  type CacheInvalidation,
  type ProductCacheSnapshot,
} from "@workspace/cache";
import { and, db, eq, inArray, isNull, productTranslations, productVariants, products } from "@workspace/db";
import { syncCategoryProductCountForProductChange } from "@workspace/db/categories";
import { setStockContext } from "@workspace/db/inventory";
import { parseIntegrationKey } from "@workspace/lib/integrations/server";
import { getLocale } from "next-intl/server";
import { isAccessError, requireSeller, type SellerContext } from "@/lib/auth/require-seller.server";
import { hasProductImage, type ProductStatus } from "@/lib/products/product-status.lib";
import {
  bulkEditInputSchema,
  type BulkActionError,
  type BulkApplyResult,
  type BulkPreviewResult,
  type BulkUndoResult,
} from "./bulk-edit.dto";
import {
  canonicalTime,
  currentValues,
  planBulkEdit,
  previewRows,
  sameValues,
  undoStatus,
  type BulkProductRow,
  type ProductValues,
} from "./bulk-edit.lib";
import { deriveUndoKey, signUndoToken, verifyUndoToken, type UndoEntry } from "./bulk-edit-undo.lib";

/**
 * Bulk product editing actions (ROADMAP.md F-24a/F-24b). The seller comes from
 * the session (requireSeller); the client sends product ids and the change
 * only. Every read and write is scoped by seller_id, skips products in Trash
 * (0123) and recomputes the new values from the rows locked in the
 * transaction, so the preview is advisory and the write is authoritative.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

type LoadedRow = BulkProductRow & {
  title: string;
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
};

function failure(error: unknown, label: string): { success: false; error: BulkActionError } {
  if (isAccessError(error)) return { success: false, error: error.code === "seller_blocked" ? "readOnly" : "unauthorized" };
  console.error(`[bulk-edit] ${label} failed`, error);
  return { success: false, error: "generic" };
}

/** Same rule as the Publish switch and Trash restore: only approved sellers make products live. */
const canPublishFor = (seller: SellerContext) => seller.status === "approved";

async function loadRows(q: Queryable, sellerId: string, ids: string[], lock: boolean, locale: string): Promise<LoadedRow[]> {
  if (!ids.length) return [];
  const base = q
    .select({
      id: products.id,
      sellerId: products.sellerId,
      categoryId: products.categoryId,
      brandId: products.brandId,
      status: products.status,
      images: products.images,
      quantity: products.quantity,
      price: products.price,
      isFeatured: products.isFeatured,
      isTrending: products.isTrending,
      isSeasonal: products.isSeasonal,
      isMostSelling: products.isMostSelling,
      isPlatformChoice: products.isPlatformChoice,
      sponsored: products.sponsored,
    })
    .from(products)
    .where(and(eq(products.sellerId, sellerId), inArray(products.id, ids), isNull(products.deletedAt)));
  const rows = lock ? await base.for("update") : await base;
  if (!rows.length) return [];
  const found = rows.map((r) => r.id);

  // Sequential: inside a transaction both queries share one connection.
  const variants = await q
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        title: productVariants.title,
        price: productVariants.price,
        stock: productVariants.stock,
        discountEndsAt: productVariants.discountEndsAt,
        position: productVariants.position,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, found));
  const translations = await q
      .select({
        productId: productTranslations.productId,
        locale: productTranslations.locale,
        slug: productTranslations.slug,
        title: productTranslations.title,
      })
      .from(productTranslations)
      .where(inArray(productTranslations.productId, found));

  const order = new Map(ids.map((id, i) => [id, i]));
  return rows
    .map((row) => {
      const own = translations.filter((t) => t.productId === row.id);
      const title =
        own.find((t) => t.locale === locale)?.title || own.find((t) => t.title)?.title || "";
      return {
        ...row,
        status: row.status as ProductStatus,
        quantity: Math.max(0, Math.trunc(Number(row.quantity) || 0)),
        title,
        slugs: own.map((t) => ({ locale: t.locale, slug: t.slug })),
        variants: variants
          .filter((v) => v.productId === row.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((v) => ({
            id: v.id,
            title: v.title,
            price: v.price,
            stock: v.stock ?? 0,
            discountEndsAt: canonicalTime(v.discountEndsAt),
          })),
      };
    })
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

function snapshot(row: LoadedRow, values: ProductValues = {}): ProductCacheSnapshot {
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

/** Writes `values` to one product and its variants inside `tx`, scoped by seller. */
async function writeValues(tx: Tx, sellerId: string, productId: string, values: ProductValues, now: string): Promise<boolean> {
  const set: Partial<typeof products.$inferInsert> = { updatedAt: now };
  if ("price" in values) set.price = values.price as typeof products.$inferInsert.price;
  if ("quantity" in values) set.quantity = String(values.quantity ?? 0);
  if ("status" in values && values.status) set.status = values.status;
  const updated = await tx
    .update(products)
    .set(set)
    .where(and(eq(products.id, productId), eq(products.sellerId, sellerId), isNull(products.deletedAt)))
    .returning({ id: products.id });
  if (!updated.length) return false;

  for (const v of values.variants ?? []) {
    const vset: Partial<typeof productVariants.$inferInsert> = { updatedAt: now };
    if ("price" in v) vset.price = v.price as typeof productVariants.$inferInsert.price;
    if ("stock" in v) vset.stock = Math.max(0, v.stock ?? 0);
    if ("discountEndsAt" in v) vset.discountEndsAt = v.discountEndsAt ?? null;
    // The product row above is already checked to be this seller's.
    await tx
      .update(productVariants)
      .set(vset)
      .where(and(eq(productVariants.id, v.id), eq(productVariants.productId, productId)));
  }
  return true;
}

/** Category counts and cache purge for products whose values changed. */
async function afterWrite(changes: { row: LoadedRow; before: ProductValues; after: ProductValues }[]): Promise<void> {
  const invalidations: CacheInvalidation[] = [];
  const inventory: Parameters<typeof invalidateProductInventory>[0][number][] = [];
  for (const { row, before, after } of changes) {
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

const undoKey = () => deriveUndoKey(parseIntegrationKey());

/** Before → after for every selected product; writes nothing. */
export async function previewBulkEditAction(input: unknown): Promise<BulkPreviewResult> {
  try {
    const seller = await requireSeller();
    const parsed = bulkEditInputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "invalidInput" };
    const ids = [...new Set(parsed.data.ids)];
    const locale = await getLocale();
    const rows = await loadRows(db, seller.sellerId, ids, false, locale);
    const plans = planBulkEdit(rows, parsed.data.change, { canPublish: canPublishFor(seller) });
    const found = new Set(rows.map((r) => r.id));
    const preview = previewRows(rows, plans, ids.filter((id) => !found.has(id)));
    return {
      success: true,
      rows: preview,
      changeCount: preview.filter((r) => r.outcome === "change").length,
      skipCount: preview.filter((r) => r.outcome === "skip").length,
    };
  } catch (error) {
    return failure(error, "preview");
  }
}

/** Applies the change in one transaction and returns a signed 10-minute Undo token. */
export async function applyBulkEditAction(input: unknown): Promise<BulkApplyResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const parsed = bulkEditInputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "invalidInput" };
    const ids = [...new Set(parsed.data.ids)];
    const key = undoKey(); // fail before writing if the key is missing
    const locale = await getLocale();
    const now = new Date().toISOString();

    const { changes, skipped } = await db.transaction(async (tx) => {
      await setStockContext(tx, { reason: "bulk_edit", actorId: seller.userId });
      const rows = await loadRows(tx, seller.sellerId, ids, true, locale);
      const plans = planBulkEdit(rows, parsed.data.change, { canPublish: canPublishFor(seller) });
      const done: { row: LoadedRow; before: ProductValues; after: ProductValues }[] = [];
      let skip = ids.length - rows.length;
      for (let i = 0; i < rows.length; i++) {
        const plan = plans[i]!;
        if (plan.outcome === "skip") skip += 1;
        if (plan.outcome !== "change") continue;
        if (await writeValues(tx, seller.sellerId, plan.id, plan.after, now)) {
          done.push({ row: rows[i]!, before: plan.before, after: plan.after });
        }
      }
      return { changes: done, skipped: skip };
    });

    await afterWrite(changes);
    if (!changes.length) return { success: true, changed: 0, skipped, undoToken: null, undoExpiresAt: null };
    const entries: UndoEntry[] = changes.map((c) => ({ id: c.row.id, b: c.before, a: c.after }));
    const { token, expiresAt } = signUndoToken(seller.sellerId, entries, key);
    return { success: true, changed: changes.length, skipped, undoToken: token, undoExpiresAt: expiresAt };
  } catch (error) {
    return failure(error, "apply");
  }
}

/**
 * Puts back what a bulk edit replaced, within 10 minutes. Only the session's
 * seller's own token is accepted, and a product is restored only while it
 * still holds exactly the values the edit wrote (else it counts as a conflict
 * and is left alone).
 */
export async function undoBulkEditAction(token: unknown): Promise<BulkUndoResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const payload = verifyUndoToken(token, undoKey());
    if (!payload || payload.sellerId !== seller.sellerId) return { success: false, error: "expired" };
    const ids = [...new Set(payload.entries.map((e) => e.id))].slice(0, 500);
    const locale = await getLocale();
    const now = new Date().toISOString();
    const canPublish = canPublishFor(seller);

    const { changes, conflicts } = await db.transaction(async (tx) => {
      await setStockContext(tx, { reason: "bulk_edit", actorId: seller.userId });
      const rows = new Map((await loadRows(tx, seller.sellerId, ids, true, locale)).map((r) => [r.id, r]));
      const done: { row: LoadedRow; before: ProductValues; after: ProductValues }[] = [];
      let conflict = 0;
      for (const entry of payload.entries) {
        const row = rows.get(entry.id);
        if (!row || !sameValues(currentValues(row, entry.a), entry.a)) {
          conflict += 1;
          continue;
        }
        const restore: ProductValues = { ...entry.b };
        if (restore.status) restore.status = undoStatus(restore.status, { canPublish, hasImage: hasProductImage(row.images) });
        if (await writeValues(tx, seller.sellerId, row.id, restore, now)) {
          done.push({ row, before: entry.a, after: restore });
        } else {
          conflict += 1;
        }
      }
      return { changes: done, conflicts: conflict };
    });

    await afterWrite(changes);
    return { success: true, restored: changes.length, conflicts };
  } catch (error) {
    return failure(error, "undo");
  }
}
