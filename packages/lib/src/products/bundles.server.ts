import { and, asc, db, eq, inArray, productBundleItems, products, productTranslations, productVariants, sql } from "@workspace/db";
import { formatVariantTitleFromCart, pickProductTitle } from "../orders/place-order.lib";
import { bundleAvailability, overlayBundleAvailability, type BundleAvailabilityItem, type BundleStockRow } from "./bundles.lib";

/**
 * Product bundles on the server (0188, ROADMAP.md F-07f; docs/plans/bundles.md
 * §2–§3): a bundle's items with what checkout snapshots and what its
 * availability needs. Never cached: stock is live (CLAUDE.md rule 8).
 *
 * Every read is scoped to one store: the item rows by `product_bundle_items.store_id`
 * and each item's own `products.store_id` is returned, so callers can refuse
 * an item outside that store (the DB guard already forbids it).
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type LoadedBundleItem = BundleAvailabilityItem & {
  bundleProductId: string;
  productId: string;
  sellerId: string;
  /** The item product's own store; the DB guard keeps it equal to the bundle's. */
  storeId: string | null;
  categoryId: string | null;
  brandId: string | null;
  /** The variant's SKU, else the product's. */
  sku: string | null;
  /** The item's title in the requested locale (`pickProductTitle`). */
  name: string;
  variantName: string | null;
  /** The item product's status (`active` = shoppers can open it). */
  status: string | null;
  /** Raw storage path or URL: the variant's photo, else the product's first one. */
  image: string | null;
  /** The item's slug in the requested locale, else in any locale. */
  slug: string | null;
};

function firstImage(value: unknown): string | null {
  const list = typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
  for (const entry of list) {
    const path =
      typeof entry === "string" ? entry : entry && typeof entry === "object" ? ((entry as { url?: unknown }).url ?? (entry as { path?: unknown }).path) : null;
    if (typeof path === "string" && path.trim()) return path.trim();
  }
  return null;
}

/**
 * The items of each bundle in `bundleProductIds`, in position order, read in
 * two queries for all ids (items, then their titles). A bundle with no item
 * rows in this store is missing from the map. Malformed ids are ignored.
 */
