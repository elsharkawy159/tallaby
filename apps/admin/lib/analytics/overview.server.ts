// Deliberately NOT "use server": read only by Server Components on the admin
// home. Wallet-derived numbers, so nothing here is Data-Cached (CLAUDE.md rule 8).

import { cache } from 'react'
import { db } from '@workspace/db'
import { sql } from 'drizzle-orm'
import { getAdminUser } from '@/actions/auth'
import { runLimited, toNumber } from './analytics.lib'
import {
  buildFunnel,
  groupOutcomes,
  kpi,
  paymentLabel,
  splitDays,
  type RawOverviewDay
} from './overview.lib'
import type {
  OverviewMix,
  OverviewNewStore,
  OverviewRange,
  OverviewStoreRow,
  OverviewTrend
} from './overview.types'

/** Statuses that never count toward GMV (same rule as commerce.server.ts). */
const EXCLUDED = sql.raw(`('cancelled', 'refunded', 'returned')`)

function rows (result: unknown): Array<Record<string, unknown>> {
  return Array.isArray(result)
    ? (result as Array<Record<string, unknown>>)
    : [...(result as Iterable<Record<string, unknown>>)]
}

/**
 * The window bounds as SQL CTEs. Days are Cairo calendar days; the current
 * window is the last `range` days including today, the previous window the
 * `range` days before it. `range` is one of 7 | 30 | 90 and inlined (never bound).
 */
function windows (range: OverviewRange) {
  const span = sql.raw(String(range * 2 - 1))
  const len = sql.raw(String(range))
  return sql`
    w AS (
      SELECT
        start_local,
        start_local AT TIME ZONE 'Africa/Cairo' AS start_at,
        (start_local + interval '${len} days') AT TIME ZONE 'Africa/Cairo' AS mid_at
      FROM (
        SELECT date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') - interval '${span} days' AS start_local
      ) b
    )`
}

/** KPI tiles, sparklines and the GMV / fees chart: one round trip, shared per request. */
export const getOverviewTrend = cache(async function getOverviewTrend (
  range: OverviewRange
): Promise<OverviewTrend> {
  await getAdminUser()

  const span = sql.raw(String(range * 2 - 1))
  const [result] = await runLimited([
    () => db.execute(sql`
      WITH ${windows(range)},
      idx AS (SELECT generate_series(0, ${span}) AS i),
      o AS (
        SELECT ((o.created_at AT TIME ZONE 'Africa/Cairo')::date - w.start_local::date) AS i,
          count(*) FILTER (WHERE o.status NOT IN ${EXCLUDED}) AS orders,
          coalesce(sum(o.total_amount) FILTER (WHERE o.status NOT IN ${EXCLUDED}), 0) AS gmv,
          count(*) FILTER (WHERE o.status = 'delivered') AS delivered
        FROM orders o, w WHERE o.created_at >= w.start_at GROUP BY 1
      ),
      f AS (
        SELECT ((t.created_at AT TIME ZONE 'Africa/Cairo')::date - w.start_local::date) AS i,
          -sum(t.amount) AS fees
        FROM wallet_transactions t, w
        WHERE t.type IN ('fee', 'fee_reversal') AND t.created_at >= w.start_at GROUP BY 1
      ),
      s AS (
        SELECT ((st.created_at AT TIME ZONE 'Africa/Cairo')::date - w.start_local::date) AS i, count(*) AS new_stores
        FROM stores st, w WHERE st.deleted_at IS NULL AND st.created_at >= w.start_at GROUP BY 1
      ),
      tu AS (
        SELECT ((u.created_at AT TIME ZONE 'Africa/Cairo')::date - w.start_local::date) AS i, sum(u.amount) AS top_ups
        FROM seller_wallet_top_ups u, w WHERE u.status = 'succeeded' AND u.created_at >= w.start_at GROUP BY 1
      ),
      a AS (
        SELECT
          count(DISTINCT o.store_id) FILTER (WHERE o.created_at >= w.mid_at)::int AS active_cur,
          count(DISTINCT o.store_id) FILTER (WHERE o.created_at < w.mid_at)::int AS active_prev
        FROM orders o, w
        WHERE o.store_id IS NOT NULL AND o.created_at >= w.start_at AND o.status NOT IN ${EXCLUDED}
      )
      SELECT idx.i,
        to_char(w.start_local + idx.i * interval '1 day', 'YYYY-MM-DD') AS date,
        coalesce(o.gmv, 0)::numeric(14,2)::text AS gmv,
        coalesce(o.orders, 0)::int AS orders,
        coalesce(o.delivered, 0)::int AS delivered,
        coalesce(f.fees, 0)::numeric(14,2)::text AS fees,
        coalesce(s.new_stores, 0)::int AS new_stores,
        coalesce(tu.top_ups, 0)::numeric(14,2)::text AS top_ups,
        a.active_cur, a.active_prev
      FROM idx CROSS JOIN w CROSS JOIN a
      LEFT JOIN o ON o.i = idx.i
      LEFT JOIN f ON f.i = idx.i
      LEFT JOIN s ON s.i = idx.i
      LEFT JOIN tu ON tu.i = idx.i
      ORDER BY idx.i
    `)
  ])

  const list = rows(result)
  const first = list[0] ?? {}
  const split = splitDays(
    list.map((row) => ({ ...row, i: toNumber(row.i), date: String(row.date) }) as RawOverviewDay),
    range
  )
  return {
    range,
    ...split,
    activeStores: kpi(toNumber(first.active_cur), toNumber(first.active_prev))
  }
})

