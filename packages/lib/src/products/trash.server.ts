import {
  invalidateProduct,
  mergeInvalidations,
  type CacheInvalidation,
  type ProductCacheSnapshot,
} from "@workspace/cache";
import {
  and,
  asc,
  cartItems,
  db,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lt,
  orderItems,
  products,
  reviews,
  searchLogs,
  sql,
} from "@workspace/db";
import { syncCategoryProductCountForProductChange } from "@workspace/db/categories";
import {
  restoredStatus,
  trashIds,
  trashPurgeCutoff,
  type ProductStatusValue,
} from "./trash.lib";

/**
 * Product Trash (0123, ROADMAP.md F-35). Server-only.
 *
 * Trashing sets `status = 'draft'` (every storefront, marketplace, search and
 * checkout read already requires 'active'), keeps the old status in
 * `trashed_status`, and removes the product from shoppers' carts. Restore
 * puts the status back. Deleting for good removes the row, or, when orders
 * still point to it, stamps `purged_at` and keeps it for order history.
 *
 * Every seller function takes the session's sellerId and scopes each write by
 * it (CLAUDE.md rule 5); ids from the client are only ever matched together
 * with that seller.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type TrashedProduct = {
  id: string;
  title: string;
  image: string | null;
  deletedAt: string;
  /** The status Restore puts back (before the publish checks). */
  trashedStatus: ProductStatusValue | null;
};

const snapshotColumns = {
  id: true,
  sellerId: true,
  categoryId: true,
  brandId: true,
  status: true,
  isFeatured: true,
  isTrending: true,
  isSeasonal: true,
  isMostSelling: true,
  isPlatformChoice: true,
  sponsored: true,
  price: true,
} as const;

type SnapshotRow = {
  id: string;
  sellerId: string;
  categoryId: string;
  brandId: string | null;
  status: ProductStatusValue | null;
  isFeatured: boolean | null;
  isTrending: boolean | null;
  isSeasonal: boolean | null;
  isMostSelling: boolean | null;
  isPlatformChoice: boolean | null;
  sponsored: boolean | null;
  price: unknown;
  productTranslations: { locale: string; slug: string | null }[];
};

function toSnapshot(row: SnapshotRow, status = row.status): ProductCacheSnapshot {
  return {
    id: row.id,
    sellerId: row.sellerId,
    categoryId: row.categoryId,
    brandId: row.brandId,
    slugs: row.productTranslations.map((t) => ({ locale: t.locale, slug: t.slug })),
    status: status ?? "draft",
    isFeatured: row.isFeatured ?? false,
    isTrending: row.isTrending ?? false,
    isSeasonal: row.isSeasonal ?? false,
    isMostSelling: row.isMostSelling ?? false,
    isPlatformChoice: row.isPlatformChoice ?? false,
    sponsored: row.sponsored ?? false,
    priceKey: JSON.stringify(row.price ?? null),
  };
}

function hasImage(images: unknown): boolean {
  const list = Array.isArray(images) ? images : typeof images === "string" ? [images] : [];
  return list.some((image) => typeof image === "string" && image.trim() !== "");
}

const noInvalidation: CacheInvalidation = { tags: [], paths: [] };

/** The seller's products in Trash (not yet deleted for good), newest first. */
export async function listTrashedProducts(sellerId: string, locale: "ar" | "en"): Promise<TrashedProduct[]> {
  const rows = await db.query.products.findMany({
    where: and(eq(products.sellerId, sellerId), isNotNull(products.deletedAt), isNull(products.purgedAt)),
    columns: { id: true, images: true, deletedAt: true, trashedStatus: true },
    with: { productTranslations: { columns: { locale: true, title: true } } },
    orderBy: [desc(products.deletedAt)],
    limit: 500,
  });
  return rows.map((row) => {
    const title =
      row.productTranslations.find((t) => t.locale === locale)?.title ||
      row.productTranslations.find((t) => t.title)?.title ||
      "";
    const images = Array.isArray(row.images) ? row.images : [];
    const image = images.find((i): i is string => typeof i === "string" && i.trim() !== "") ?? null;
    return { id: row.id, title, image, deletedAt: row.deletedAt!, trashedStatus: row.trashedStatus };
  });
}

/** How many products the seller has in Trash (for the sidebar/tab count). */
export async function countTrashedProducts(sellerId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(products)
    .where(and(eq(products.sellerId, sellerId), isNotNull(products.deletedAt), isNull(products.purgedAt)));
  return row?.n ?? 0;
}

