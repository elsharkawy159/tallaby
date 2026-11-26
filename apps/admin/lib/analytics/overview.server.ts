// Deliberately NOT "use server": read only by Server Components on the admin
// home. Wallet-derived numbers, so nothing here is Data-Cached (CLAUDE.md rule 8).

import { cache } from 'react'
import { db } from '@workspace/db'
import { sql, type SQL } from 'drizzle-orm'
import { customDomainPublicHostRawSql } from '@workspace/lib/storefront/server'
import { getAdminUser } from '@/actions/auth'
import { runLimited, toNumber } from './analytics.lib'
import {
  bucketCount,
  buildFunnel,
  buildTrend,
  groupOutcomes,
  isIsoDate,
  paymentLabel,
  type RawOverviewPoint
} from './overview.lib'
import type {
  OverviewMix,
  OverviewNewStore,
  OverviewPeriod,
  OverviewSnapshot,
  OverviewStoreRow,
  OverviewTrend
} from './overview.types'

/** Statuses that never count toward GMV (same rule as commerce.server.ts). */
export const EXCLUDED = sql.raw(`('cancelled', 'refunded', 'returned')`)

/** Top-up methods an admin reviews from a proof (same list as the sidebar count). */
const REVIEWED_TOP_UP_PROVIDERS = ['instapay', 'vodafone_cash', 'e_cash', 'orange_cash', 'we_pay'] as const

export function rows (result: unknown): Array<Record<string, unknown>> {
  return Array.isArray(result)
    ? (result as Array<Record<string, unknown>>)
    : [...(result as Iterable<Record<string, unknown>>)]
}

/**
 * The period bounds as a one-row CTE `b`: `s`/`e` the current window, `ps`/`pe`
 * the previous one (instants, `e`/`pe` exclusive), `sd` the first Cairo day.
 * The dates come from resolveOverviewPeriod and are bound as parameters, never
 * inlined; they are checked again here.
 */
export function periodBounds (period: OverviewPeriod): SQL {
  for (const date of [period.start, period.end, period.prevStart, period.prevEnd]) {
    if (!isIsoDate(date)) throw new Error('Invalid overview period')
  }
  return sql`b AS (
    SELECT
      (${period.start}::date)::timestamp AT TIME ZONE 'Africa/Cairo' AS s,
      (${period.end}::date)::timestamp AT TIME ZONE 'Africa/Cairo' AS e,
      (${period.prevStart}::date)::timestamp AT TIME ZONE 'Africa/Cairo' AS ps,
      (${period.prevEnd}::date)::timestamp AT TIME ZONE 'Africa/Cairo' AS pe,
      ${period.start}::date AS sd
  )`
}

/** USD → EGP at the switch's rate, so fees sit beside EGP GMV. */
const FEE_EGP = sql`(t.amount * CASE WHEN t.currency = 'USD'
  THEN coalesce((SELECT bs.conversion_rate FROM billing_settings bs WHERE bs.id), 1) ELSE 1 END)`

/** The bucket number (0-based) of a timestamp column, in Cairo local time. */
function bucketOf (column: string, period: OverviewPeriod): SQL {
  // `column` is one of the fixed column names below, never user input.
  const local = sql`(${sql.raw(column)} AT TIME ZONE 'Africa/Cairo')`
  if (period.bucket === 'hour') return sql`((${local}::date - b.sd) * 24 + extract(hour FROM ${local})::int)`
  if (period.bucket === 'week') return sql`((${local}::date - b.sd) / 7)`
  return sql`(${local}::date - b.sd)`
}

/** `column` in the current window. */
const cur = (column: string) => sql`(${sql.raw(column)} >= b.s AND ${sql.raw(column)} < b.e)`
/** `column` in the previous window. */
const prv = (column: string) => sql`(${sql.raw(column)} >= b.ps AND ${sql.raw(column)} < b.pe)`
/** Either window (the previous one always starts first). */
const either = (column: string) => sql`(${sql.raw(column)} >= b.ps AND ${sql.raw(column)} < b.e)`

/**
 * Each seller's first activation event, mirroring loadActivationFacts in
 * packages/lib/src/billing/order-lock.server.ts: a succeeded top-up row, a
 * `top_up` ledger entry, or a USD ledger entry leaving the balance above zero.
 * ("Balance above zero now" has no date of its own; such a balance always comes
 * from a USD entry with `balance_after > 0`.)
 */
