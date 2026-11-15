import { db, sql } from "@workspace/db";
import {
  CROSS_SELL_REPORT_EXCLUDED_STATUSES,
  reportRowFrom,
  reportTotalsFrom,
  type CrossSellReportFilters,
  type CrossSellReportRow,
  type CrossSellReportTotals,
} from "./cross-sell-report.lib";

/**
 * Orders › Cross-sell report (ROADMAP.md F-32f). Takes the session seller's id and
 * an explicit store id and joins `stores` on both (CLAUDE.md rule 5), so a foreign
 * store returns nothing. Only aggregates and one page of offers leave the database.
 */

export type CrossSellReport = {
  rows: CrossSellReportRow[];
  totals: CrossSellReportTotals;
  /** Offers with at least one order in the period. */
  total: number;
  page: number;
  pages: number;
  size: number;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rowsOf = (result: unknown) => [...(result as Iterable<Record<string, unknown>>)];

const UNITS = sql`(oi.metadata #>> '{crossSell,discountedUnits}')::bigint`;
const UNIT_DISCOUNT = sql`(oi.metadata #>> '{crossSell,unitDiscountPiastres}')::bigint`;
const OFFER_ID = sql`oi.metadata #>> '{crossSell,offerId}'`;

/** This store's order lines that took an offer in the period, on orders that went through. */
const takenLines = (sellerId: string, storeId: string, days: number) => sql`
    FROM orders o
    JOIN stores st ON st.id = o.store_id AND st.seller_id = ${sellerId}
    JOIN order_items oi ON oi.order_id = o.id AND oi.seller_id = ${sellerId}
   WHERE o.store_id = ${storeId}
     AND o.created_at >= now() - make_interval(days => ${days}::int)
     AND o.status::text NOT IN (${sql.join(
       CROSS_SELL_REPORT_EXCLUDED_STATUSES.map((status) => sql`${status}`),
       sql`, `,
     )})
     AND oi.metadata -> 'crossSell' IS NOT NULL
`;

export async function loadCrossSellReport(sellerId: string, storeId: string, filters: CrossSellReportFilters): Promise<CrossSellReport> {
  const empty = { rows: [], totals: reportTotalsFrom(undefined), total: 0, page: 1, pages: 1, size: filters.size };
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId)) return empty;

  const from = takenLines(sellerId, storeId, filters.days);
  const [summary] = rowsOf(
    await db.execute(sql`
      SELECT COUNT(DISTINCT oi.order_id)::int AS orders,
             COUNT(DISTINCT ${OFFER_ID})::int AS offers,
             COALESCE(SUM(${UNITS}), 0)::text AS units,
             COALESCE(SUM(${UNITS} * ${UNIT_DISCOUNT}), 0)::text AS discount_piastres
      ${from}
    `),
  );
  const total = Number(summary?.offers ?? 0);
  if (total === 0) return empty;

  const pages = Math.max(Math.ceil(total / filters.size), 1);
  const page = Math.min(filters.page, pages);
  const rows = rowsOf(
    await db.execute(sql`
      SELECT a.offer_id, a.orders, a.units, a.discount_piastres, latest.product_name AS offer_name, main.product_name AS main_name
        FROM (
          SELECT ${OFFER_ID} AS offer_id,
                 COUNT(DISTINCT oi.order_id)::int AS orders,
                 SUM(${UNITS})::text AS units,
                 SUM(${UNITS} * ${UNIT_DISCOUNT})::text AS discount_piastres,
                 (array_agg(oi.id ORDER BY o.created_at DESC, oi.id))[1] AS latest_line
          ${from}
          GROUP BY 1
          ORDER BY COUNT(DISTINCT oi.order_id) DESC, 1
          LIMIT ${filters.size} OFFSET ${(page - 1) * filters.size}
        ) a
        JOIN order_items latest ON latest.id = a.latest_line
        LEFT JOIN LATERAL (
          SELECT mi.product_name
            FROM order_items mi
           WHERE mi.order_id = latest.order_id
             AND mi.product_id::text = latest.metadata #>> '{crossSell,mainProductId}'
           LIMIT 1
        ) main ON TRUE
       ORDER BY a.orders DESC, a.offer_id
    `),
  );

  return { rows: rows.map(reportRowFrom), totals: reportTotalsFrom(summary), total, page, pages, size: filters.size };
}
