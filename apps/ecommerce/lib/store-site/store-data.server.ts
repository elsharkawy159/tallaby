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
 * The seller's brand list. Brands are still per seller (per store with F-87d),
 * but the entry is already keyed and tagged per store (F-87c), so that move
 * needs no cache change.
 */
export const getCachedSellerBrands = createCachedQuery({
  name: "storefront:seller-brands:v2",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string) => [productTags.seller(sellerId), productTags.store(sellerId, storeId)],
  query: (sellerId: string, _storeId: string) => sellerBrandList(sellerId),
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
