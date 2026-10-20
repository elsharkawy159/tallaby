/**
 * SaaS KPIs for the admin home (docs/admin-saas.md §3.9). One round trip
 * (the home page already shares the pooler with other aggregates). Wallet
 * derived, so never Data-Cached (CLAUDE.md rule 8).
 */
import { db, sql } from "@workspace/db";
import type { Queryable } from "./guard.server";

export interface SaasKpis {
  storesTotal: number;
  stores7d: number;
  stores30d: number;
  publishedSites: number;
  activeSellers: number;
  sellersInTrial: number;
  sellersPastTrial: number;
  /** EGP, positive: platform fees taken from store wallets in the last 30 days. */
  feeRevenue30d: string;
  negativeWallets: number;
  /** EGP, negative or zero: the sum of all negative store-wallet balances. */
  negativeTotal: string;
}

export async function getSaasKpis(q: Queryable = db): Promise<SaasKpis> {
  const result = await q.execute(sql`
    SELECT
      (SELECT count(*) FROM stores WHERE deleted_at IS NULL)::int AS stores_total,
      (SELECT count(*) FROM stores WHERE deleted_at IS NULL AND created_at >= now() - interval '7 days')::int AS stores_7d,
      (SELECT count(*) FROM stores WHERE deleted_at IS NULL AND created_at >= now() - interval '30 days')::int AS stores_30d,
      (SELECT count(*) FROM stores WHERE deleted_at IS NULL AND site_status = 'published')::int AS published_sites,
      (SELECT count(DISTINCT seller_id) FROM stores WHERE deleted_at IS NULL AND status = 'active')::int AS active_sellers,
      (SELECT count(*) FROM sellers WHERE fee_trial_ends_at > now())::int AS sellers_in_trial,
      (SELECT count(*) FROM sellers WHERE fee_trial_ends_at <= now())::int AS sellers_past_trial,
      (SELECT coalesce(-sum(amount), 0)::numeric(12,2)::text FROM wallet_transactions
        WHERE type = 'fee' AND created_at >= now() - interval '30 days') AS fee_revenue_30d,
      (SELECT count(*) FROM seller_wallet WHERE balance < 0)::int AS negative_wallets,
      (SELECT coalesce(sum(balance), 0)::numeric(12,2)::text FROM seller_wallet WHERE balance < 0) AS negative_total
  `);
  const row = ([...result][0] ?? {}) as Record<string, unknown>;
  const n = (key: string) => Number(row[key] ?? 0);
  return {
    storesTotal: n("stores_total"),
    stores7d: n("stores_7d"),
    stores30d: n("stores_30d"),
    publishedSites: n("published_sites"),
    activeSellers: n("active_sellers"),
    sellersInTrial: n("sellers_in_trial"),
    sellersPastTrial: n("sellers_past_trial"),
    feeRevenue30d: String(row.fee_revenue_30d ?? "0.00"),
    negativeWallets: n("negative_wallets"),
    negativeTotal: String(row.negative_total ?? "0.00"),
  };
}
