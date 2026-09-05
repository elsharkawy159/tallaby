import {
  brandTags,
  categoryTags,
  productTags,
  reviewTags,
  sellerTags,
} from "./tags";

/**
 * Pure, framework-free mutation -> cache-invalidation descriptors.
 *
 * Nothing in this file imports next/cache or a database client, so it can be
 * unit tested directly (see packages/cache/src/invalidate.test.ts) without a
 * Next.js runtime or a Postgres connection. apply.ts is the only place that
 * turns a CacheInvalidation into an actual revalidateTag/revalidatePath call.
 */

export type ProductStatus = "draft" | "pending" | "active" | "rejected";

/**
 * The minimal set of fields that drive cache invalidation for a product.
 * Callers build this from a DB row (or two rows: before/after a mutation).
 */
export interface ProductCacheSnapshot {
  id: string;
  sellerId: string;
  categoryId: string | null;
  brandId: string | null;
  /** One entry per locale translation row that carries a slug. */
  slugs: { locale: string; slug: string | null }[];
  status: ProductStatus;
  isFeatured: boolean;
  isTrending: boolean;
  isSeasonal: boolean;
  isMostSelling: boolean;
  isPlatformChoice: boolean;
  /** Serialized price (e.g. JSON.stringify of the price jsonb column) — used only for change detection. */
  priceKey: string;
}

export interface CacheInvalidation {
  tags: string[];
  paths: { path: string; type?: "layout" | "page" }[];
}

function inv(
  tags: readonly string[],
  paths: CacheInvalidation["paths"] = []
): CacheInvalidation {
  // De-dupe tags — a mutation that touches many dimensions at once
  // (e.g. category change + price change) must not double-broadcast.
  return { tags: Array.from(new Set(tags)), paths };
}

export function mergeInvalidations(
  ...invs: readonly CacheInvalidation[]
): CacheInvalidation {
  const tags = new Set<string>();
  const pathKeys = new Set<string>();
  const paths: CacheInvalidation["paths"] = [];
  for (const i of invs) {
    for (const t of i.tags) tags.add(t);
    for (const p of i.paths) {
      const key = `${p.type ?? ""}:${p.path}`;
      if (!pathKeys.has(key)) {
        pathKeys.add(key);
        paths.push(p);
      }
    }
  }
  return { tags: [...tags], paths };
}

const isVisible = (s: ProductCacheSnapshot) => s.status === "active";

/**
 * The core product mutation -> invalidation rule.
 *
 * `before` is null on create. `after` is null on delete (its data must be
 * captured BEFORE the delete statement runs — see docs/caching-and-data-fetching.md).
 */
