import { createCachedQuery, storeTags } from "@workspace/cache";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { productImageUrl } from "../_components/home.queries";
import {
  REPORT_PRODUCTS_MAX,
  REPORT_TTL_SECONDS,
  toInt,
  type GovernorateRawRow,
  type ReportProduct,
} from "./reports.lib";

/**
 * Report queries for one store (ROADMAP.md F-15a). Server-only, never called
 * from the client. Callers pass the session's sellerId and a storeId that
 * requireStore() already checked; every query joins `stores` on that seller
 * again (CLAUDE.md rule 5), so a foreign store id just returns nothing.
 *
 * The result holds counts and sums only (no order, customer or address rows)
 * and is cached for REPORT_TTL_SECONDS per seller + store + period start +
 * locale under storeTags.reports. Money is integer piastres.
 */

/** Line items that never turned into revenue (same as the home page). */
const NON_REVENUE = sql`('cancelled', 'refunded', 'returned')`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const rowsOf = (result: unknown): Record<string, unknown>[] =>
  (Array.isArray(result) ? result : ((result as { rows?: unknown[] }).rows ?? [...(result as Iterable<unknown>)])) as Record<
    string,
    unknown
  >[];

export type StoreReportData = {
  /** Store orders placed in the period, grouped by the raw address governorate. */
  governorates: GovernorateRawRow[];
  /** The seller's sales in the period by where the order came from. */
  sources: { source: string; orders: number; revenuePiastres: number }[];
  /** Store checkouts that got an address but no order (store_checkout_leads, F-03). */
  abandonedCheckouts: number;
  best: ReportProduct[];
  /** Lowest sellers of the store's catalog (zero sales first); may include best sellers, see worstProducts(). */
  worstCandidates: ReportProduct[];
};

/** Same outcome rules as the customers page (`orderOutcome`, @workspace/lib/customers). */
const OUTCOME = sql`CASE
  WHEN o.status = 'delivered' THEN 'delivered'
  WHEN o.status = 'returned' OR EXISTS (
    SELECT 1 FROM shipments sh WHERE sh.order_id = o.id AND sh.status IN ('failed', 'returned')
  ) THEN 'refused'
  WHEN o.status IN ('cancelled', 'refunded', 'refund_requested') THEN 'cancelled'
  ELSE 'open' END`;

async function governorates(sellerId: string, storeId: string, start: string): Promise<GovernorateRawRow[]> {
  const result = await db.execute(sql`
    SELECT a.state AS governorate,
           count(*)::int AS orders,
           count(*) FILTER (WHERE x.outcome = 'delivered')::int AS delivered,
           count(*) FILTER (WHERE x.outcome = 'refused')::int AS refused,
           count(*) FILTER (WHERE x.outcome = 'cancelled')::int AS cancelled
      FROM (
        SELECT o.shipping_address_id, ${OUTCOME} AS outcome
          FROM orders o
          JOIN stores st ON st.id = o.store_id AND st.seller_id = ${sellerId}
         WHERE o.store_id = ${storeId}::uuid
           AND o.created_at >= ${start}::timestamptz
      ) x
      LEFT JOIN user_addresses a ON a.id = x.shipping_address_id
     GROUP BY a.state
  `);
  return rowsOf(result).map((r) => ({
    governorate: r.governorate == null ? null : String(r.governorate),
    orders: toInt(r.orders),
    delivered: toInt(r.delivered),
    refused: toInt(r.refused),
    cancelled: toInt(r.cancelled),
  }));
}

async function sources(sellerId: string, storeId: string, start: string) {
  // order_items.seller_id scopes every row to this seller, whatever the store.
  const result = await db.execute(sql`
    SELECT CASE
             WHEN o.order_source = 'external' THEN 'manual'
             WHEN o.store_id = ${storeId}::uuid THEN 'store'
             WHEN o.store_id IS NOT NULL THEN 'otherStores'
             ELSE 'marketplace'
           END AS source,
           count(DISTINCT oi.order_id)::int AS orders,
           coalesce(sum((oi.total * 100)::bigint), 0)::text AS revenue_piastres
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
     WHERE oi.seller_id = ${sellerId}
       AND oi.created_at >= ${start}::timestamptz
       AND oi.status NOT IN ${NON_REVENUE}
       AND coalesce(oi.is_refunded, false) = false
     GROUP BY 1
  `);
  return rowsOf(result).map((r) => ({
    source: String(r.source),
    orders: toInt(r.orders),
    revenuePiastres: toInt(r.revenue_piastres),
  }));
}

async function abandonedCheckouts(sellerId: string, storeId: string, start: string): Promise<number> {
  const result = await db.execute(sql`
    SELECT count(*)::int AS n
      FROM store_checkout_leads l
      JOIN stores st ON st.id = l.store_id AND st.seller_id = ${sellerId}
     WHERE l.store_id = ${storeId}::uuid
       AND l.seller_id = ${sellerId}
       AND l.order_id IS NULL
       AND l.created_at >= ${start}::timestamptz
  `);
  return toInt(rowsOf(result)[0]?.n);
}

