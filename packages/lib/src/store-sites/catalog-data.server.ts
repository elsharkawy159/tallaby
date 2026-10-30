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
import { isNotNull } from "drizzle-orm";
import { isCouponPopupTrigger, type StoreCouponOfferCandidate } from "../orders/coupon-popup.lib";
import { getCouponChannels, getCouponProductIds } from "../orders/coupon-scope.lib";
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

export type StoreCategoryGroup = {
  /** Catalog filter key: the seller category id, else the Tallaby root's slug (or id). */
  key: string;
  /** The seller's own category (0068); null for a Tallaby root group. */
  sellerCategoryId: string | null;
  /** The Tallaby category the seller category was picked from. */
  sourceCategoryId: string | null;
  name: string | null;
  nameAr: string | null;
  productCount: number;
  /** The Tallaby categories (`products.category_id`) of the products in it. */
  categoryIds: string[];
  productIds: string[];
  /** Storage path in the `categories` bucket: the seller's own category photo. */
  ownImage: string | null;
  /** First image entry (a path or `{ url }`) of the best-rated product in it. */
  productImage: unknown;
};

/**
 * The store's categories, as its category lists and catalog filter show them
 * (storefront and builder alike). A product belongs to its seller category
 * (`products.seller_category_id`); a product without one, to the seller
 * category picked from its Tallaby category; anything else (products made
 * before 0068) to its Tallaby root category. Only categories with active
 * products, the seller's own first in their order, then the roots by size.
 * With `catalogStoreId` (a store in selected mode) only that store's picks count.
 */
export async function storeCategoryGroups(
  sellerId: string,
  catalogStoreId?: string,
  q: Pick<typeof db, "execute"> = db,
): Promise<StoreCategoryGroup[]> {
  const selected = catalogStoreId
    ? sql`AND EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = ${catalogStoreId} AND sp.product_id = p.id)`
    : sql``;
  const rows = await q.execute(sql`
    WITH RECURSIVE ancestry AS (
      SELECT id, id AS root_id, parent_id FROM categories
      UNION ALL
      SELECT a.id, c.id, c.parent_id
      FROM ancestry a JOIN categories c ON c.id = a.parent_id
    ),
    items AS (
      SELECT p.id, p.category_id, p.images, p.average_rating, p.created_at,
             spc.id AS spc_id, spc.source_category_id, spc.name AS spc_name, spc.name_ar AS spc_name_ar,
             spc.image_url, spc.position, spc.created_at AS spc_created_at,
             r.id AS root_id, r.slug AS root_slug, r.name AS root_name, r.name_ar AS root_name_ar
      FROM products p
      LEFT JOIN seller_product_categories spc ON spc.seller_id = p.seller_id
        AND (spc.id = p.seller_category_id OR (p.seller_category_id IS NULL AND spc.source_category_id = p.category_id))
      LEFT JOIN ancestry a ON spc.id IS NULL AND a.id = p.category_id AND a.parent_id IS NULL
      LEFT JOIN categories r ON r.id = a.root_id
      WHERE p.seller_id = ${sellerId} AND p.status = 'active' AND (spc.id IS NOT NULL OR r.id IS NOT NULL) ${selected}
    )
    SELECT coalesce(spc_id::text, root_slug, root_id::text) AS key,
           spc_id AS "sellerCategoryId",
           min(source_category_id::text) AS "sourceCategoryId",
           coalesce(min(spc_name), min(root_name)) AS name,
           coalesce(min(spc_name_ar), min(root_name_ar)) AS "nameAr",
           count(*)::int AS "productCount",
           json_agg(DISTINCT category_id) AS "categoryIds",
           json_agg(id) AS "productIds",
           min(nullif(btrim(image_url), '')) AS "ownImage",
           (array_agg(images -> 0 ORDER BY average_rating DESC NULLS LAST, created_at DESC)
              FILTER (WHERE jsonb_typeof(images) = 'array' AND jsonb_array_length(images) > 0))[1]
             AS "productImage"
    FROM items
    GROUP BY 1, 2
    ORDER BY (spc_id IS NULL), min(position), min(spc_created_at), count(*) DESC, name
  `);
  return [...rows] as StoreCategoryGroup[];
}

/** What a product listing needs to show one store category's products, by the same rule. */
export type StoreCategoryFilter = Pick<StoreCategoryGroup, "sellerCategoryId" | "sourceCategoryId" | "categoryIds">;

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
      // Seller-added reviews (0111) have no user, only the reviewer's name.
      fullName: sql<string | null>`coalesce(${users.fullName}, ${reviews.reviewerName})`,
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

/**
 * The seller's coupons set to show as a store pop-up (0114) that have not
 * ended or been switched off, newest change first. Which one is live is
 * decided per request (`pickStoreCouponOffer`): these rows may be cached.
 */
export async function sellerPopupCoupons(sellerId: string): Promise<StoreCouponOfferCandidate[]> {
  const rows = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      discountType: coupons.discountType,
      discountValue: coupons.discountValue,
      popupTrigger: coupons.popupTrigger,
      popupDurationMinutes: coupons.popupDurationMinutes,
      applicableTo: coupons.applicableTo,
      isActive: coupons.isActive,
      startsAt: coupons.startsAt,
      expiresAt: coupons.expiresAt,
      usageLimit: coupons.usageLimit,
      usageCount: coupons.usageCount,
    })
    .from(coupons)
    .where(
      and(
        eq(coupons.sellerId, sellerId),
        eq(coupons.isActive, true),
        isNotNull(coupons.popupTrigger),
        gte(coupons.expiresAt, new Date().toISOString()),
      ),
    )
    .orderBy(desc(coupons.updatedAt))
    .limit(10);
  return rows.flatMap((c) => {
    if (!isCouponPopupTrigger(c.popupTrigger) || !c.popupDurationMinutes) return [];
    if (!getCouponChannels(c.applicableTo).includes("storefront")) return [];
    // Seller coupons are a percentage or a fixed amount; anything else has no pop-up wording.
    if (c.discountType !== "percentage" && c.discountType !== "fixed_amount") return [];
    return [
      {
        couponId: c.id,
        code: c.code,
        discountType: c.discountType,
        discountValue: Number(c.discountValue) || 0,
        trigger: c.popupTrigger,
        durationMinutes: c.popupDurationMinutes,
        endsAt: c.expiresAt,
        productIds: getCouponProductIds(c.applicableTo),
        startsAt: c.startsAt,
        usageLimit: c.usageLimit,
        usageCount: c.usageCount,
      },
    ];
  });
}
