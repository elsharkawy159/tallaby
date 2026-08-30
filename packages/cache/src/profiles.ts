/**
 * TTL profiles (seconds), used as the `revalidate` backstop passed to
 * unstable_cache and as the profile name passed to revalidateTag(tag, profile).
 *
 * These are a safety net for a dropped cross-app invalidation broadcast, not
 * the primary freshness mechanism — the primary mechanism is the tag-based
 * invalidation triggered by mutations. If a peer app is unreachable when a
 * mutation broadcasts, the TTL below bounds how stale a read can get.
 */
export const cacheProfiles = {
  /** Single-entity detail reads: product/brand/category/seller by id or slug. */
  detail: 3600,
  /** Multi-item listings, collections, filtered/sorted product grids. */
  listing: 900,
  /** Aggregate filter facets (price range, category counts, brand counts). */
  filterOptions: 1800,
  /** Category and brand trees — change rarely, admin-curated. */
  taxonomy: 86400,
  /** Seller public storefront/profile data. */
  seller: 3600,
  /** Product reviews and Q&A. */
  reviews: 900,
  /** Search suggestions / trending terms. */
  search: 600,
} as const;

export type CacheProfileName = keyof typeof cacheProfiles;
