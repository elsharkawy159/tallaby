/**
 * Admin › Seller notifications: count an audience and send one message to
 * every seller in it (seller-broadcast.lib.ts). Each recipient gets the same
 * row the one-seller dialog writes (seller-messages.server.ts): a
 * `seller_notifications` row of type `admin_message` with dedupe key
 * `admin_message:<idempotency key>`, so the 0098 trigger nudges the bell, the
 * 0124 dispatcher pushes it (admin messages are always pushed) and a replay
 * of the same form inserts nothing. One admin_audit_log row per recipient,
 * written in the same statement, shows it in that seller's audit tab.
 */
import type { SQL } from "drizzle-orm";
import { db, sql } from "@workspace/db";
import { SELLER_AUDIENCE_SAMPLE, SELLER_BROADCAST_MAX, sellerAudienceSchema, sellerBroadcastSchema, type SellerAudience } from "./seller-broadcast.lib";
import type { AdminResult } from "./admin.lib";
import { AdminActorError, assertAdminActor, type Queryable } from "./guard.server";

/**
 * isProActive (billing.lib.ts) in SQL: plan 'pro' and the later of
 * plan_expires_at / plan_grace_until is unset or still ahead. `greatest`
 * ignores NULLs like isProActive's filter, and `plan` is NOT NULL, so this is
 * never NULL.
 */
const proActive = sql`(s.plan = 'pro' AND (greatest(s.plan_expires_at, s.plan_grace_until) IS NULL
  OR greatest(s.plan_expires_at, s.plan_grace_until) > now()))`;

/** A store of seller `s` that the seller still has: not deleted, not archived. */
const liveStore = (alias: string) =>
  sql.raw(`${alias}.seller_id = s.id AND ${alias}.deleted_at IS NULL AND ${alias}.status <> 'archived'`);
const hasLiveStore = sql`EXISTS (SELECT 1 FROM stores st WHERE ${liveStore("st")})`;

/**
 * The WHERE condition over `sellers s` for an audience. Exported for tests.
 * The count, the "count changed" check and the send all use it, so they
 * always agree.
 *
 * - Every audience: the seller and its user aren't suspended.
 * - `wallet_empty`: the dashboard Wallet page's balance,
 *   coalesce(seller_wallet.balance, 0), is 0 or below. One wallet per seller
 *   account (the per-store wallet split isn't built).
 * - `not_activated`: getOrderLock's rule (billing/order-lock.server.ts) as one
 *   set query: the USD switch is on, no active Pro (isProActive), no succeeded
 *   top-up, no `top_up` ledger entry, no balance above 0 now and no USD entry
 *   that left it above 0.
 * - Store audiences need a live store (`liveStore`) and look at live stores only:
 *   - `tallaby_pay_not_connected`: no `store_integrations` row with provider
 *     `tallaby_pay` and status `connected` (getStorefrontGateway's rule; a
 *     turned-off row is kept as `disconnected`). The `tallaby_pay_live`
 *     launch switch is not checked.
 *   - `no_active_product`: storeHasActiveProduct's rule (store-sites/server.ts):
 *     status 'active' and not in Trash.
 *   - `site_not_published`: no `site_status = 'published'`.
 *   - `no_shipping_zones`: no `enabled` zone (store-quote.ts only uses enabled
 *     zones).
 * - `free_plan` / `pro_plan`: `proActive` false / true.
 * - `joined_last_7_days`: `sellers.created_at` within the last 7 days.
 */
export function sellerAudienceCondition(audience: SellerAudience): SQL {
  const base = sql`s.status IS DISTINCT FROM 'suspended'
    AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.id AND u.is_suspended IS TRUE)`;
  const walletBalance = sql`coalesce((SELECT w.balance FROM seller_wallet w WHERE w.seller_id = s.id), 0)`;

  switch (audience) {
    case "all":
      return base;
    case "wallet_empty":
      return sql`${base} AND ${walletBalance} <= 0`;
    case "not_activated":
      return sql`${base}
        AND EXISTS (SELECT 1 FROM billing_settings b WHERE b.usd_live IS TRUE)
        AND NOT ${proActive}
        AND NOT EXISTS (SELECT 1 FROM seller_wallet_top_ups t WHERE t.seller_id = s.id AND t.status = 'succeeded')
        AND NOT EXISTS (SELECT 1 FROM wallet_transactions wt WHERE wt.seller_id = s.id AND wt.type = 'top_up')
        AND ${walletBalance} <= 0
        AND NOT EXISTS (SELECT 1 FROM wallet_transactions wt
          WHERE wt.seller_id = s.id AND wt.currency = 'USD' AND wt.balance_after > 0)`;
    case "tallaby_pay_not_connected":
      return sql`${base} AND ${hasLiveStore}
        AND NOT EXISTS (SELECT 1 FROM stores st JOIN store_integrations si ON si.store_id = st.id AND si.seller_id = s.id
          WHERE ${liveStore("st")} AND si.provider = 'tallaby_pay' AND si.status = 'connected')`;
    case "no_active_product":
      return sql`${base} AND ${hasLiveStore}
        AND NOT EXISTS (SELECT 1 FROM stores st JOIN products p ON p.store_id = st.id AND p.seller_id = s.id
          WHERE ${liveStore("st")} AND p.status = 'active' AND p.deleted_at IS NULL)`;
    case "site_not_published":
      return sql`${base} AND ${hasLiveStore}
        AND NOT EXISTS (SELECT 1 FROM stores st WHERE ${liveStore("st")} AND st.site_status = 'published')`;
    case "no_shipping_zones":
      return sql`${base} AND ${hasLiveStore}
        AND NOT EXISTS (SELECT 1 FROM stores st JOIN store_shipping_zones z ON z.store_id = st.id
          WHERE ${liveStore("st")} AND z.enabled IS TRUE)`;
    case "free_plan":
      return sql`${base} AND NOT ${proActive}`;
    case "pro_plan":
      return sql`${base} AND ${proActive}`;
    case "joined_last_7_days":
      return sql`${base} AND s.created_at >= now() - interval '7 days'`;
  }
}