const FIRST_ACTIVATION = sql`
  SELECT ev.seller_id, min(ev.at) AS at FROM (
    SELECT u.seller_id, u.created_at AS at FROM seller_wallet_top_ups u WHERE u.status = 'succeeded'
    UNION ALL
    SELECT t.seller_id, t.created_at FROM wallet_transactions t WHERE t.type = 'top_up'
    UNION ALL
    SELECT t.seller_id, t.created_at FROM wallet_transactions t WHERE t.currency = 'USD' AND t.balance_after > 0
  ) ev GROUP BY ev.seller_id`

/**
 * "Right now" tiles: stores by status, sellers by activation, money held in
 * store wallets and manual top-ups waiting for review. One statement.
 * "Activated" mirrors loadActivationFacts (order-lock.server.ts); it applies
 * once the USD switch is live, as it is on production.
 */
export const getOverviewSnapshot = cache(async function getOverviewSnapshot (): Promise<OverviewSnapshot> {
  await getAdminUser()

  const providers = sql.join(REVIEWED_TOP_UP_PROVIDERS.map((p) => sql`${p}`), sql`, `)
  const [result] = await runLimited([
    () => db.execute(sql`
      WITH act AS (
        SELECT se.id,
          EXISTS (SELECT 1 FROM seller_wallet_top_ups u WHERE u.seller_id = se.id AND u.status = 'succeeded') AS paid,
          EXISTS (SELECT 1 FROM wallet_transactions t WHERE t.seller_id = se.id AND t.type = 'top_up') AS top_up_entry,
          coalesce((SELECT w.balance FROM seller_wallet w WHERE w.seller_id = se.id LIMIT 1), 0) > 0 AS positive_now,
          EXISTS (SELECT 1 FROM wallet_transactions t
            WHERE t.seller_id = se.id AND t.currency = 'USD' AND t.balance_after > 0) AS positive_entry
        FROM sellers se
      )
      SELECT
        (SELECT json_build_object(
          'total', count(*),
          'published', count(*) FILTER (WHERE site_status = 'published'),
          'draft', count(*) FILTER (WHERE site_status = 'draft'),
          'unpublished', count(*) FILTER (WHERE site_status = 'unpublished'),
          'suspended', count(*) FILTER (WHERE status = 'suspended')
        ) FROM stores WHERE deleted_at IS NULL) AS stores,
        (SELECT json_build_object(
          'total', count(*),
          'activated', count(*) FILTER (WHERE paid OR top_up_entry OR positive_now OR positive_entry),
          'paid', count(*) FILTER (WHERE paid),
          'credit_only', count(*) FILTER (WHERE NOT paid AND NOT top_up_entry AND (positive_now OR positive_entry))
        ) FROM act) AS sellers,
        (SELECT json_agg(x ORDER BY x.wallets DESC) FROM (
          SELECT coalesce(currency, 'EGP') AS currency,
            count(*)::int AS wallets,
            coalesce(sum(balance) FILTER (WHERE balance > 0), 0)::numeric(14,2)::text AS positive_total,
            count(*) FILTER (WHERE balance > 0)::int AS positive_count,
            coalesce(sum(balance) FILTER (WHERE balance < 0), 0)::numeric(14,2)::text AS negative_total,
            count(*) FILTER (WHERE balance < 0)::int AS negative_count
          FROM seller_wallet GROUP BY 1
        ) x) AS wallets,
        (SELECT json_build_object('count', count(*), 'amount', coalesce(sum(amount), 0)::numeric(14,2)::text)
          FROM seller_wallet_top_ups WHERE status = 'pending' AND provider IN (${providers})) AS pending
    `)
  ])

  const row = rows(result)[0] ?? {}
  const stores = (row.stores ?? {}) as Record<string, unknown>
  const sellers = (row.sellers ?? {}) as Record<string, unknown>
  const pending = (row.pending ?? {}) as Record<string, unknown>
  const wallets = (Array.isArray(row.wallets) ? row.wallets : []) as Array<Record<string, unknown>>
  return {
    stores: {
      total: toNumber(stores.total),
      published: toNumber(stores.published),
      neverPublished: toNumber(stores.draft),
      offline: toNumber(stores.unpublished),
      suspended: toNumber(stores.suspended)
    },
    sellers: {
      total: toNumber(sellers.total),
      activated: toNumber(sellers.activated),
      paidTopUp: toNumber(sellers.paid),
      creditOnly: toNumber(sellers.credit_only)
    },
    wallets: wallets.map((w) => ({
      currency: String(w.currency),
      wallets: toNumber(w.wallets),
      positiveTotal: toNumber(w.positive_total),
      positiveCount: toNumber(w.positive_count),
      negativeTotal: toNumber(w.negative_total),
      negativeCount: toNumber(w.negative_count)
    })),
    pendingTopUps: { count: toNumber(pending.count), amount: toNumber(pending.amount) }
  }
})

