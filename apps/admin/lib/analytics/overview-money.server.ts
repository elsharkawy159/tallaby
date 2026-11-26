// Deliberately NOT "use server": read only by Server Components on the admin
// home. Wallet and top-up money, so nothing here is Data-Cached (CLAUDE.md rule 8).

import { cache } from 'react'
import { db } from '@workspace/db'
import { sql } from 'drizzle-orm'
import { getAdminUser } from '@/actions/auth'
import { runLimited, toNumber } from './analytics.lib'
import { conversionPercent } from './overview.lib'
import { periodBounds, rows } from './overview.server'
import type { OverviewAdminCredit, OverviewMoney, OverviewPeriod, OverviewWalletLeader } from './overview.types'

/** A seller's name: the seller row, then the user (`sellers.id = users.id`). */
const SELLER_NAME = sql`coalesce(nullif(se.display_name, ''), nullif(se.business_name, ''), nullif(us.full_name, ''), us.email, 'Seller')`

/** The seller's oldest live store, for rows that carry no store of their own. */
const FIRST_STORE = (sellerColumn: string) => sql`(SELECT s2.name FROM stores s2
  WHERE s2.seller_id = ${sql.raw(sellerColumn)} AND s2.deleted_at IS NULL ORDER BY s2.created_at LIMIT 1)`

/** Manual dashboard wallet changes (adjustStoreWalletByAdmin in packages/lib/src/admin/overrides.server.ts). */
const ADMIN_CREDIT = sql`t.type = 'adjustment' AND t.reference_type = 'admin'`

const PAID_SINCE = sql`EXISTS (SELECT 1 FROM seller_wallet_top_ups p
  WHERE p.seller_id = t.seller_id AND p.status = 'succeeded' AND p.created_at > t.created_at)`

function toAdminCredit (row: Record<string, unknown>): OverviewAdminCredit {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    sellerName: String(row.seller_name),
    storeName: row.store_name ? String(row.store_name) : null,
    amount: toNumber(row.amount),
    currency: String(row.currency),
    reason: row.reason ? String(row.reason) : null,
    adminName: row.admin_name ? String(row.admin_name) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    walletBalance: row.wallet == null ? null : toNumber(row.wallet),
    walletCurrency: row.wallet_currency ? String(row.wallet_currency) : 'EGP',
    paidSince: row.paid_since === true
  }
}

