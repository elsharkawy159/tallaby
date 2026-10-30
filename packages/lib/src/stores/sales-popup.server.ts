import { db, sql } from "@workspace/db";
import { UNSOLD_ITEM_STATUSES } from "../store-sites/catalog-data.lib";
import { SALES_FEED_DAYS, SALES_FEED_LIMIT, type SalesFeedRow } from "./sales-popup.lib";

/**
 * Recent orders of ONE store for the sales pop-up (ROADMAP.md F-22a). Server
 * only and not cached here: the storefront wraps it in `createCachedQuery`
 * with the seller and store in the key and tags.
 *
 * Scoped by the seller (from the store host, never the client) and the
 * store: `stores` is joined on both, so a foreign store id returns nothing.
 * Only what the toast needs is selected: the line's product name (the
 * visitor's language when the product has it, else the order snapshot), the
 * shipping governorate and the order time. No names, phones or addresses.
 */

/** Real orders: placed and not cancelled, refunded or returned. Card payments still processing are left out. */
export const SALES_FEED_ORDER_STATUSES = ["pending", "confirmed", "shipping_soon", "shipped", "out_for_delivery", "delivered"] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rowsOf = (result: unknown) => [...(result as Iterable<Record<string, unknown>>)];
const list = (values: readonly string[]) => sql.join(values.map((v) => sql`${v}`), sql`, `);

export async function storeRecentOrderRows(sellerId: string, storeId: string, locale: string): Promise<SalesFeedRow[]> {
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId)) return [];
  const lang = locale === "en" ? "en" : "ar";
  const rows = rowsOf(
    await db.execute(sql`
      SELECT to_char(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at, a.state, coalesce(nullif(btrim(pt.title), ''), i.product_name) AS product
        FROM orders o
        JOIN stores st ON st.id = o.store_id AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
        LEFT JOIN user_addresses a ON a.id = o.shipping_address_id
        JOIN LATERAL (
              SELECT oi.product_id, oi.product_name
                FROM order_items oi
               WHERE oi.order_id = o.id
                 AND oi.seller_id = ${sellerId}
                 AND (oi.status IS NULL OR oi.status::text NOT IN (${list(UNSOLD_ITEM_STATUSES)}))
               ORDER BY oi.quantity DESC, oi.id
               LIMIT 1
             ) i ON true
        LEFT JOIN product_translations pt ON pt.product_id = i.product_id AND pt.locale = ${lang}
       WHERE o.store_id = ${storeId}
         AND o.status::text IN (${list(SALES_FEED_ORDER_STATUSES)})
         AND o.created_at >= now() - make_interval(days => ${SALES_FEED_DAYS})
       ORDER BY o.created_at DESC
       LIMIT ${SALES_FEED_LIMIT}
    `),
  );
  return rows.map((r) => ({
    product: r.product == null ? null : String(r.product),
    state: r.state == null ? null : String(r.state),
    createdAt: r.created_at == null ? null : String(r.created_at),
  }));
}