/** Moves the seller's products to Trash. Products already there are left as they are. */
export async function trashProducts(
  sellerId: string,
  deletedBy: string,
  ids: unknown,
): Promise<{ trashed: string[]; invalidation: CacheInvalidation }> {
  const wanted = trashIds(ids);
  if (!wanted.length) return { trashed: [], invalidation: noInvalidation };

  const rows = await db.query.products.findMany({
    where: and(eq(products.sellerId, sellerId), inArray(products.id, wanted), isNull(products.deletedAt)),
    columns: snapshotColumns,
    with: { productTranslations: { columns: { locale: true, slug: true } } },
  });
  if (!rows.length) return { trashed: [], invalidation: noInvalidation };

  const now = new Date().toISOString();
  const trashed = await db.transaction(async (tx) => {
    const updated = await tx
      .update(products)
      .set({
        trashedStatus: sql`${products.status}`,
        status: "draft",
        deletedAt: now,
        deletedBy,
        updatedAt: now,
      })
      .where(
        and(
          eq(products.sellerId, sellerId),
          inArray(
            products.id,
            rows.map((r) => r.id),
          ),
          isNull(products.deletedAt),
        ),
      )
      .returning({ id: products.id });
    const done = updated.map((u) => u.id);
    // Shoppers' carts drop it now, so carts, checkout totals and reminder emails never show it.
    if (done.length) await tx.delete(cartItems).where(inArray(cartItems.productId, done));
    return done;
  });

  const done = new Set(trashed);
  const invalidations: CacheInvalidation[] = [];
  for (const row of rows) {
    if (!done.has(row.id)) continue;
    await syncCategoryProductCountForProductChange({ categoryId: row.categoryId, previousStatus: row.status, nextStatus: "draft" });
    invalidations.push(invalidateProduct(toSnapshot(row), toSnapshot(row, "draft")));
  }
  return { trashed, invalidation: mergeInvalidations(...invalidations) };
}

/**
 * Brings the seller's products back from Trash with the status they had,
 * except a live product that can't go live now comes back as a draft.
 */
export async function restoreProducts(
  sellerId: string,
  ids: unknown,
  { canPublish }: { canPublish: boolean },
): Promise<{ restored: string[]; invalidation: CacheInvalidation }> {
  const wanted = trashIds(ids);
  if (!wanted.length) return { restored: [], invalidation: noInvalidation };

  const rows = await db.query.products.findMany({
    where: and(
      eq(products.sellerId, sellerId),
      inArray(products.id, wanted),
      isNotNull(products.deletedAt),
      isNull(products.purgedAt),
    ),
    columns: { ...snapshotColumns, images: true, trashedStatus: true },
    with: { productTranslations: { columns: { locale: true, slug: true } } },
  });

  const restored: string[] = [];
  const invalidations: CacheInvalidation[] = [];
  const now = new Date().toISOString();
  for (const row of rows) {
    const status = restoredStatus(row.trashedStatus, { canPublish, hasImage: hasImage(row.images) });
    const updated = await db
      .update(products)
      .set({ status, deletedAt: null, deletedBy: null, trashedStatus: null, updatedAt: now })
      .where(and(eq(products.id, row.id), eq(products.sellerId, sellerId), isNotNull(products.deletedAt), isNull(products.purgedAt)))
      .returning({ id: products.id });
    if (!updated.length) continue;
    restored.push(row.id);
    await syncCategoryProductCountForProductChange({ categoryId: row.categoryId, previousStatus: row.status, nextStatus: status });
    invalidations.push(invalidateProduct(toSnapshot(row), toSnapshot(row, status)));
  }
  return { restored, invalidation: mergeInvalidations(...invalidations) };
}

/**
 * Deletes one trashed product for good inside `tx`: its cart lines, search
 * click links and reviews go first (those keys don't cascade). When orders
 * still point to it the row stays, stamped `purged_at`, for order history.
 */
async function purgeOne(tx: Tx, productId: string, now: string): Promise<"deleted" | "kept"> {
  await tx.delete(cartItems).where(eq(cartItems.productId, productId));
  await tx.update(searchLogs).set({ clickedProductId: null }).where(eq(searchLogs.clickedProductId, productId));
  const [ordered] = await tx.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.productId, productId)).limit(1);
  if (ordered) {
    await tx.update(products).set({ purgedAt: now, updatedAt: now }).where(eq(products.id, productId));
    return "kept";
  }
  await tx.delete(reviews).where(eq(reviews.productId, productId));
  await tx.delete(products).where(and(eq(products.id, productId), isNotNull(products.deletedAt)));
  return "deleted";
}

/** "Delete forever" from the seller's Trash. Only products already in Trash. */
export async function deleteTrashedProductsForever(sellerId: string, ids: unknown): Promise<{ deleted: string[] }> {
  const wanted = trashIds(ids);
  if (!wanted.length) return { deleted: [] };
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.sellerId, sellerId), inArray(products.id, wanted), isNotNull(products.deletedAt), isNull(products.purgedAt)));
  const now = new Date().toISOString();
  const deleted: string[] = [];
  for (const row of rows) {
    await db.transaction((tx) => purgeOne(tx, row.id, now));
    deleted.push(row.id);
  }
  return { deleted };
}

/**
 * The daily job (F-35e): deletes products trashed more than 30 days ago,
 * oldest first, at most `limit` per run. Idempotent; returns counts only.
 * Trashed products are already 'draft', so no shopper-facing cache changes.
 */
export async function purgeExpiredTrash({ now = new Date(), limit = 500 }: { now?: Date; limit?: number } = {}): Promise<{
  deleted: number;
  kept: number;
}> {
  const due = await db
    .select({ id: products.id })
    .from(products)
    .where(and(isNotNull(products.deletedAt), isNull(products.purgedAt), lt(products.deletedAt, trashPurgeCutoff(now).toISOString())))
    .orderBy(asc(products.deletedAt))
    .limit(limit);
  const stamp = now.toISOString();
  let deleted = 0;
  let kept = 0;
  for (const row of due) {
    const result = await db.transaction((tx) => purgeOne(tx, row.id, stamp));
    if (result === "deleted") deleted += 1;
    else kept += 1;
  }
  return { deleted, kept };
}