/** Units and revenue per product sold on this store's website in the period. */
const soldCte = (sellerId: string, storeId: string, start: string) => sql`
  sold AS (
    SELECT oi.product_id,
           sum(oi.quantity)::int AS units,
           count(DISTINCT oi.order_id)::int AS orders,
           sum((oi.total * 100)::bigint) AS piastres
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
     WHERE oi.seller_id = ${sellerId}
       AND o.store_id = ${storeId}::uuid
       AND oi.created_at >= ${start}::timestamptz
       AND oi.status NOT IN ${NON_REVENUE}
       AND coalesce(oi.is_refunded, false) = false
     GROUP BY oi.product_id
  )`;

const productTitle = (locale: string) => sql`(SELECT t.title FROM product_translations t
  WHERE t.product_id = p.id
  ORDER BY (t.locale = ${locale}) DESC, (t.locale = 'ar') DESC
  LIMIT 1)`;

const toProduct = (r: Record<string, unknown>): ReportProduct => ({
  productId: String(r.id),
  title: r.title == null ? "" : String(r.title),
  image: productImageUrl(r.image == null ? null : String(r.image)),
  units: toInt(r.units),
  orders: toInt(r.orders),
  revenuePiastres: toInt(r.piastres),
});

async function bestProducts(sellerId: string, storeId: string, start: string, locale: string): Promise<ReportProduct[]> {
  // Trashed products (0123) are left out of every list.
  const result = await db.execute(sql`
    WITH ${soldCte(sellerId, storeId, start)}
    SELECT p.id, ${productTitle(locale)} AS title, p.images->>0 AS image,
           s.units, s.orders, s.piastres::text AS piastres
      FROM sold s
      JOIN products p ON p.id = s.product_id AND p.seller_id = ${sellerId} AND p.deleted_at IS NULL
     ORDER BY s.piastres DESC, s.units DESC
     LIMIT ${REPORT_PRODUCTS_MAX}
  `);
  return rowsOf(result).map(toProduct);
}

async function worstCandidates(sellerId: string, storeId: string, start: string, locale: string): Promise<ReportProduct[]> {
  // Active, not trashed products this store shows (catalog 'all' or its selection), fewest sales first.
  const result = await db.execute(sql`
    WITH ${soldCte(sellerId, storeId, start)}
    SELECT p.id, ${productTitle(locale)} AS title, p.images->>0 AS image,
           coalesce(s.units, 0) AS units, coalesce(s.orders, 0) AS orders, coalesce(s.piastres, 0)::text AS piastres
      FROM products p
      JOIN stores st ON st.id = ${storeId}::uuid AND st.seller_id = ${sellerId}
      LEFT JOIN sold s ON s.product_id = p.id
     WHERE p.seller_id = ${sellerId}
       AND p.status = 'active'
       AND p.deleted_at IS NULL
       AND (st.catalog_mode = 'all'
            OR EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = st.id AND sp.product_id = p.id))
     ORDER BY coalesce(s.units, 0) ASC, coalesce(s.piastres, 0) ASC, p.created_at ASC
     LIMIT ${REPORT_PRODUCTS_MAX * 2}
  `);
  return rowsOf(result).map(toProduct);
}

async function loadStoreReport(sellerId: string, storeId: string, start: string, locale: string): Promise<StoreReportData> {
  const [govs, srcs, abandoned, best, worst] = await Promise.all([
    governorates(sellerId, storeId, start),
    sources(sellerId, storeId, start),
    abandonedCheckouts(sellerId, storeId, start),
    bestProducts(sellerId, storeId, start, locale),
    worstCandidates(sellerId, storeId, start, locale),
  ]);
  return { governorates: govs, sources: srcs, abandonedCheckouts: abandoned, best, worstCandidates: worst };
}

const getCachedStoreReport = createCachedQuery({
  name: "dashboard:store-report:v1",
  ttl: REPORT_TTL_SECONDS,
  tags: (sellerId: string, storeId: string, _start: string, _locale: string) => [storeTags.reports(sellerId, storeId)],
  query: loadStoreReport,
});

/**
 * One store's report from `start` (Cairo midnight, reportPeriod()) to now.
 * `storeId` must already be checked with requireStore() for this seller.
 */
export async function getStoreReport(
  sellerId: string,
  storeId: string,
  start: string,
  locale: string,
): Promise<StoreReportData | null> {
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId) || Number.isNaN(Date.parse(start))) return null;
  return getCachedStoreReport(sellerId, storeId, start, locale.startsWith("ar") ? "ar" : "en");
}
