/**
 * Admin › Billing (ROADMAP.md F-55f, F-56): the switch's state, rates, Pro
 * counts and the read-only report before the switch; one audited settings
 * write. There is no switch here: billing_switch_to_usd is run by SQL with the
 * owner's approval. Callers check the admin session first. Never cached.
 */
import { billingSettings, db, desc, eq, exchangeRates, sql } from "@workspace/db";
import { getBillingState, updateBillingSettings } from "../billing/billing.server";
import type { BillingState } from "../billing/billing.lib";
import { billingSettingsSchema } from "./billing-admin.lib";
import type { AdminResult } from "./admin.lib";
import { AdminActorError, assertAdminActor, writeAdminAudit, type Queryable } from "./guard.server";

const RATE_HISTORY_ROWS = 10;

export type ProPlanCounts = {
  /** Pro inside a period they paid for. */
  paid: number;
  /** Paid Pro past the end of the period, in the days of grace: nothing was paid for this month. */
  inGrace: number;
  /** Free from an Admin: never charged, not income. */
  adminGranted: number;
};

/** The same counts as packages/db/scripts/billing-usd-dry-run.sql, at the rate given. */
export type BillingDryRun = {
  rate: number;
  wallets: number;
  positiveWallets: number;
  negativeWallets: number;
  positiveEgp: string;
  negativeEgp: string;
  positiveUsd: string;
  negativeUsd: string;
  positiveEgpFromOldSales: string;
  pendingTopUps: number;
  giftsEnding: number;
  unstartedTrialsEnding: number;
};

export type BillingOverview = {
  state: BillingState;
  usdLiveAt: string | null;
  /** The rate the wallets were converted at; set by the switch. */
  conversionRate: number | null;
  /** The typed fixed rate, if any; `state.marketRate` already prefers it. */
  rateOverride: number | null;
  /** Newest first. */
  rates: { id: string; marketRate: string; source: string; fetchedAt: string }[];
  pro: ProPlanCounts;
  /** Only while not live, and only when a rate exists. */
  dryRun: BillingDryRun | null;
};

async function getProPlanCounts(q: Queryable): Promise<ProPlanCounts> {
  const [row] = await q.execute<{ paid: number; in_grace: number; admin_granted: number }>(sql`
    SELECT (count(*) FILTER (WHERE NOT plan_admin_granted AND plan_expires_at > now()))::int AS paid,
           (count(*) FILTER (WHERE NOT plan_admin_granted AND plan_expires_at <= now() AND plan_grace_until > now()))::int AS in_grace,
           (count(*) FILTER (WHERE plan_admin_granted AND (plan_expires_at IS NULL OR plan_expires_at > now())))::int AS admin_granted
      FROM sellers
     WHERE plan = 'pro'
  `);
  return {
    paid: Number(row?.paid ?? 0),
    inGrace: Number(row?.in_grace ?? 0),
    adminGranted: Number(row?.admin_granted ?? 0),
  };
}

