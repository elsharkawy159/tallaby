import { createCachedQuery, storeTags } from "@workspace/cache";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { storeUrl } from "@workspace/lib/storefront";
import { REPORT_TTL_SECONDS } from "../reports.lib";
import { CAMPAIGN_ROWS_MAX, type CampaignRawRow } from "./campaigns.lib";

/**
 * Campaigns report and link builder data (ROADMAP.md F-26a). Server-only.
 * Callers pass the session's sellerId and a storeId that requireStore()
 * already checked; every query joins `stores` on that seller again (CLAUDE.md
 * rule 5). The UTM is `orders.metadata.utm`, written from the store host's
 * first-touch cookie at checkout (apps/ecommerce/actions/order.ts).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Line items that never turned into revenue (same as the reports page). */
const NON_REVENUE = sql`('cancelled', 'refunded', 'returned')`;

/** Products offered in the link builder's product picker. */
const LINK_PRODUCTS_MAX = 200;

const rowsOf = (result: unknown): Record<string, unknown>[] =>
  (Array.isArray(result) ? result : ((result as { rows?: unknown[] }).rows ?? [...(result as Iterable<unknown>)])) as Record<
    string,
    unknown
  >[];

const text = (v: unknown) => (v == null ? null : String(v));

/**
 * Store-website orders (not manual ones) placed since `start`, grouped by
 * their utm fields. Revenue = this seller's non-cancelled lines, in integer
 * piastres (same rule as the reports page's sales).
 */
async function loadCampaignRows(sellerId: string, storeId: string, start: string): Promise<CampaignRawRow[]> {
  const result = await db.execute(sql`
    WITH o AS (
      SELECT o.status,
             o.metadata->'utm' AS utm,
             coalesce((
               SELECT sum((oi.total * 100)::bigint)
                 FROM order_items oi
                WHERE oi.order_id = o.id
                  AND oi.seller_id = ${sellerId}
                  AND oi.status NOT IN ${NON_REVENUE}
                  AND coalesce(oi.is_refunded, false) = false
             ), 0) AS piastres
        FROM orders o
        JOIN stores st ON st.id = o.store_id AND st.seller_id = ${sellerId}
       WHERE o.store_id = ${storeId}::uuid
         AND o.created_at >= ${start}::timestamptz
         AND o.order_source <> 'external'
    )
    SELECT utm->>'source' AS source,
           utm->>'medium' AS medium,
           utm->>'campaign' AS campaign,
           (utm->'clickIds')::text AS click_ids,
           utm->>'referrerHost' AS referrer_host,
           count(*)::int AS orders,
           count(*) FILTER (WHERE status = 'delivered')::int AS delivered,
           sum(piastres)::text AS revenue_piastres
      FROM o
     GROUP BY 1, 2, 3, 4, 5
     ORDER BY count(*) DESC
     LIMIT ${CAMPAIGN_ROWS_MAX}
  `);
  return rowsOf(result).map((r) => ({
    source: text(r.source),
    medium: text(r.medium),
    campaign: text(r.campaign),
    clickIds: r.click_ids,
    referrerHost: text(r.referrer_host),
    orders: r.orders,
    delivered: r.delivered,
    revenuePiastres: r.revenue_piastres,
  }));
}

// Only counts and sums per utm value are cached, never order or customer rows.
const getCachedCampaignRows = createCachedQuery({
  name: "dashboard:store-campaigns:v1",
  ttl: REPORT_TTL_SECONDS,
  tags: (sellerId: string, storeId: string, _start: string) => [storeTags.reports(sellerId, storeId)],
  query: loadCampaignRows,
});

/** `storeId` must already be checked with requireStore() for this seller. */
export async function getCampaignRows(sellerId: string, storeId: string, start: string): Promise<CampaignRawRow[] | null> {
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId) || Number.isNaN(Date.parse(start))) return null;
  return getCachedCampaignRows(sellerId, storeId, start);
}

export type LinkBuilderProduct = { id: string; title: string; url: string };

/**
 * The store's public URL (active custom domain, else subdomain) and its
 * latest active products with their page URLs, for the link builder.
 */
export async function getLinkBuilderTargets(
  sellerId: string,
  storeId: string,
  locale: string,
): Promise<{ storeUrl: string; products: LinkBuilderProduct[] } | null> {
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId)) return null;
  const lang = locale.startsWith("ar") ? "ar" : "en";
  const [storeResult, productsResult] = await Promise.all([
    db.execute(sql`
      SELECT st.subdomain,
             (SELECT d.domain FROM seller_custom_domains d
               WHERE d.store_id = st.id AND d.seller_id = ${sellerId} AND d.status = 'active'
               LIMIT 1) AS domain
        FROM stores st
       WHERE st.id = ${storeId}::uuid AND st.seller_id = ${sellerId}
    `),
    db.execute(sql`
      SELECT p.id,
             (SELECT t.title FROM product_translations t WHERE t.product_id = p.id
               ORDER BY (t.locale = ${lang}) DESC, (t.locale = 'ar') DESC LIMIT 1) AS title,
             (SELECT t.slug FROM product_translations t WHERE t.product_id = p.id AND nullif(trim(t.slug), '') IS NOT NULL
               ORDER BY (t.locale = 'en') DESC, (t.locale = 'ar') DESC LIMIT 1) AS slug
        FROM products p
        JOIN stores st ON st.id = ${storeId}::uuid AND st.seller_id = ${sellerId}
       WHERE p.seller_id = ${sellerId}
         AND p.status = 'active'
         AND p.deleted_at IS NULL
         AND (st.catalog_mode = 'all'
              OR EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = st.id AND sp.product_id = p.id))
       ORDER BY p.created_at DESC
       LIMIT ${LINK_PRODUCTS_MAX}
    `),
  ]);
  const store = rowsOf(storeResult)[0];
  if (!store) return null;
  const base = storeUrl(String(store.subdomain), text(store.domain));
  const products = rowsOf(productsResult)
    .filter((r) => r.slug)
    .map((r) => ({
      id: String(r.id),
      title: text(r.title)?.trim() || "—",
      url: `${base}/products/${encodeURIComponent(String(r.slug).trim())}`,
    }));
  return { storeUrl: base, products };
}