/** Store mix, fee trial, seller activation funnel, order outcomes and payment mix. */
export async function getOverviewMix (range: OverviewRange): Promise<OverviewMix> {
  await getAdminUser()

  const [result] = await runLimited([
    () => db.execute(sql`
      WITH ${windows(range)}
      SELECT
        (SELECT json_object_agg(site_status, n) FROM (
          SELECT site_status, count(*)::int AS n FROM stores WHERE deleted_at IS NULL GROUP BY site_status
        ) x) AS sites,
        (SELECT count(*)::int FROM stores WHERE deleted_at IS NULL AND status = 'suspended') AS suspended,
        (SELECT count(*)::int FROM sellers WHERE fee_trial_ends_at > now()) AS in_trial,
        (SELECT count(*)::int FROM sellers WHERE fee_trial_ends_at <= now()) AS past_trial,
        (SELECT count(*)::int FROM seller_wallet WHERE balance < 0) AS negative_wallets,
        (SELECT coalesce(sum(balance), 0)::numeric(14,2)::text FROM seller_wallet WHERE balance < 0) AS negative_total,
        (SELECT json_build_object(
          'signed_up', count(*),
          'store', count(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM stores st WHERE st.seller_id = se.id AND st.deleted_at IS NULL)),
          'product', count(*) FILTER (WHERE EXISTS (SELECT 1 FROM products p WHERE p.seller_id = se.id)),
          'published', count(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM stores st WHERE st.seller_id = se.id AND st.first_published_at IS NOT NULL)),
          'order', count(*) FILTER (WHERE EXISTS (SELECT 1 FROM order_items oi WHERE oi.seller_id = se.id))
        ) FROM sellers se, w WHERE se.created_at >= w.mid_at) AS funnel,
        (SELECT json_object_agg(status, n) FROM (
          SELECT o.status, count(*)::int AS n FROM orders o, w WHERE o.created_at >= w.mid_at GROUP BY o.status
        ) x) AS outcomes,
        (SELECT json_object_agg(payment_method, n) FROM (
          SELECT o.payment_method, count(*)::int AS n FROM orders o, w
          WHERE o.created_at >= w.mid_at AND o.status NOT IN ${EXCLUDED} GROUP BY o.payment_method
        ) x) AS payments
    `)
  ])

  const row = rows(result)[0] ?? {}
  const sites = (row.sites ?? {}) as Record<string, unknown>
  const payments = (row.payments ?? {}) as Record<string, unknown>
  return {
    sites: Object.fromEntries(Object.entries(sites).map(([key, value]) => [key, toNumber(value)])),
    suspendedStores: toNumber(row.suspended),
    sellersInTrial: toNumber(row.in_trial),
    sellersPastTrial: toNumber(row.past_trial),
    negativeWallets: toNumber(row.negative_wallets),
    negativeTotal: toNumber(row.negative_total),
    funnel: buildFunnel(row.funnel as Record<string, unknown> | null),
    outcomes: groupOutcomes(row.outcomes as Record<string, unknown> | null),
    payments: [...Object.entries(payments).reduce((byLabel, [method, value]) => {
      const label = paymentLabel(method)
      byLabel.set(label, (byLabel.get(label) ?? 0) + toNumber(value))
      return byLabel
    }, new Map<string, number>())]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }
}

