/**
 * Centralized cache-tag registry.
 *
 * Every cache tag used anywhere in the monorepo is produced by one of these
 * builders. Do not hand-write a tag string outside this file — that is what
 * caused the single global "products" tag today, where any mutation purges
 * every listing.
 *
 * There are deliberately NO tag builders for orders, carts, wishlists,
 * addresses, profiles, notifications, or payouts. That data is never cached
 * (see docs/caching-and-data-fetching.md) and the absence of a tag is the
 * enforcement — if you find yourself wanting one, the data you're tagging
 * should not be behind unstable_cache in the first place.
 */

export const productTags = {
  /** Bump on any structural catalog change (create/delete, visibility flip). */
  all: () => "product:all",
  detail: (id: string) => `product:id:${id}`,
  slug: (locale: string, slug: string) => `product:slug:${locale}:${slug}`,
  /** Stock/availability only — never bundle with listing/category/brand tags. */
  inventory: (id: string) => `product:inventory:${id}`,
  listing: () => "product:listing",
  category: (categoryId: string) => `product:category:${categoryId}`,
  brand: (brandId: string) => `product:brand:${brandId}`,
  seller: (sellerId: string) => `product:seller:${sellerId}`,
  featured: () => "product:featured",
  bestSelling: () => "product:best-selling",
  deals: () => "product:deals",
  newArrivals: () => "product:new-arrivals",
  filterOptions: () => "product:filter-options",
} as const;

export const categoryTags = {
  all: () => "category:all",
  detail: (id: string) => `category:id:${id}`,
  slug: (slug: string) => `category:slug:${slug}`,
  tree: () => "category:tree",
} as const;

export const brandTags = {
  all: () => "brand:all",
  detail: (id: string) => `brand:id:${id}`,
  slug: (slug: string) => `brand:slug:${slug}`,
  popular: () => "brand:popular",
  featured: () => "brand:featured",
} as const;

export const sellerTags = {
  detail: (id: string) => `seller:id:${id}`,
  slug: (slug: string) => `seller:slug:${slug}`,
  storefront: (id: string) => `seller:storefront:${id}`,
} as const;

export const reviewTags = {
  product: (productId: string) => `review:product:${productId}`,
  seller: (sellerId: string) => `review:seller:${sellerId}`,
} as const;

export const couponTags = {
  available: () => "coupon:available",
  seller: (sellerId: string) => `coupon:seller:${sellerId}`,
} as const;

export const searchTags = {
  suggestions: () => "search:suggestions",
  trending: () => "search:trending",
} as const;

export type ProductTag = ReturnType<
  (typeof productTags)[keyof typeof productTags]
>;
export type CategoryTag = ReturnType<
  (typeof categoryTags)[keyof typeof categoryTags]
>;
export type BrandTag = ReturnType<(typeof brandTags)[keyof typeof brandTags]>;
export type SellerTag = ReturnType<
  (typeof sellerTags)[keyof typeof sellerTags]
>;
export type ReviewTag = ReturnType<
  (typeof reviewTags)[keyof typeof reviewTags]
>;
export type CouponTag = ReturnType<
  (typeof couponTags)[keyof typeof couponTags]
>;
export type SearchTag = ReturnType<
  (typeof searchTags)[keyof typeof searchTags]
>;
