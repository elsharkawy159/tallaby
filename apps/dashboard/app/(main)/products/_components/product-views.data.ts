import { and, db, eq, isNull, productTranslations, products, sql } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { getProductPathViews } from "@/lib/analytics/product-views.server";
import {
  PRODUCT_VIEWS_DAYS,
  buildSlugIndex,
  mapViewsToProducts,
  type ProductViewStat,
  type ProductViewStats,
} from "@/lib/analytics/product-views.lib";

const rowsOf = <T,>(result: unknown): T[] =>
  (Array.isArray(result) ? result : ((result as { rows?: T[] }).rows ?? [])) as T[];

/**
 * Views and orders per product over the last PRODUCT_VIEWS_DAYS Cairo days
 * (ROADMAP.md F-15b). Views are store product page views from GA4 (one cached
 * report for all the seller's stores), matched to the seller's own,
 * non-trashed products by slug in either language. Orders are the seller's
 * store-website orders containing the product, not cancelled (orders are
 * never cached, rule 8). Null when GA4 is not set up or failed, so the page
 * shows "—" and never errors. Pass `productIds` to limit the order count.
 */
export async function loadProductViewStats(productIds?: string[]): Promise<ProductViewStats> {
  try {
    const [{ sellerId }, { stores }] = await Promise.all([requireSeller(), getSellerStores()]);
    const storeIds = stores.map((s) => s.id);
    const days = PRODUCT_VIEWS_DAYS;
    const paths = await getProductPathViews(sellerId, storeIds, days);
    if (!paths) return null;
    if (productIds && productIds.length === 0) return { days, byProduct: {} };

    const productFilter = productIds
      ? sql`AND oi.product_id IN (${sql.join(productIds.map((id) => sql`${id}::uuid`), sql`, `)})`
      : sql``;
    const [slugRows, orderResult] = await Promise.all([
      db
        .select({
          productId: productTranslations.productId,
          locale: productTranslations.locale,
          slug: productTranslations.slug,
          createdAt: products.createdAt,
        })
        .from(productTranslations)
        .innerJoin(products, eq(products.id, productTranslations.productId))
        .where(and(eq(products.sellerId, sellerId), isNull(products.deletedAt))),
      db.execute(sql`
        SELECT oi.product_id::text AS product_id, count(DISTINCT oi.order_id)::int AS orders
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE oi.seller_id = ${sellerId}
          AND p.seller_id = ${sellerId}
          AND p.deleted_at IS NULL
          AND o.store_id IN (${sql.join(storeIds.map((id) => sql`${id}::uuid`), sql`, `)})
          AND oi.status <> 'cancelled'
          AND oi.created_at >= ((((now() AT TIME ZONE 'Africa/Cairo')::date - ${days - 1}::int)::timestamp) AT TIME ZONE 'Africa/Cairo')
          ${productFilter}
        GROUP BY oi.product_id
      `),
    ]);

    const views = mapViewsToProducts(paths, buildSlugIndex(slugRows));
    const wanted = productIds ? new Set(productIds) : null;
    const byProduct: Record<string, ProductViewStat> = {};
    for (const [id, n] of views) {
      if (!wanted || wanted.has(id)) byProduct[id] = { views: n, orders: 0 };
    }
    for (const row of rowsOf<{ product_id: string; orders: number }>(orderResult)) {
      const entry = (byProduct[row.product_id] ??= { views: 0, orders: 0 });
      entry.orders = Number(row.orders) || 0;
    }
    return { days, byProduct };
  } catch (error) {
    logServerError("integration", "product view stats load failed", { products: productIds?.length ?? "all" }, error);
    return null;
  }
}
