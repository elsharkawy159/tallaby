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
  trending: () => "product:trending",
  seasonal: () => "product:seasonal",
  sponsored: () => "product:sponsored",
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
  /** Homepage / showcase ranking by active product count (ecommerce getTopCategories). */
  top: () => "category:top",
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
  /** The {subdomain}.tallaby.com storefront profile, cached by subdomain. */
  subdomain: (subdomain: string) => `seller:subdomain:${subdomain}`,
  /** Which store a custom domain (faster-eg.com) serves. */
  customDomain: (domain: string) => `seller:domain:${domain}`,
} as const;

/**
 * Store-scoped data (stores table, PLAN.md §8). Every tag carries the owning
 * seller id as well as the store id (CLAUDE.md rule 8).
 */
export const storeTags = {
  /** Connected tracking apps rendered on that store host (P7-03). */
  integrations: (sellerId: string, storeId: string) => `store:integrations:${sellerId}:${storeId}`,
  /** The store's published builder site (P5-01, P5-03). */
  site: (sellerId: string, storeId: string) => `store:site:${sellerId}:${storeId}`,
  /** The store's catalog mode and selected products (D24, P4-07). */
  catalog: (sellerId: string, storeId: string) => `store:catalog:${sellerId}:${storeId}`,
  /** Published blog posts and CMS items of the store (P4-16, P4-11). Never drafts. */
  cms: (sellerId: string, storeId: string) => `store:cms:${sellerId}:${storeId}`,
  /** Store views read from Tallaby's GA4 property (SA-01). Dashboard only. */
  views: (sellerId: string, storeId: string) => `store:views:${sellerId}:${storeId}`,
  /**
   * Dashboard › Reports (ROADMAP.md F-15a): counts and sums per store and
   * period only, never order, customer or wallet rows. Short TTL, no purges.
   */
  reports: (sellerId: string, storeId: string) => `store:reports:${sellerId}:${storeId}`,
  /** The sales pop-up's anonymised recent-orders feed (ROADMAP.md F-22a). Short TTL; no per-customer data. */
  recentOrders: (sellerId: string, storeId: string) => `store:recent-orders:${sellerId}:${storeId}`,
} as const;

export const reviewTags = {
  product: (productId: string) => `review:product:${productId}`,
  seller: (sellerId: string) => `review:seller:${sellerId}`,
} as const;

export const couponTags = {
  available: () => "coupon:available",
  seller: (sellerId: string) => `coupon:seller:${sellerId}`,
} as const;

/** The platform template gallery (templates, versions, install counts). No seller data. */
export const templateTags = {
  catalog: () => "template:catalog",
} as const;

/**
 * The published section library (`library_sections`, 0086) the editor's
 * Add › Sections lists. Platform data, no seller data; drafts are never cached.
 */
export const librarySectionTags = {
  catalog: () => "library:sections",
} as const;

/** The tallaby.com blog written in the admin app (0073). Published posts only; no seller data. */
export const marketingBlogTags = {
  posts: () => "marketing-blog:posts",
} as const;

/** The tallaby.com home "stores on Tallaby" wall: published stores, logos and product counts. Public data only. */
export const marketingStoreTags = {
  showcase: () => "marketing-stores:showcase",
} as const;

/** The Tallaby fulfillment plan catalog. No seller data; seller requests are never cached. */
export const fulfillmentTags = {
  plans: () => "fulfillment:plans",
} as const;

/**
 * Admin-only aggregates that hold no money and no per-customer data
 * (docs/admin-saas.md §4.2). Wallets, queues and orders are never cached.
 */
export const adminTags = {
  /** Store integration counts per provider and status. */
  integrationSummary: () => "admin:integration-summary",
} as const;

export const searchTags = {
  suggestions: () => "search:suggestions",
  trending: () => "search:trending",
  /** Public stock-photo search results (editor Explore tab); no seller data. */
  stockPhotos: () => "search:stock-photos",
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
export type StoreTag = ReturnType<(typeof storeTags)[keyof typeof storeTags]>;
export type ReviewTag = ReturnType<
  (typeof reviewTags)[keyof typeof reviewTags]
>;
export type CouponTag = ReturnType<
  (typeof couponTags)[keyof typeof couponTags]
>;
export type SearchTag = ReturnType<
  (typeof searchTags)[keyof typeof searchTags]
>;