/**
 * Period KPIs (current and previous window) and the chart series, in two
 * statements. Shared per request by the KPI, chart and growth sections.
 */
export const getOverviewTrend = cache(async function getOverviewTrend (
  period: OverviewPeriod
): Promise<OverviewTrend> {
  await getAdminUser()

  const bounds = periodBounds(period)
  const lastBucket = bucketCount(period) - 1
  const [totalsResult, seriesResult] = await runLimited([
    () => db.execute(sql`
      WITH ${bounds},
      o AS (
        SELECT
          count(*) FILTER (WHERE x.cur AND x.counted)::int AS orders_cur,
          count(*) FILTER (WHERE x.prv AND x.counted)::int AS orders_prev,
          -- EGP only, so the figure never adds two currencies (F-61).
          coalesce(sum(x.total_amount) FILTER (WHERE x.cur AND x.counted AND x.egp), 0)::numeric(14,2)::text AS gmv_cur,
          coalesce(sum(x.total_amount) FILTER (WHERE x.prv AND x.counted AND x.egp), 0)::numeric(14,2)::text AS gmv_prev,
          count(*) FILTER (WHERE x.cur AND x.counted AND x.egp)::int AS gmv_orders_cur,
          count(*) FILTER (WHERE x.prv AND x.counted AND x.egp)::int AS gmv_orders_prev,
          count(*) FILTER (WHERE x.cur AND x.status = 'delivered')::int AS delivered_cur,
          count(*) FILTER (WHERE x.prv AND x.status = 'delivered')::int AS delivered_prev,
          count(DISTINCT x.store_id) FILTER (WHERE x.cur AND x.counted)::int AS active_stores_cur,
          count(DISTINCT x.store_id) FILTER (WHERE x.prv AND x.counted)::int AS active_stores_prev
        FROM (
          SELECT ${cur('o.created_at')} AS cur, ${prv('o.created_at')} AS prv,
            o.status NOT IN ${EXCLUDED} AS counted,
            coalesce(o.currency, 'EGP') = 'EGP' AS egp,
            o.status, o.total_amount, o.store_id
          FROM orders o, b WHERE NOT o.is_test AND ${either('o.created_at')}
        ) x
      ),
      f AS (
        SELECT
          coalesce(-sum(${FEE_EGP}) FILTER (WHERE ${cur('t.created_at')}), 0)::numeric(14,2)::text AS fees_cur,
          coalesce(-sum(${FEE_EGP}) FILTER (WHERE ${prv('t.created_at')}), 0)::numeric(14,2)::text AS fees_prev
        FROM wallet_transactions t, b
        WHERE t.type IN ('fee', 'fee_reversal') AND ${either('t.created_at')}
      ),
      se AS (
        SELECT
          count(*) FILTER (WHERE ${cur('se.created_at')})::int AS new_sellers_cur,
          count(*) FILTER (WHERE ${prv('se.created_at')})::int AS new_sellers_prev
        FROM sellers se, b WHERE ${either('se.created_at')}
      ),
      st AS (
        SELECT
          count(*) FILTER (WHERE ${cur('st.created_at')})::int AS new_stores_cur,
          count(*) FILTER (WHERE ${prv('st.created_at')})::int AS new_stores_prev,
          count(*) FILTER (WHERE ${cur('st.first_published_at')})::int AS first_published_cur,
          count(*) FILTER (WHERE ${prv('st.first_published_at')})::int AS first_published_prev
        FROM stores st, b
        WHERE st.deleted_at IS NULL AND (${either('st.created_at')} OR ${either('st.first_published_at')})
      ),
      tu AS (
        SELECT
          count(*) FILTER (WHERE ${cur('u.created_at')})::int AS top_ups_cur,
          count(*) FILTER (WHERE ${prv('u.created_at')})::int AS top_ups_prev,
          count(DISTINCT u.seller_id) FILTER (WHERE ${cur('u.created_at')})::int AS top_up_sellers,
          coalesce(sum(u.amount) FILTER (WHERE ${cur('u.created_at')}), 0)::numeric(14,2)::text AS top_up_paid_cur,
          coalesce(sum(u.amount) FILTER (WHERE ${prv('u.created_at')}), 0)::numeric(14,2)::text AS top_up_paid_prev,
          coalesce(sum(u.credit_amount) FILTER (WHERE ${cur('u.created_at')} AND u.credit_currency = 'USD'), 0)::numeric(14,2)::text AS top_up_credited,
          count(*) FILTER (WHERE ${cur('u.created_at')} AND u.first)::int AS first_top_ups
        FROM (
          SELECT u.*, row_number() OVER (PARTITION BY u.seller_id ORDER BY u.created_at, u.id) = 1 AS first
          FROM seller_wallet_top_ups u WHERE u.status = 'succeeded'
        ) u, b
        WHERE ${either('u.created_at')}
      ),
      ad AS (
        SELECT
          count(*) FILTER (WHERE ${cur('t.created_at')})::int AS admin_credits_cur,
          count(*) FILTER (WHERE ${prv('t.created_at')})::int AS admin_credits_prev,
          count(DISTINCT t.seller_id) FILTER (WHERE ${cur('t.created_at')})::int AS admin_credit_sellers,
          coalesce(sum(t.amount) FILTER (WHERE ${cur('t.created_at')} AND t.currency = 'USD'), 0)::numeric(14,2)::text AS admin_credit_net
        FROM wallet_transactions t, b
        WHERE t.type = 'adjustment' AND t.reference_type = 'admin' AND ${either('t.created_at')}
      ),
      ac AS (
        SELECT
          count(*) FILTER (WHERE ${cur('a.at')})::int AS activated_cur,
          count(*) FILTER (WHERE ${prv('a.at')})::int AS activated_prev
        FROM (${FIRST_ACTIVATION}) a, b
        WHERE ${either('a.at')}
      )
      SELECT * FROM o, f, se, st, tu, ad, ac
    `),
    () => db.execute(sql`
      WITH ${bounds},
      idx AS (SELECT generate_series(0, ${lastBucket}::int) AS i),
      o AS (
        SELECT ${bucketOf('o.created_at', period)} AS i,
          count(*) FILTER (WHERE o.status NOT IN ${EXCLUDED}) AS orders,
          coalesce(sum(o.total_amount) FILTER (
            WHERE o.status NOT IN ${EXCLUDED} AND coalesce(o.currency, 'EGP') = 'EGP'), 0) AS gmv
        FROM orders o, b WHERE NOT o.is_test AND ${cur('o.created_at')} GROUP BY 1
      ),
      f AS (
        SELECT ${bucketOf('t.created_at', period)} AS i, -sum(${FEE_EGP}) AS fees
        FROM wallet_transactions t, b
        WHERE t.type IN ('fee', 'fee_reversal') AND ${cur('t.created_at')} GROUP BY 1
      ),
      se AS (
        SELECT ${bucketOf('se.created_at', period)} AS i, count(*) AS new_sellers
        FROM sellers se, b WHERE ${cur('se.created_at')} GROUP BY 1
      ),
      st AS (
        SELECT ${bucketOf('st.created_at', period)} AS i, count(*) AS new_stores
        FROM stores st, b WHERE st.deleted_at IS NULL AND ${cur('st.created_at')} GROUP BY 1
      ),
      fp AS (
        SELECT ${bucketOf('st.first_published_at', period)} AS i, count(*) AS first_published
        FROM stores st, b WHERE st.deleted_at IS NULL AND ${cur('st.first_published_at')} GROUP BY 1
      ),
      tu AS (
        SELECT ${bucketOf('u.created_at', period)} AS i, count(*) AS top_ups
        FROM seller_wallet_top_ups u, b WHERE u.status = 'succeeded' AND ${cur('u.created_at')} GROUP BY 1
      )
      SELECT idx.i,
        coalesce(o.gmv, 0)::numeric(14,2)::text AS gmv,
        coalesce(o.orders, 0)::int AS orders,
        coalesce(f.fees, 0)::numeric(14,2)::text AS fees,
        coalesce(se.new_sellers, 0)::int AS new_sellers,
        coalesce(st.new_stores, 0)::int AS new_stores,
        coalesce(fp.first_published, 0)::int AS first_published,
        coalesce(tu.top_ups, 0)::int AS top_ups
      FROM idx
      LEFT JOIN o ON o.i = idx.i
      LEFT JOIN f ON f.i = idx.i
      LEFT JOIN se ON se.i = idx.i
      LEFT JOIN st ON st.i = idx.i
      LEFT JOIN fp ON fp.i = idx.i
      LEFT JOIN tu ON tu.i = idx.i
      ORDER BY idx.i
    `)
  ])

  return buildTrend(
    period,
    rows(totalsResult)[0] ?? {},
    rows(seriesResult) as unknown as RawOverviewPoint[]
  )
})

