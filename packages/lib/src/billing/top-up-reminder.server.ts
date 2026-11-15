import { db, sql } from "@workspace/db";
import { MANUAL_TOP_UP_METHODS } from "../store-wallet/top-up.lib";
import { getBillingState } from "./billing.server";
import {
  TOP_UP_REMINDER_AFTER_HOURS,
  TOP_UP_REMINDER_BATCH,
  TOP_UP_REMINDER_TYPE,
  TOP_UP_REMINDER_WINDOW_DAYS,
  isTopUpReminderDue,
  topUpReminderDedupeKey,
  type TopUpReminderCandidate,
} from "./top-up-reminder.lib";

/**
 * Database side of the 24-hour top-up reminder (top-up-reminder.lib.ts, 0172).
 * Server-only, never cached, moves no money. Seller ids come only from this
 * file's own query. The seller push dispatcher pushes the new rows (0124/0131
 * webhook on INSERT), like every other account bell type.
 */

type Queryable = typeof db;

const rowsOf = (result: unknown) => [...(result as Iterable<Record<string, unknown>>)];
const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value));
const isoOrNull = (value: unknown) => (value == null ? null : iso(value));

/**
 * Sellers who may be due, oldest first store first, at most `limit`. The SQL
 * already applies every rule (so the limit isn't spent on sellers who aren't
 * due); `isTopUpReminderDue` checks each row again. Account rules match the
 * setup reminders (F-94): auth user not deleted or banned, seller not suspended
 * or restricted, user not suspended, not a guest, not staff, not marked fake.
 */
export async function loadTopUpReminderCandidates(
  options: { sellerId?: string; limit?: number } = {},
  q: Queryable = db,
): Promise<TopUpReminderCandidate[]> {
  const manual = sql.join(
    MANUAL_TOP_UP_METHODS.map((method) => sql`${method}`),
    sql`, `,
  );
  const rows = rowsOf(
    await q.execute(sql`
      SELECT s.id AS seller_id, fs.id AS store_id, fs.created_at AS store_created_at,
             s.plan, s.plan_expires_at, s.plan_grace_until,
             (EXISTS (SELECT 1 FROM seller_wallet_top_ups t WHERE t.seller_id = s.id AND t.status = 'succeeded')
               OR EXISTS (SELECT 1 FROM wallet_transactions w WHERE w.seller_id = s.id AND w.type = 'top_up')) AS has_top_up,
             (EXISTS (SELECT 1 FROM seller_wallet sw WHERE sw.seller_id = s.id AND sw.balance > 0)
               OR EXISTS (SELECT 1 FROM wallet_transactions w WHERE w.seller_id = s.id AND w.currency = 'USD' AND w.balance_after > 0)) AS has_positive,
             EXISTS (SELECT 1 FROM seller_wallet_top_ups t
                      WHERE t.seller_id = s.id AND t.status = 'pending' AND t.provider IN (${manual})) AS pending_manual,
             EXISTS (SELECT 1 FROM seller_notifications n
                      WHERE n.seller_id = s.id AND n.dedupe_key = 'top_up_reminder_24h:' || s.id::text) AS reminded
        FROM sellers s
        JOIN users u ON u.id = s.id
        JOIN auth.users au ON au.id = s.id
        CROSS JOIN LATERAL (
          SELECT st.id, st.created_at FROM stores st
           WHERE st.seller_id = s.id AND st.deleted_at IS NULL
           ORDER BY st.created_at, st.id LIMIT 1
        ) fs
       WHERE fs.created_at <= now() - make_interval(hours => ${TOP_UP_REMINDER_AFTER_HOURS})
         AND fs.created_at >= now() - make_interval(days => ${TOP_UP_REMINDER_WINDOW_DAYS})
         AND au.deleted_at IS NULL
         AND (au.banned_until IS NULL OR au.banned_until < now())
         AND coalesce(s.status::text, 'pending') NOT IN ('suspended', 'restricted')
         AND NOT coalesce(u.is_suspended, false)
         AND NOT u.is_guest
         AND coalesce(u.role::text, 'seller') NOT IN ('admin', 'support', 'marketing', 'driver')
         AND s.referral_excluded_at IS NULL
         ${options.sellerId ? sql`AND s.id = ${options.sellerId}::uuid` : sql``}
         -- Not activated (the same checks as getOrderLock and 0159).
         AND NOT (
           s.plan = 'pro'
           AND ((s.plan_expires_at IS NULL AND s.plan_grace_until IS NULL)
                OR greatest(coalesce(s.plan_expires_at, '-infinity'::timestamptz), coalesce(s.plan_grace_until, '-infinity'::timestamptz)) > now())
         )
         AND NOT EXISTS (SELECT 1 FROM seller_wallet_top_ups t WHERE t.seller_id = s.id AND t.status = 'succeeded')
         AND NOT EXISTS (SELECT 1 FROM wallet_transactions w WHERE w.seller_id = s.id AND w.type = 'top_up')
         AND NOT EXISTS (SELECT 1 FROM seller_wallet sw WHERE sw.seller_id = s.id AND sw.balance > 0)
         AND NOT EXISTS (SELECT 1 FROM wallet_transactions w WHERE w.seller_id = s.id AND w.currency = 'USD' AND w.balance_after > 0)
         AND NOT EXISTS (SELECT 1 FROM seller_wallet_top_ups t
                          WHERE t.seller_id = s.id AND t.status = 'pending' AND t.provider IN (${manual}))
         AND NOT EXISTS (SELECT 1 FROM seller_notifications n
                          WHERE n.seller_id = s.id AND n.dedupe_key = 'top_up_reminder_24h:' || s.id::text)
       ORDER BY fs.created_at, s.id
       LIMIT ${options.limit ?? TOP_UP_REMINDER_BATCH}
    `),
  );
  return rows.map((row) => ({
    sellerId: String(row.seller_id),
    firstStoreId: String(row.store_id),
    firstStoreCreatedAt: iso(row.store_created_at),
    plan: row.plan == null ? null : String(row.plan),
    planExpiresAt: isoOrNull(row.plan_expires_at),
    planGraceUntil: isoOrNull(row.plan_grace_until),
    hasTopUp: Boolean(row.has_top_up),
    hasHadPositiveBalance: Boolean(row.has_positive),
    hasPendingManualTopUp: Boolean(row.pending_manual),
    alreadyReminded: Boolean(row.reminded),
  }));
}

