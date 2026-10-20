/**
 * Store data for builder sections beyond products and categories (P4B-05):
 * units sold per product (best sellers, trending), the seller's brand list,
 * approved customer reviews and their stats, and coupons. Server only and
 * never cached here: the storefront wraps these in `createCachedQuery` with
 * seller/store tags, the editor calls them fresh.
 *
 * Every function takes the seller id from the session or the store host and
 * scopes by it; store-scoped reads also check that the store is the seller's.
 */
import { and, coupons, db, desc, eq, gte, inArray, orderItems, orders, productTranslations, products, reviews, sellerProductBrands, sql, storeProducts, stores, users } from "@workspace/db";
import { BEST_SELLER_DAYS, SOLD_ORDER_STATUSES, UNSOLD_ITEM_STATUSES, couponDiscountType, isCouponLive, type CouponDiscountType, ratingStats, reviewAuthorName, type RatingStats } from "./catalog-data.lib";

/** Units sold per product in this store's orders over the last `days` days. */
export async function storeProductSales(sellerId: string, storeId: string, days = BEST_SELLER_DAYS): Promise<Map<string, number>> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const rows = await db
    .select({ productId: orderItems.productId, units: sql<string>`sum(${orderItems.quantity})` })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(stores, and(eq(stores.id, orders.storeId), eq(stores.sellerId, sellerId)))
    .where(
      and(
        eq(orders.storeId, storeId),
        eq(orderItems.sellerId, sellerId),
        inArray(orders.status, [...SOLD_ORDER_STATUSES]),
        sql`(${orderItems.status} IS NULL OR ${orderItems.status} NOT IN (${sql.join(
          UNSOLD_ITEM_STATUSES.map((s) => sql`${s}`),
          sql`, `,
        )}))`,
        gte(orders.createdAt, since),
      ),
    )
    .groupBy(orderItems.productId);
  return new Map(rows.map((r) => [r.productId, Number(r.units) || 0]));
}

export type SellerBrandRow = { id: string; name: string; nameAr: string | null; logoUrl: string | null };

/** The seller's own brand list (0068), in the seller's order. */
export async function sellerBrandList(sellerId: string, limit = 48): Promise<SellerBrandRow[]> {
  return db
    .select({ id: sellerProductBrands.id, name: sellerProductBrands.name, nameAr: sellerProductBrands.nameAr, logoUrl: sellerProductBrands.logoUrl })
    .from(sellerProductBrands)
    .where(eq(sellerProductBrands.sellerId, sellerId))
    .orderBy(sellerProductBrands.position, sellerProductBrands.name)
    .limit(Math.min(Math.max(limit, 1), 100));
}

export type StoreReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string | null;
  verified: boolean;
  productId: string;
  productTitle: { ar: string | null; en: string | null };
  productSlug: string | null;
  createdAt: string | null;
};

/** Approved reviews of the seller's active products (only the store's picks in selected catalog mode). */
function reviewScope(sellerId: string, catalogStoreId: string | undefined) {
  return and(
    eq(reviews.status, "approved"),
    eq(products.sellerId, sellerId),
    eq(products.status, "active"),
    catalogStoreId
      ? sql`EXISTS (SELECT 1 FROM ${storeProducts} sp JOIN ${stores} s ON s.id = sp.store_id WHERE sp.store_id = ${catalogStoreId} AND s.seller_id = ${sellerId} AND sp.product_id = ${products.id})`
      : undefined,
  );
}

export async function storeReviews(
  sellerId: string,
  catalogStoreId: string | undefined,
  options: { limit: number; minRating?: number },
): Promise<StoreReviewRow[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      comment: reviews.comment,
      anonymous: reviews.isAnonymous,
      verified: reviews.isVerifiedPurchase,
      createdAt: reviews.createdAt,
      fullName: users.fullName,
      productId: products.id,
      titleAr: sql<string | null>`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} AND t.locale = 'ar' LIMIT 1)`,
      titleEn: sql<string | null>`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} AND t.locale = 'en' LIMIT 1)`,
      slug: sql<string | null>`(SELECT t.slug FROM ${productTranslations} t WHERE t.product_id = ${products.id} ORDER BY (t.locale = 'ar') DESC LIMIT 1)`,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(users, eq(users.id, reviews.userId))
    .where(and(reviewScope(sellerId, catalogStoreId), options.minRating ? gte(reviews.rating, options.minRating) : undefined))
    .orderBy(desc(reviews.createdAt))
    .limit(Math.min(Math.max(options.limit, 1), 24));
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.comment,
    authorName: reviewAuthorName(r.fullName, r.anonymous),
    verified: r.verified === true,
    productId: r.productId,
    productTitle: { ar: r.titleAr, en: r.titleEn },
    productSlug: r.slug,
    createdAt: r.createdAt,
  }));
}

/** Average, count and stars of the same approved reviews. */
export async function storeReviewStats(sellerId: string, catalogStoreId: string | undefined): Promise<RatingStats> {
  const rows = await db
    .select({ rating: reviews.rating, count: sql<string>`count(*)` })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(reviewScope(sellerId, catalogStoreId))
    .groupBy(reviews.rating);
  return ratingStats(rows.flatMap((r) => Array.from({ length: Number(r.count) || 0 }, () => r.rating)));
}

export type SellerCouponRow = {
  id: string;
  code: string;
  name: string;
  discountType: CouponDiscountType;
  discountValue: number;
  endsAt: string;
  live: boolean;
};

/** The seller's coupons (pickers show which are live); `ids` narrows to some. */
export async function sellerCoupons(sellerId: string, ids?: readonly string[]): Promise<SellerCouponRow[]> {
  if (ids && ids.length === 0) return [];
  const rows = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      name: coupons.name,
      discountType: coupons.discountType,
      discountValue: coupons.discountValue,
      isActive: coupons.isActive,
      startsAt: coupons.startsAt,
      expiresAt: coupons.expiresAt,
      usageLimit: coupons.usageLimit,
      usageCount: coupons.usageCount,
    })
    .from(coupons)
    .where(and(eq(coupons.sellerId, sellerId), ids ? inArray(coupons.id, [...ids]) : undefined))
    .orderBy(desc(coupons.createdAt))
    .limit(100);
  return rows.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    discountType: couponDiscountType(c.discountType),
    discountValue: Number(c.discountValue) || 0,
    endsAt: c.expiresAt,
    live: isCouponLive(c),
  }));
}