/** Seller activation funnel, order outcomes and payment mix of the period. */
export async function getOverviewMix (period: OverviewPeriod): Promise<OverviewMix> {
  await getAdminUser()

  const [result] = await runLimited([
    () => db.execute(sql`
      WITH ${periodBounds(period)},
      act AS (${FIRST_ACTIVATION})
      SELECT
        (SELECT json_build_object(
          'signed_up', count(*),
          'store', count(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM stores st WHERE st.seller_id = se.id AND st.deleted_at IS NULL)),
          'product', count(*) FILTER (WHERE EXISTS (SELECT 1 FROM products p WHERE p.seller_id = se.id)),
          'published', count(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM stores st WHERE st.seller_id = se.id AND st.first_published_at IS NOT NULL)),
          'activated', count(*) FILTER (WHERE EXISTS (SELECT 1 FROM act WHERE act.seller_id = se.id)),
          'order', count(*) FILTER (WHERE EXISTS (SELECT 1 FROM order_items oi WHERE oi.seller_id = se.id))
        ) FROM sellers se, b WHERE ${cur('se.created_at')}) AS funnel,
        (SELECT json_object_agg(status, n) FROM (
          SELECT o.status, count(*)::int AS n FROM orders o, b
          WHERE NOT o.is_test AND ${cur('o.created_at')} GROUP BY o.status
        ) x) AS outcomes,
        (SELECT json_object_agg(payment_method, n) FROM (
          SELECT o.payment_method, count(*)::int AS n FROM orders o, b
          WHERE NOT o.is_test AND ${cur('o.created_at')} AND o.status NOT IN ${EXCLUDED} GROUP BY o.payment_method
        ) x) AS payments
    `)
  ])

  const row = rows(result)[0] ?? {}
  const payments = (row.payments ?? {}) as Record<string, unknown>
  return {
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

/** Top stores by GMV in the period (growth vs the previous one), plus the latest stores. */
export async function getOverviewStores (period: OverviewPeriod): Promise<{
  top: OverviewStoreRow[]
  latest: OverviewNewStore[]
}> {
  await getAdminUser()

  const [topResult, latestResult] = await runLimited([
    () => db.execute(sql`
      WITH ${periodBounds(period)},
      cur AS (
        SELECT o.store_id,
          count(*) FILTER (WHERE o.status NOT IN ${EXCLUDED})::int AS orders,
          coalesce(sum(o.total_amount) FILTER (WHERE o.status NOT IN ${EXCLUDED} AND coalesce(o.currency, 'EGP') = 'EGP'), 0) AS gmv,
          count(*) FILTER (WHERE o.status = 'delivered')::int AS delivered,
          count(*) FILTER (WHERE o.status = 'returned')::int AS returned
        FROM orders o, b WHERE NOT o.is_test AND o.store_id IS NOT NULL AND ${cur('o.created_at')} GROUP BY o.store_id
      ),
      prev AS (
        SELECT o.store_id, coalesce(sum(o.total_amount), 0) AS gmv
        FROM orders o, b
        WHERE NOT o.is_test AND o.store_id IS NOT NULL AND ${prv('o.created_at')}
          AND o.status NOT IN ${EXCLUDED} AND coalesce(o.currency, 'EGP') = 'EGP'
        GROUP BY o.store_id
      )
      SELECT st.id, st.name, st.subdomain, st.logo_url, st.site_status,
        cur.orders, cur.gmv::numeric(14,2)::text AS gmv, cur.delivered, cur.returned,
        prev.gmv::numeric(14,2)::text AS prev_gmv,
        sw.balance::text AS wallet,
        sw.currency AS wallet_currency,
        (SELECT ${customDomainPublicHostRawSql('d')} FROM seller_custom_domains d
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
        walletBalance: row.wallet == null ? null : toNumber(row.wallet),
        walletCurrency: row.wallet_currency ? String(row.wallet_currency) : 'EGP'
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