/** Top stores by GMV in the window, plus the latest stores created. */
export async function getOverviewStores (range: OverviewRange): Promise<{
  top: OverviewStoreRow[]
  latest: OverviewNewStore[]
}> {
  await getAdminUser()

  const [topResult, latestResult] = await runLimited([
    () => db.execute(sql`
      WITH ${windows(range)},
      cur AS (
        SELECT o.store_id,
          count(*) FILTER (WHERE o.status NOT IN ${EXCLUDED})::int AS orders,
          coalesce(sum(o.total_amount) FILTER (WHERE o.status NOT IN ${EXCLUDED}), 0) AS gmv,
          count(*) FILTER (WHERE o.status = 'delivered')::int AS delivered,
          count(*) FILTER (WHERE o.status = 'returned')::int AS returned
        FROM orders o, w WHERE o.store_id IS NOT NULL AND o.created_at >= w.mid_at GROUP BY o.store_id
      ),
      prev AS (
        SELECT o.store_id, coalesce(sum(o.total_amount), 0) AS gmv
        FROM orders o, w
        WHERE o.store_id IS NOT NULL AND o.created_at >= w.start_at AND o.created_at < w.mid_at
          AND o.status NOT IN ${EXCLUDED}
        GROUP BY o.store_id
      )
      SELECT st.id, st.name, st.subdomain, st.logo_url, st.site_status,
        cur.orders, cur.gmv::numeric(14,2)::text AS gmv, cur.delivered, cur.returned,
        prev.gmv::numeric(14,2)::text AS prev_gmv,
        sw.balance::text AS wallet,
        (SELECT d.domain FROM seller_custom_domains d
          WHERE d.store_id = st.id AND d.status = 'active' LIMIT 1) AS custom_domain
      FROM cur
      JOIN stores st ON st.id = cur.store_id AND st.deleted_at IS NULL
      LEFT JOIN prev ON prev.store_id = cur.store_id
      LEFT JOIN seller_wallet sw ON sw.seller_id = st.seller_id
      WHERE cur.orders > 0
      ORDER BY cur.gmv DESC, cur.orders DESC
      LIMIT 6
    `),
    () => db.execute(sql`
      SELECT st.id, st.name, st.logo_url, st.store_category, st.site_status, st.created_at,
        coalesce(se.display_name, se.business_name) AS seller_name
      FROM stores st
      LEFT JOIN sellers se ON se.id = st.seller_id
      WHERE st.deleted_at IS NULL
      ORDER BY st.created_at DESC
      LIMIT 6
    `)
  ])

  return {
    top: rows(topResult).map((row) => {
      const gmv = toNumber(row.gmv)
      const previous = row.prev_gmv == null ? 0 : toNumber(row.prev_gmv)
      const delivered = toNumber(row.delivered)
      const finished = delivered + toNumber(row.returned)
      return {
        id: String(row.id),
        name: String(row.name),
        subdomain: String(row.subdomain),
        customDomain: row.custom_domain ? String(row.custom_domain) : null,
        logoUrl: row.logo_url ? String(row.logo_url) : null,
        siteStatus: String(row.site_status),
        orders: toNumber(row.orders),
        gmv,
        growthPercent: previous > 0 ? Math.round(((gmv - previous) / previous) * 1000) / 10 : null,
        deliveryRate: finished > 0 ? Math.round((delivered / finished) * 1000) / 10 : null,
        walletBalance: row.wallet == null ? null : toNumber(row.wallet)
      }
    }),
    latest: rows(latestResult).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      logoUrl: row.logo_url ? String(row.logo_url) : null,
      category: row.store_category ? String(row.store_category) : null,
      sellerName: row.seller_name ? String(row.seller_name) : null,
      siteStatus: String(row.site_status),
      createdAt: new Date(String(row.created_at)).toISOString()
    }))
  }
}