/** Read-only. Keep in step with packages/db/scripts/billing-usd-dry-run.sql. */
export async function getBillingDryRun(rate: number, q: Queryable = db): Promise<BillingDryRun> {
  const [row] = await q.execute<Record<string, string | number>>(sql`
    WITH wallets AS (
      SELECT w.seller_id, w.balance, round(w.balance / ${rate}::numeric, 2) AS usd
        FROM seller_wallet w
       WHERE w.currency <> 'USD'
    ),
    old_sales AS (
      SELECT t.seller_id, sum(t.amount) AS sale_total
        FROM wallet_transactions t
       WHERE t.type = 'sale' AND coalesce(t.currency, 'EGP') = 'EGP'
       GROUP BY 1
    )
    SELECT
      (SELECT count(*) FROM wallets)::int AS wallets,
      (SELECT count(*) FROM wallets WHERE balance > 0)::int AS positive_wallets,
      (SELECT count(*) FROM wallets WHERE balance < 0)::int AS negative_wallets,
      (SELECT coalesce(sum(balance) FILTER (WHERE balance > 0), 0) FROM wallets)::text AS positive_egp,
      (SELECT coalesce(sum(balance) FILTER (WHERE balance < 0), 0) FROM wallets)::text AS negative_egp,
      (SELECT coalesce(sum(usd) FILTER (WHERE usd > 0), 0) FROM wallets)::text AS positive_usd,
      (SELECT coalesce(sum(usd) FILTER (WHERE usd < 0), 0) FROM wallets)::text AS negative_usd,
      (SELECT coalesce(sum(least(w.balance, o.sale_total)), 0)
         FROM wallets w JOIN old_sales o USING (seller_id) WHERE w.balance > 0)::text AS positive_egp_from_old_sales,
      (SELECT count(*) FROM seller_wallet_top_ups WHERE status IN ('pending', 'processing'))::int AS pending_top_ups,
      (SELECT count(*) FROM sellers WHERE welcome_gift_eligible)::int AS gifts_ending,
      (SELECT count(*) FROM sellers WHERE fee_trial_eligible AND fee_trial_started_at IS NULL)::int AS unstarted_trials_ending
  `);
  return {
    rate,
    wallets: Number(row?.wallets ?? 0),
    positiveWallets: Number(row?.positive_wallets ?? 0),
    negativeWallets: Number(row?.negative_wallets ?? 0),
    positiveEgp: String(row?.positive_egp ?? "0"),
    negativeEgp: String(row?.negative_egp ?? "0"),
    positiveUsd: String(row?.positive_usd ?? "0"),
    negativeUsd: String(row?.negative_usd ?? "0"),
    positiveEgpFromOldSales: String(row?.positive_egp_from_old_sales ?? "0"),
    pendingTopUps: Number(row?.pending_top_ups ?? 0),
    giftsEnding: Number(row?.gifts_ending ?? 0),
    unstartedTrialsEnding: Number(row?.unstarted_trials_ending ?? 0),
  };
}

export async function getBillingOverview(q: Queryable = db): Promise<BillingOverview> {
  // One after another: the serverless DB pool is small.
  const state = await getBillingState();
  const [settings] = await q
    .select({
      usdLiveAt: billingSettings.usdLiveAt,
      conversionRate: billingSettings.conversionRate,
      rateOverride: billingSettings.rateOverride,
    })
    .from(billingSettings)
    .limit(1);
  const rates = await q
    .select({
      id: exchangeRates.id,
      marketRate: exchangeRates.marketRate,
      source: exchangeRates.source,
      fetchedAt: exchangeRates.fetchedAt,
    })
    .from(exchangeRates)
    .orderBy(desc(exchangeRates.fetchedAt))
    .limit(RATE_HISTORY_ROWS);
  const pro = await getProPlanCounts(q);
  const dryRun = !state.usdLive && state.marketRate ? await getBillingDryRun(state.marketRate, q) : null;
  return {
    state,
    usdLiveAt: settings?.usdLiveAt ?? null,
    conversionRate: settings?.conversionRate ? Number(settings.conversionRate) : null,
    rateOverride: settings?.rateOverride ? Number(settings.rateOverride) : null,
    rates,
    pro,
    dryRun,
  };
}

export type BillingSettingsError = "not_admin" | "invalid_input" | "no_change";

/** Fixed rate and tax switch, with one audit row, in one transaction. Can't touch the switch itself. */
export async function updateBillingSettingsByAdmin(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<AdminResult<{ auditId: string }, BillingSettingsError>> {
  const parsed = billingSettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { rateOverride, taxEnabled } = parsed.data;

  try {
    const auditId = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [row] = await tx
        .select({
          rateOverride: billingSettings.rateOverride,
          taxEnabled: billingSettings.taxEnabled,
        })
        .from(billingSettings)
        .where(eq(billingSettings.id, true))
        .for("update");
      const before = {
        rateOverride: row?.rateOverride ? Number(row.rateOverride) : null,
        taxEnabled: row?.taxEnabled ?? null,
      };
      const after = { rateOverride, taxEnabled };
      if (JSON.stringify(before) === JSON.stringify(after)) return null;

      await updateBillingSettings({ rateOverride, taxEnabled, updatedBy: actorId }, tx);
      return writeAdminAudit(tx, {
        actorId,
        sellerId: null,
        targetType: "billing_settings",
        targetId: "billing",
        action: "update_billing_settings",
        before,
        after,
        reason: "Admin edit",
      });
    });
    if (!auditId) return { success: false, error: "no_change" };
    return { success: true, data: { auditId } };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    throw error;
  }
}
