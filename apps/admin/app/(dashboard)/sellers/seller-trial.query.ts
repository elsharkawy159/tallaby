import { sellers } from "@workspace/db";
import { sql, type SQLWrapper } from "drizzle-orm";
import {
  ORDER_GRACE_DAYS,
  ORDER_GRACE_DAYS_SHORT,
  ORDER_GRACE_START_FLOOR,
  SHORT_GRACE_FROM,
} from "@workspace/lib/billing/order-grace";
import { MANUAL_TOP_UP_METHODS } from "@workspace/lib/store-wallet";
import type { SellerTrialState } from "./seller-trial.lib";

/**
 * getOrderLock's activation facts (packages/lib/src/billing/order-lock.server.ts)
 * and the trial end (order-lock.lib.ts) as SQL over one seller row, for the
 * Admin sellers list, its filter and export, and the WhatsApp message facts.
 * Each takes the outer seller columns, so it works with `sellers` or an alias.
 */

/** The USD switch is on (`billing_settings.usd_live`). */
export const usdLiveSql = sql`EXISTS (SELECT 1 FROM billing_settings b WHERE b.usd_live IS TRUE)`;

/** A succeeded top-up row of any provider, or a `top_up` ledger entry. */
export const sellerHasTopUpSql = (sellerId: SQLWrapper) => sql`(
  EXISTS (SELECT 1 FROM seller_wallet_top_ups t WHERE t.seller_id = ${sellerId} AND t.status = 'succeeded')
  OR EXISTS (SELECT 1 FROM wallet_transactions wt WHERE wt.seller_id = ${sellerId} AND wt.type = 'top_up'))`;

/** The store wallet balance is above zero now, or a USD ledger entry once left it above zero. */
export const sellerHadPositiveBalanceSql = (sellerId: SQLWrapper) => sql`(
  coalesce((SELECT w.balance FROM seller_wallet w WHERE w.seller_id = ${sellerId}), 0) > 0
  OR EXISTS (SELECT 1 FROM wallet_transactions wt
    WHERE wt.seller_id = ${sellerId} AND wt.currency = 'USD' AND wt.balance_after > 0))`;

/** A manual top-up (MANUAL_TOP_UP_METHODS) waits for review. */
export const sellerPendingManualTopUpSql = (sellerId: SQLWrapper) => sql`EXISTS (
  SELECT 1 FROM seller_wallet_top_ups t
  WHERE t.seller_id = ${sellerId} AND t.status = 'pending'
    AND t.provider IN (${sql.join(MANUAL_TOP_UP_METHODS.map((method) => sql`${method}`), sql`, `)}))`;

type SellerColumns = {
  id: SQLWrapper;
  plan: SQLWrapper;
  planExpiresAt: SQLWrapper;
  planGraceUntil: SQLWrapper;
  createdAt: SQLWrapper;
};

/** The `sellers` table's own columns, for queries over `sellers` itself. */
export const sellersTrialColumns: SellerColumns = {
  id: sellers.id,
  plan: sellers.plan,
  planExpiresAt: sellers.planExpiresAt,
  planGraceUntil: sellers.planGraceUntil,
  createdAt: sellers.createdAt,
};

/** isProActive (billing.lib.ts): plan 'pro' and the later end date unset or ahead (`greatest` skips NULLs). */
const proActiveSql = (s: SellerColumns) => sql`(${s.plan} = 'pro'
  AND (greatest(${s.planExpiresAt}, ${s.planGraceUntil}) IS NULL OR greatest(${s.planExpiresAt}, ${s.planGraceUntil}) > now()))`;

/** isActivated without the USD switch: active Pro, a top-up, or a balance ever above zero. */
export const sellerActivatedSql = (s: SellerColumns) =>
  sql`(${proActiveSql(s)} OR ${sellerHasTopUpSql(s.id)} OR ${sellerHadPositiveBalanceSql(s.id)})`;

/**
 * When the trial's days end: orderGraceStart (sign-up, never before the floor;
 * `greatest` skips a NULL sign-up) plus orderGraceDays (7 from SHORT_GRACE_FROM,
 * else 14; an unknown sign-up gets 14). Whole 24-hour days like the lib's
 * DAY_MS, whatever the session timezone. The constants come from order-lock.lib.ts.
 */
export const sellerTrialEndSql = (createdAt: SQLWrapper) => sql`(
  greatest(${createdAt}, ${ORDER_GRACE_START_FLOOR}::timestamptz)
  + make_interval(hours => 24 * CASE WHEN ${createdAt} >= ${SHORT_GRACE_FROM}::timestamptz
    THEN ${ORDER_GRACE_DAYS_SHORT}::int ELSE ${ORDER_GRACE_DAYS}::int END))`;

/** sellerTrialStatus's state (seller-trial.lib.ts) in SQL, for the list filter. */
export const sellerTrialStateSql = (s: SellerColumns) => sql<SellerTrialState>`(CASE
  WHEN NOT ${usdLiveSql} OR ${sellerActivatedSql(s)} THEN 'activated'
  WHEN now() < ${sellerTrialEndSql(s.createdAt)} THEN 'in_trial'
  WHEN ${sellerPendingManualTopUpSql(s.id)} THEN 'in_review'
  ELSE 'offline' END)`;
