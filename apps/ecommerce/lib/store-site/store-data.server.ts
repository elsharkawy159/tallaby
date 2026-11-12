import { cacheProfiles, couponTags, createCachedQuery, productTags, reviewTags, storeTags } from "@workspace/cache";
import { sellerBrandList, sellerCoupons, sellerPopupCoupons, storeProductSales, storeReviewStats, storeReviews } from "@workspace/lib/store-sites/catalog-data";
import { BEST_SELLER_DAYS, TRENDING_DAYS } from "@workspace/lib/store-sites/catalog-data.lib";
import { storefrontCatalogTags } from "@/lib/storefront.server";

/**
 * Store data for builder sections on a store host (P4B-05), cached per
 * seller and store (CLAUDE.md rule 8): units sold, the seller's brands,
 * approved reviews and coupons. Never carts, orders or wallets themselves;
 * sales are aggregated counts per product only.
 */

/** Units sold per product in this store, as plain pairs (cache-serialisable). */
export const getCachedStoreSales = createCachedQuery({
  name: "storefront:store-sales:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string, _days: number) => [storeTags.catalog(sellerId, storeId), productTags.seller(sellerId)],
  query: async (sellerId: string, storeId: string, days: number) => [...(await storeProductSales(sellerId, storeId, days)).entries()],
});

export const SALES_DAYS = { "best-sellers": BEST_SELLER_DAYS, trending: TRENDING_DAYS } as const;

/**
 * The store's brand list (F-87d): the seller's whole list before the catalog
 * split, the store's own after it (`taxonomyInStore`). Keyed by seller, store
 * and `catalogSplit` (read by the caller, outside the cached function), so an
 * entry never mixes stores or modes; tagged with the seller (taxonomy writes
 * still purge it, rule 8) and the store.
 */
export const getCachedSellerBrands = createCachedQuery({
  name: "storefront:seller-brands:v3",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string, _catalogSplit: boolean) => [productTags.seller(sellerId), productTags.store(sellerId, storeId)],
  query: (sellerId: string, storeId: string, catalogSplit: boolean) => sellerBrandList(sellerId, { storeId, catalogSplit }),
});

/**
 * Approved reviews of the products this store shows (`productInStore`, scope
 * `shown`), per store and catalog mode: `catalogSplit` is read by the caller,
 * outside the cached function (F-87c).
 */
export const getCachedStoreReviews = createCachedQuery({
  name: "storefront:store-reviews:v2",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string, _limit: number, _minRating: number, _catalogSplit: boolean) => [
    reviewTags.seller(sellerId),
    ...storefrontCatalogTags(sellerId, storeId),
  ],
  query: (sellerId: string, storeId: string, limit: number, minRating: number, catalogSplit: boolean) =>
    storeReviews(sellerId, { storeId, catalogSplit }, { limit, minRating: minRating || undefined }),
});

export const getCachedStoreReviewStats = createCachedQuery({
  name: "storefront:store-review-stats:v2",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string, _catalogSplit: boolean) => [reviewTags.seller(sellerId), ...storefrontCatalogTags(sellerId, storeId)],
  query: (sellerId: string, storeId: string, catalogSplit: boolean) => storeReviewStats(sellerId, { storeId, catalogSplit }),
});

/**
 * Coupon rows only; whether one is live is decided per request (start/end dates).
 * Per store (F-87k): this store's coupons and the "All stores" ones, keyed by
 * seller and store. Tagged with the seller, so any coupon write (a store's or
 * an all-stores one) purges every store's entry.
 */
export const getCachedSellerCoupons = createCachedQuery({
  name: "storefront:seller-coupons:v2",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, _storeId: string, _ids: string) => [couponTags.seller(sellerId)],
  query: (sellerId: string, storeId: string, ids: string) => sellerCoupons(sellerId, storeId, ids.split(",").filter(Boolean)),
});

/** The store's pop-up coupons (0114; its own and "All stores", F-87k); `pickStoreCouponOffer` picks the live one per request. */
export const getCachedSellerPopupCoupons = createCachedQuery({
  name: "storefront:seller-popup-coupons:v2",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, _storeId: string) => [couponTags.seller(sellerId)],
  query: (sellerId: string, storeId: string) => sellerPopupCoupons(sellerId, storeId),
});