export function invalidateProduct(
  before: ProductCacheSnapshot | null,
  after: ProductCacheSnapshot | null
): CacheInvalidation {
  const ref = after ?? before;
  if (!ref) return inv([]);

  const tags = new Set<string>();

  // Always: the entity itself, every known slug (old + new), both sellers
  // (a seller never actually changes today, but this is the rule that makes
  // A -> B category/brand changes symmetric, applied consistently).
  tags.add(productTags.detail(ref.id));
  for (const snap of [before, after]) {
    if (!snap) continue;
    tags.add(productTags.seller(snap.sellerId));
    for (const { locale, slug } of snap.slugs) {
      if (slug) tags.add(productTags.slug(locale, slug));
    }
  }

  // Category / brand: invalidate BOTH the old and new relationship so an
  // A -> B move purges both listings, not just the destination.
  for (const snap of [before, after]) {
    if (!snap) continue;
    if (snap.categoryId) tags.add(productTags.category(snap.categoryId));
    if (snap.brandId) tags.add(productTags.brand(snap.brandId));
  }

  const created = before === null && after !== null;
  const deleted = before !== null && after === null;
  const visibilityChanged =
    before !== null && after !== null && isVisible(before) !== isVisible(after);
  const priceChanged =
    before !== null && after !== null && before.priceKey !== after.priceKey;
  const categoryChanged =
    before !== null &&
    after !== null &&
    before.categoryId !== after.categoryId;
  // Active product counts drive category:top / taxonomy caches on ecommerce.
  const categoryCountsChanged =
    created ||
    deleted ||
    visibilityChanged ||
    (categoryChanged && (isVisible(before!) || isVisible(after!)));

  // Structural change: the product entered/left the catalog, or its
  // visibility flipped. Listings, filter facets and the "all" bump are only
  // needed when something a listing/filter query depends on actually moved.
  if (created || deleted || visibilityChanged) {
    tags.add(productTags.listing());
    tags.add(productTags.filterOptions());
    tags.add(productTags.all());
  }

  // Ecommerce category queries cache active product counts (top categories,
  // showcase empty-state filters, breadcrumb counts). Purge on approval
  // (pending→active), delete, create, or moving a visible product A→B.
  if (categoryCountsChanged) {
    tags.add(categoryTags.all());
    tags.add(categoryTags.tree());
    tags.add(categoryTags.top());
  }

  // Price drives sorted ("price_asc"/"price_desc") and filtered
  // (min/maxPrice) listings, and the category/brand pages that show it.
  if (priceChanged) {
    tags.add(productTags.listing());
    if (ref.categoryId) tags.add(productTags.category(ref.categoryId));
    if (ref.brandId) tags.add(productTags.brand(ref.brandId));
  }

  // Flag toggles only invalidate the specific curated collection they feed —
  // NOT the general listing tag. A product entering OR leaving a collection
  // both invalidate it, so check whether the flag was true on either side.
  const touchesCollection = (
    key: keyof Pick<
      ProductCacheSnapshot,
      "isFeatured" | "isTrending" | "isSeasonal" | "isMostSelling" | "isPlatformChoice"
    >
  ) => Boolean(before?.[key]) || Boolean(after?.[key]);

  if (touchesCollection("isFeatured")) tags.add(productTags.featured());
  if (touchesCollection("isTrending")) tags.add(productTags.trending());
  if (touchesCollection("isSeasonal")) tags.add(productTags.seasonal());
  if (touchesCollection("isMostSelling")) tags.add(productTags.bestSelling());
  if (touchesCollection("isPlatformChoice")) tags.add(productTags.deals());
  if (created) tags.add(productTags.newArrivals());

  return inv([...tags]);
}

/**
 * Stock/availability-only invalidation. Deliberately narrow: changing
 * product stock must NOT invalidate customer profiles, unrelated seller
 * settings, or even the general listing cache — UNLESS the change actually
 * crossed the in-stock/out-of-stock boundary (detected by the caller from
 * the atomic decrement's RETURNING value, not guessed here).
 */
export function invalidateProductInventory(
  items: readonly {
    snapshot: Pick<
      ProductCacheSnapshot,
      "id" | "sellerId" | "categoryId" | "brandId"
    >;
    stockBoundaryCrossed: boolean;
  }[]
): CacheInvalidation {
  const tags = new Set<string>();
  for (const { snapshot, stockBoundaryCrossed } of items) {
    tags.add(productTags.inventory(snapshot.id));
    tags.add(productTags.detail(snapshot.id));
    if (stockBoundaryCrossed) {
      tags.add(productTags.listing());
      if (snapshot.categoryId) tags.add(productTags.category(snapshot.categoryId));
      if (snapshot.brandId) tags.add(productTags.brand(snapshot.brandId));
    }
  }
  return inv([...tags]);
}

export function invalidateSellerProducts(sellerId: string): CacheInvalidation {
  return inv([productTags.seller(sellerId), sellerTags.storefront(sellerId)]);
}

export function invalidateCategory(id: string, slug?: string): CacheInvalidation {
  const tags = [
    categoryTags.detail(id),
    categoryTags.all(),
    categoryTags.tree(),
    categoryTags.top(),
  ];
  if (slug) tags.push(categoryTags.slug(slug));
  return inv(tags);
}

/** Full taxonomy purge — used by admin's manual "Refresh" control. */
export function invalidateAllCategories(): CacheInvalidation {
  return inv([categoryTags.all(), categoryTags.tree(), categoryTags.top()]);
}

export function invalidateBrand(id: string, slug?: string): CacheInvalidation {
  const tags = [brandTags.detail(id), brandTags.all()];
  if (slug) tags.push(brandTags.slug(slug));
  return inv(tags);
}

export function invalidateSeller(id: string, slug?: string): CacheInvalidation {
  const tags = [sellerTags.detail(id), sellerTags.storefront(id)];
  if (slug) tags.push(sellerTags.slug(slug));
  return inv(tags);
}

export function invalidateReviewsForProduct(
  productId: string,
  sellerId?: string
): CacheInvalidation {
  const tags = [reviewTags.product(productId), productTags.detail(productId)];
  if (sellerId) tags.push(reviewTags.seller(sellerId));
  return inv(tags);
}
