/**
 * Which order a store category page lists its products in (ROADMAP.md F-24d,
 * 0128). A seller category's default sort is "Featured": the seller's manual
 * order (Products › Categories › Arrange products), then the rest newest
 * first; that order itself is SQL in `getProducts` (`sortBy: "featured"`).
 * Every explicit sort the shopper picks keeps working as before.
 */

export type ListingSortBy = "price_asc" | "price_desc" | "rating" | "newest" | "popular" | "featured";

/** The storefront sort select's values (`?sort=`), as `getProducts` sorts. */
export const STOREFRONT_SORT_MAP = {
  featured: "featured",
  "price-low": "price_asc",
  "price-high": "price_desc",
  rating: "rating",
  newest: "newest",
  popularity: "popular",
} as const satisfies Record<string, ListingSortBy>;

/**
 * The storefront catalog (/products on a store host): with no `?sort=` a
 * seller category opens on "Featured", anything else on "Most popular" (as
 * before). "Featured" outside a seller category is newest first.
 */
export function storefrontSortBy(sort: string | undefined, sellerCategoryId: string | null | undefined): ListingSortBy {
  const picked = sort ? STOREFRONT_SORT_MAP[sort as keyof typeof STOREFRONT_SORT_MAP] : undefined;
  if (picked === "featured") return sellerCategoryId ? "featured" : "newest";
  if (picked) return picked;
  return sellerCategoryId ? "featured" : "popular";
}

/**
 * A builder product list (`CatalogQuery` kind "products"): a category list on
 * its "default" sort uses the seller's order; every other list and sort is
 * unchanged (`undefined` keeps the caller's newest-first default).
 */
export function builderCategorySortBy(
  source: string | undefined,
  sort: string | undefined,
  explicit: ListingSortBy | undefined,
): ListingSortBy | undefined {
  if (explicit) return explicit;
  if (source === "category" && (!sort || sort === "default")) return "featured";
  return undefined;
}