/** Top-ups by provider, admin wallet credits and recent top-ups of the period, plus every $5 credit. */
export const getOverviewMoney = cache(async function getOverviewMoney (period: OverviewPeriod): Promise<OverviewMoney> {
  await getAdminUser()

  const bounds = periodBounds(period)
  const [providerResult, creditResult, fiveResult, recentResult] = await runLimited([
    () => db.execute(sql`
      WITH ${bounds}
      SELECT u.provider,
        count(*) FILTER (WHERE u.status = 'succeeded')::int AS succeeded,
        coalesce(sum(u.amount) FILTER (WHERE u.status = 'succeeded'), 0)::numeric(14,2)::text AS paid,
        coalesce(sum(u.credit_amount) FILTER (WHERE u.status = 'succeeded' AND u.credit_currency = 'USD'), 0)::numeric(14,2)::text AS credited,
        count(*) FILTER (WHERE u.status = 'failed')::int AS failed,
        count(*) FILTER (WHERE u.status IN ('pending', 'processing'))::int AS pending
      FROM seller_wallet_top_ups u, b
      WHERE u.created_at >= b.s AND u.created_at < b.e
      GROUP BY u.provider
      ORDER BY 2 DESC, count(*) DESC
    `),
    () => db.execute(sql`
      WITH ${bounds}
      SELECT t.id, t.seller_id, t.amount::text AS amount, coalesce(t.currency, 'EGP') AS currency,
        t.metadata->>'reason' AS reason, t.created_at,
        ${SELLER_NAME} AS seller_name,
        coalesce(st.name, ${FIRST_STORE('t.seller_id')}) AS store_name,
        coalesce(nullif(au.full_name, ''), au.email) AS admin_name,
        sw.balance::text AS wallet, sw.currency AS wallet_currency,
        ${PAID_SINCE} AS paid_since
      FROM wallet_transactions t
      CROSS JOIN b
      LEFT JOIN sellers se ON se.id = t.seller_id
      LEFT JOIN users us ON us.id = t.seller_id
      LEFT JOIN stores st ON st.id = t.store_id
      LEFT JOIN users au ON au.id = t.created_by
      LEFT JOIN seller_wallet sw ON sw.seller_id = t.seller_id
      WHERE ${ADMIN_CREDIT} AND t.created_at >= b.s AND t.created_at < b.e
      ORDER BY t.created_at DESC
      LIMIT 10
    `),
    // Every $5 credit, all time (the owner wants to see who got one), with the counts over all of them.
    () => db.execute(sql`
      WITH five AS (
        SELECT t.id, t.seller_id, t.amount, t.currency, t.metadata, t.created_at, t.store_id, t.created_by,
          ${PAID_SINCE} AS paid_since
        FROM wallet_transactions t
        WHERE ${ADMIN_CREDIT} AND t.currency = 'USD' AND t.amount = 5
      ),
      totals AS (
        SELECT count(DISTINCT seller_id)::int AS sellers,
          count(DISTINCT seller_id) FILTER (WHERE paid_since)::int AS paid_sellers
        FROM five
      )
      SELECT totals.sellers, totals.paid_sellers,
        f.id, f.seller_id, f.amount::text AS amount, f.currency,
        f.metadata->>'reason' AS reason, f.created_at,
        ${SELLER_NAME} AS seller_name,
        coalesce(st.name, ${FIRST_STORE('f.seller_id')}) AS store_name,
        coalesce(nullif(au.full_name, ''), au.email) AS admin_name,
        sw.balance::text AS wallet, sw.currency AS wallet_currency,
        f.paid_since
      FROM totals
      LEFT JOIN five f ON true
      LEFT JOIN sellers se ON se.id = f.seller_id
      LEFT JOIN users us ON us.id = f.seller_id
      LEFT JOIN stores st ON st.id = f.store_id
      LEFT JOIN users au ON au.id = f.created_by
      LEFT JOIN seller_wallet sw ON sw.seller_id = f.seller_id
      ORDER BY f.created_at DESC
      LIMIT 50
    `),
    () => db.execute(sql`
      WITH ${bounds}
      SELECT u.id, u.seller_id, u.provider, u.amount::text AS paid, u.credit_amount::text AS credited,
        u.credit_currency, u.created_at,
        ${SELLER_NAME} AS seller_name,
        coalesce(st.name, ${FIRST_STORE('u.seller_id')}) AS store_name,
        NOT EXISTS (SELECT 1 FROM seller_wallet_top_ups p
          WHERE p.seller_id = u.seller_id AND p.status = 'succeeded'
            AND (p.created_at, p.id) < (u.created_at, u.id)) AS first
      FROM seller_wallet_top_ups u
      CROSS JOIN b
      LEFT JOIN sellers se ON se.id = u.seller_id
      LEFT JOIN users us ON us.id = u.seller_id
      LEFT JOIN stores st ON st.id = u.store_id
      WHERE u.status = 'succeeded' AND u.created_at >= b.s AND u.created_at < b.e
      ORDER BY u.created_at DESC
      LIMIT 8
    `)
  ])

  const fiveRows = rows(fiveResult)
  const five = fiveRows[0] ?? {}
  return {
    providers: rows(providerResult).map((row) => {
      const succeeded = toNumber(row.succeeded)
      const failed = toNumber(row.failed)
      const pending = toNumber(row.pending)
      return {
        provider: String(row.provider),
        succeeded,
        paid: toNumber(row.paid),
        credited: toNumber(row.credited),
        failed,
        pending,
        conversion: conversionPercent(succeeded, failed, pending)
      }
    }),
    credits: rows(creditResult).map(toAdminCredit),
    fiveDollar: {
      sellers: toNumber(five.sellers),
      paidSince: toNumber(five.paid_sellers),
      // With no $5 credit at all, the one totals row carries no credit.
      credits: fiveRows.filter((row) => row.id != null).map(toAdminCredit)
    },
    recentTopUps: rows(recentResult).map((row) => ({
      id: String(row.id),
      sellerId: String(row.seller_id),
      sellerName: String(row.seller_name),
      storeName: row.store_name ? String(row.store_name) : null,
      provider: String(row.provider),
      paid: toNumber(row.paid),
      credited: row.credited == null ? null : toNumber(row.credited),
      creditCurrency: row.credit_currency ? String(row.credit_currency) : null,
      createdAt: new Date(String(row.created_at)).toISOString(),
      first: row.first === true
    }))
  }
})

/** The five largest positive store wallets right now (USD ranked at the switch's rate). */
export async function getLargestWallets (): Promise<OverviewWalletLeader[]> {
  await getAdminUser()

  const [result] = await runLimited([
    () => db.execute(sql`
      SELECT sw.seller_id, sw.balance::text AS balance, sw.currency,
        ${SELLER_NAME} AS seller_name,
        ${FIRST_STORE('sw.seller_id')} AS store_name,
        EXISTS (SELECT 1 FROM seller_wallet_top_ups p
          WHERE p.seller_id = sw.seller_id AND p.status = 'succeeded') AS paid
      FROM seller_wallet sw
      LEFT JOIN sellers se ON se.id = sw.seller_id
      LEFT JOIN users us ON us.id = sw.seller_id
      WHERE sw.balance > 0
      ORDER BY sw.balance * CASE WHEN sw.currency = 'USD'
        THEN coalesce((SELECT bs.conversion_rate FROM billing_settings bs WHERE bs.id), 1) ELSE 1 END DESC
      LIMIT 5
    `)
  ])

  return rows(result).map((row) => ({
    sellerId: String(row.seller_id),
    sellerName: String(row.seller_name),
    storeName: row.store_name ? String(row.store_name) : null,
    balance: toNumber(row.balance),
    currency: String(row.currency),
    paidTopUp: row.paid === true
  }))
}