export async function loadBundleItems(
  storeId: string,
  bundleProductIds: readonly string[],
  { locale = "en", q = db }: { locale?: string; q?: Queryable } = {},
): Promise<Map<string, LoadedBundleItem[]>> {
  const result = new Map<string, LoadedBundleItem[]>();
  const ids = [...new Set(bundleProductIds)].filter((id) => UUID_RE.test(id));
  if (!UUID_RE.test(storeId) || ids.length === 0) return result;

  const rows = await q
    .select({
      bundleProductId: productBundleItems.bundleProductId,
      productId: productBundleItems.itemProductId,
      variantId: productBundleItems.itemVariantId,
      quantity: productBundleItems.quantity,
      sellerId: products.sellerId,
      storeId: products.storeId,
      categoryId: products.categoryId,
      brandId: products.brandId,
      productSku: products.sku,
      productQuantity: products.quantity,
      trackStock: products.trackStock,
      deletedAt: products.deletedAt,
      purgedAt: products.purgedAt,
      preorderEnabled: products.preorderEnabled,
      productType: products.productType,
      status: products.status,
      images: products.images,
      hasVariants: sql<boolean>`EXISTS (SELECT 1 FROM public.product_variants v WHERE v.product_id = ${products.id})`,
      variantRowId: productVariants.id,
      variantSku: productVariants.sku,
      variantStock: productVariants.stock,
      variantTitle: productVariants.title,
      option1: productVariants.option1,
      option2: productVariants.option2,
      option3: productVariants.option3,
      variantImageUrl: productVariants.imageUrl,
      variantImages: productVariants.images,
    })
    .from(productBundleItems)
    .innerJoin(products, eq(products.id, productBundleItems.itemProductId))
    .leftJoin(
      productVariants,
      and(eq(productVariants.id, productBundleItems.itemVariantId), eq(productVariants.productId, productBundleItems.itemProductId)),
    )
    .where(and(eq(productBundleItems.storeId, storeId), inArray(productBundleItems.bundleProductId, ids)))
    .orderBy(asc(productBundleItems.bundleProductId), asc(productBundleItems.position), asc(productBundleItems.createdAt));
  if (rows.length === 0) return result;

  const itemIds = [...new Set(rows.map((row) => row.productId))];
  const titles = await q
    .select({ productId: productTranslations.productId, locale: productTranslations.locale, title: productTranslations.title, slug: productTranslations.slug })
    .from(productTranslations)
    .where(inArray(productTranslations.productId, itemIds));

  for (const row of rows) {
    const own = titles.filter((title) => title.productId === row.productId);
    const slug = own.find((title) => title.locale === locale && title.slug?.trim())?.slug ?? own.find((title) => title.slug?.trim())?.slug ?? null;
    // A variant that no longer belongs to the item is treated as none chosen (availability 0).
    const variantId = row.variantRowId ?? null;
    const item: LoadedBundleItem = {
      bundleProductId: row.bundleProductId,
      productId: row.productId,
      variantId,
      quantity: row.quantity,
      sellerId: row.sellerId,
      storeId: row.storeId,
      categoryId: row.categoryId,
      brandId: row.brandId,
      trackStock: row.trackStock,
      stock: variantId ? (row.variantStock ?? null) : Number(row.productQuantity ?? 0),
      trashed: row.deletedAt != null || row.purgedAt != null,
      // Pre-order or digital since it was added (the 0188 guard checks only on add): the bundle can't be sold.
      preorder: row.preorderEnabled === true,
      digital: row.productType === "digital",
      hasVariants: row.hasVariants === true || variantId != null,
      sku: row.variantSku || row.productSku || null,
      name: pickProductTitle(
        own,
        locale,
        row.productSku,
        row.productId,
      ),
      variantName: variantId
        ? formatVariantTitleFromCart({ title: row.variantTitle, option1: row.option1, option2: row.option2, option3: row.option3 })
        : null,
      status: row.status ?? null,
      image: (variantId ? (firstImage(row.variantImages) ?? firstImage(row.variantImageUrl)) : null) ?? firstImage(row.images),
      slug,
    };
    const list = result.get(row.bundleProductId);
    if (list) list.push(item);
    else result.set(row.bundleProductId, [item]);
  }
  return result;
}

/**
 * How many of each bundle can be sold now (`bundleAvailability`): id → count,
 * null = unlimited. A bundle with no items in this store is 0, so every id
 * asked for is in the map.
 */
export async function bundleAvailabilityFor(
  storeId: string,
  bundleProductIds: readonly string[],
  q: Queryable = db,
): Promise<Map<string, number | null>> {
  const loaded = await loadBundleItems(storeId, bundleProductIds, { q });
  const result = new Map<string, number | null>();
  for (const id of new Set(bundleProductIds)) {
    const items = loaded.get(id) ?? [];
    result.set(id, items.some((item) => item.storeId !== storeId) ? 0 : bundleAvailability(items));
  }
  return result;
}

/**
 * The storefront's stock overlay (docs/plans/bundles.md §2): every bundle row of
 * `rows` gets its live availability (`overlayBundleAvailability`), read in one
 * `bundleAvailabilityFor` call for all of them, so a page or a list costs one
 * query set, never one per card. Rows without a bundle cost nothing. Apply it
 * AFTER a cached read: availability is never cached (CLAUDE.md rule 8), so an
 * item's stock change shows at once without purging the bundle's entries.
 * `storeId` is the request host's store; an item outside it counts as 0.
 */
export async function applyBundleAvailability<T extends BundleStockRow>(
  storeId: string,
  rows: readonly T[],
  q: Queryable = db,
): Promise<T[]> {
  const ids = rows.filter((row) => row.isBundle === true).map((row) => row.id);
  if (ids.length === 0) return [...rows];
  return overlayBundleAvailability(rows, await bundleAvailabilityFor(storeId, ids, q));
}