function rowsOf<T>(result: unknown): T[] {
  return Array.isArray(result) ? (result as T[]) : ((result as { rows?: T[] }).rows ?? []);
}

export type SellerAudienceCount = { count: number; sample: string[] };

/**
 * How many sellers an audience has now, and a few business names for the
 * preview. Read fresh, never cached. Callers already checked the admin session.
 */
export async function countSellerAudience(audience: unknown, q: Queryable = db): Promise<SellerAudienceCount | null> {
  const parsed = sellerAudienceSchema.safeParse(audience);
  if (!parsed.success) return null;
  const where = sellerAudienceCondition(parsed.data);
  const [counted, sample] = await Promise.all([
    q.execute(sql`SELECT count(*)::int AS count FROM sellers s WHERE ${where}`),
    q.execute(sql`SELECT s.business_name FROM sellers s WHERE ${where} ORDER BY s.created_at DESC LIMIT ${SELLER_AUDIENCE_SAMPLE}`),
  ]);
  return {
    count: Number(rowsOf<{ count: number }>(counted)[0]?.count ?? 0),
    sample: rowsOf<{ business_name: string | null }>(sample).flatMap((row) => (row.business_name ? [row.business_name] : [])),
  };
}

export type SellerBroadcastError = "not_admin" | "invalid_input" | "audience_changed" | "too_many" | "already_sent";
export type SellerBroadcastResult = { sent: number; skipped: number };

class BroadcastError extends Error {
  constructor(
    readonly code: SellerBroadcastError,
    readonly count?: number,
  ) {
    super(code);
  }
}

/**
 * Sends the message to every seller in the audience, in one transaction.
 * Refuses (`audience_changed`, with the new count) when the audience no longer
 * matches the count the admin confirmed, and `too_many` above
 * SELLER_BROADCAST_MAX. Sellers who already got this idempotency key are
 * skipped by the dedupe key; when every one is skipped it is `already_sent`.
 */
export async function sendSellerBroadcastByAdmin(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<AdminResult<SellerBroadcastResult, SellerBroadcastError> & { count?: number }> {
  const parsed = sellerBroadcastSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const m = parsed.data;
  const message = { title: m.title, body: m.body, ...(m.link ? { link: m.link } : {}) };
  const after = { ...message, audience: m.audience, ...(m.templateId ? { templateId: m.templateId } : {}) };
  const dedupeKey = `admin_message:${m.idempotencyKey.toLowerCase()}`;
  const where = sellerAudienceCondition(m.audience);

  try {
    const data = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);

      const [counted] = rowsOf<{ count: number }>(await tx.execute(sql`SELECT count(*)::int AS count FROM sellers s WHERE ${where}`));
      const matched = Number(counted?.count ?? 0);
      if (matched > SELLER_BROADCAST_MAX) throw new BroadcastError("too_many", matched);
      if (matched !== m.expectedCount) throw new BroadcastError("audience_changed", matched);

      const [row] = rowsOf<{ sent: number }>(
        await tx.execute(sql`
          WITH sent AS (
            INSERT INTO seller_notifications (seller_id, type, data, dedupe_key)
            SELECT s.id, 'admin_message', ${JSON.stringify(message)}::jsonb, ${dedupeKey}
            FROM sellers s WHERE ${where}
            ON CONFLICT (seller_id, dedupe_key) DO NOTHING
            RETURNING id, seller_id
          ), audit AS (
            INSERT INTO admin_audit_log (actor_id, seller_id, target_type, target_id, action, before, after, reason)
            SELECT ${actorId}::uuid, sent.seller_id, 'seller_notification', sent.id::text,
              'send_seller_notification', '{}'::jsonb, ${JSON.stringify(after)}::jsonb,
              ${`Message sent to a group of sellers (${m.audience})`}
            FROM sent
            RETURNING 1
          )
          SELECT (SELECT count(*)::int FROM sent) AS sent, (SELECT count(*)::int FROM audit) AS audited
        `),
      );
      const sent = Number(row?.sent ?? 0);
      if (sent === 0) throw new BroadcastError("already_sent");
      return { sent, skipped: matched - sent };
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof BroadcastError) {
      return { success: false, error: error.code, ...(error.count !== undefined ? { count: error.count } : {}) };
    }
    throw error;
  }
}