/** Inserts one reminder row per seller; a row that already exists is left alone. Returns how many were added. */
export async function insertTopUpReminders(
  candidates: Pick<TopUpReminderCandidate, "sellerId" | "firstStoreId">[],
  q: Queryable = db,
): Promise<number> {
  if (candidates.length === 0) return 0;
  const values = sql.join(
    candidates.map(
      (c) => sql`(${c.sellerId}::uuid, ${c.firstStoreId}::uuid, ${TOP_UP_REMINDER_TYPE}, '{}'::jsonb, ${topUpReminderDedupeKey(c.sellerId)})`,
    ),
    sql`, `,
  );
  const inserted = rowsOf(
    await q.execute(sql`
      INSERT INTO seller_notifications (seller_id, store_id, type, data, dedupe_key)
      VALUES ${values}
      ON CONFLICT (seller_id, dedupe_key) DO NOTHING
      RETURNING id
    `),
  );
  return inserted.length;
}

/** True for Postgres' check_violation (23514), however the driver wraps it. */
function isCheckViolation(error: unknown): boolean {
  for (let e: unknown = error, depth = 0; e && depth < 4; e = (e as { cause?: unknown }).cause, depth++) {
    if ((e as { code?: unknown }).code === "23514") return true;
  }
  return false;
}

export type TopUpReminderRun =
  | { status: "off" }
  | { status: "done"; candidates: number; inserted: number }
  /** The type CHECK doesn't allow `top_up_reminder` yet: migration 0172 isn't applied. */
  | { status: "migration_missing"; candidates: number };

/** One cron run: load the due sellers and add their rows. Counts only, no seller data. */
export async function runTopUpReminders(
  deps: { now?: () => Date; usdLive?: () => Promise<boolean> } = {},
  q: Queryable = db,
): Promise<TopUpReminderRun> {
  const usdLive = deps.usdLive ? await deps.usdLive() : (await getBillingState()).usdLive;
  if (!usdLive) return { status: "off" };
  const now = (deps.now ?? (() => new Date()))();
  const due = (await loadTopUpReminderCandidates({}, q)).filter((c) => isTopUpReminderDue(c, usdLive, now));
  try {
    return { status: "done", candidates: due.length, inserted: await insertTopUpReminders(due, q) };
  } catch (error) {
    if (isCheckViolation(error)) return { status: "migration_missing", candidates: due.length };
    throw error;
  }
}
