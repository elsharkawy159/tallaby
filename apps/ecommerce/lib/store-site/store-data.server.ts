import { cacheProfiles, couponTags, createCachedQuery, productTags, reviewTags, storeTags } from "@workspace/cache";
import { sellerBrandList, sellerCoupons, sellerPopupCoupons, storeProductSales, storeReviewStats, storeReviews } from "@workspace/lib/store-sites/catalog-data";
import { BEST_SELLER_DAYS, TRENDING_DAYS } from "@workspace/lib/store-sites/catalog-data.lib";

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

export const getCachedSellerBrands = createCachedQuery({
  name: "storefront:seller-brands:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string) => [productTags.seller(sellerId)],
  query: (sellerId: string) => sellerBrandList(sellerId),
});

/** `catalogStoreId`: the store in selected catalog mode, else "" (cache keys need a value). */
export const getCachedStoreReviews = createCachedQuery({
  name: "storefront:store-reviews:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, _catalogStoreId: string, _limit: number, _minRating: number) => [reviewTags.seller(sellerId), productTags.seller(sellerId)],
  query: (sellerId: string, catalogStoreId: string, limit: number, minRating: number) =>
    storeReviews(sellerId, catalogStoreId || undefined, { limit, minRating: minRating || undefined }),
});

export const getCachedStoreReviewStats = createCachedQuery({
  name: "storefront:store-review-stats:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, _catalogStoreId: string) => [reviewTags.seller(sellerId), productTags.seller(sellerId)],
  query: (sellerId: string, catalogStoreId: string) => storeReviewStats(sellerId, catalogStoreId || undefined),
});

/** Coupon rows only; whether one is live is decided per request (start/end dates). */
export const getCachedSellerCoupons = createCachedQuery({
  name: "storefront:seller-coupons:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, _ids: string) => [couponTags.seller(sellerId)],
  query: (sellerId: string, ids: string) => sellerCoupons(sellerId, ids.split(",").filter(Boolean)),
});

/** The seller's store pop-up coupons (0114); `pickStoreCouponOffer` picks the live one per request. */
export const getCachedSellerPopupCoupons = createCachedQuery({
  name: "storefront:seller-popup-coupons:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string) => [couponTags.seller(sellerId)],
  query: (sellerId: string) => sellerPopupCoupons(sellerId),
});
