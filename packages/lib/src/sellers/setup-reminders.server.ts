import { randomBytes } from "node:crypto";
import { db, products, sql } from "@workspace/db";
import { isSwitchOn } from "../stores/platform-switches.server";
import { productInStoreOf } from "../stores/store-scope.server";
import { storeSetupFlagColumns, toStoreSetupFlags } from "./store-setup.server";
import {
  SETUP_REMINDER_DAY1_HOURS,
  SETUP_REMINDER_MAX_ATTEMPTS,
  SETUP_REMINDER_WINDOW_DAYS,
  type SetupReminderClaim,
  type SetupReminderKind,
  type SetupReminderRow,
  type SetupReminderSeller,
  toIso,
} from "./setup-reminders.lib";

/**
 * Database side of the store setup reminders (ROADMAP.md F-94, 0170).
 * Server-only. Seller ids come from the cron's own query or the backend's
 * re-read, never from a client; the opt-out takes only a random token.
 */

type Queryable = typeof db;

const rowsOf = (result: unknown) => [...(result as Iterable<Record<string, unknown>>)];

export type SetupReminderRecipient = SetupReminderSeller & {
  /** The confirmed login email. */
  email: string;
  name: string;
};

/**
 * Sellers the reminders may go to, with their stores' setup flags and their
 * reminder rows. The account rules live here: a seller account made between
 * SETUP_REMINDER_WINDOW_DAYS days and SETUP_REMINDER_DAY1_HOURS hours ago, a
 * confirmed, not deleted, not banned auth user with an email, seller status not
 * suspended or restricted, the user not suspended, not a guest and not staff
 * (admin, support, marketing, driver), not marked fake by an admin. The
 * reminder rules (setup done, real orders, opt-out, timing) are
 * `dueSetupReminder`'s.
 */
export async function loadSetupReminderSellers(
  options: { sellerId?: string } = {},
  q: Queryable = db,
): Promise<SetupReminderRecipient[]> {
  const sellerRows = rowsOf(
    await q.execute(sql`
      SELECT s.id, s.created_at,
             coalesce(nullif(trim(u.full_name), ''), s.display_name) AS name,
             trim(au.email) AS email,
             EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
                      WHERE oi.seller_id = s.id AND NOT o.is_test) AS has_real_orders
        FROM sellers s
        JOIN users u ON u.id = s.id
        JOIN auth.users au ON au.id = s.id
       WHERE s.created_at > now() - make_interval(days => ${SETUP_REMINDER_WINDOW_DAYS})
         AND s.created_at <= now() - make_interval(hours => ${SETUP_REMINDER_DAY1_HOURS})
         AND au.email_confirmed_at IS NOT NULL
         AND au.deleted_at IS NULL
         AND (au.banned_until IS NULL OR au.banned_until < now())
         AND nullif(trim(au.email), '') IS NOT NULL
         AND coalesce(s.status::text, 'pending') NOT IN ('suspended', 'restricted')
         AND NOT coalesce(u.is_suspended, false)
         AND NOT u.is_guest
         AND coalesce(u.role::text, 'seller') NOT IN ('admin', 'support', 'marketing', 'driver')
         AND s.referral_excluded_at IS NULL
         ${options.sellerId ? sql`AND s.id = ${options.sellerId}::uuid` : sql``}
       ORDER BY s.created_at
    `),
  );
  if (sellerRows.length === 0) return [];
  const ids = sellerRows.map((row) => String(row.id));

  const catalogSplit = await isSwitchOn("stores_catalog_split", q);
  const productScope = sql` AND EXISTS (SELECT 1 FROM ${products} WHERE ${products.id} = p.id AND ${productInStoreOf(sql`st.id`, { catalogSplit, scope: "managed" })})`;
  const idList = sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `,
  );
  const [storeRows, reminderRows] = await Promise.all([
    q.execute(sql`
      SELECT st.seller_id, st.id, st.name, st.is_primary, st.created_at,
             ${storeSetupFlagColumns(productScope)}
        FROM stores st
        JOIN sellers s ON s.id = st.seller_id
       WHERE st.seller_id IN (${idList}) AND st.deleted_at IS NULL
    `),
    q.execute(sql`
      SELECT seller_id, kind, status, attempts, claimed_at, sent_at
        FROM seller_setup_reminders
       WHERE seller_id IN (${idList})
    `),
  ]);

  const storesBySeller = new Map<string, SetupReminderSeller["stores"]>();
  for (const row of rowsOf(storeRows)) {
    const list = storesBySeller.get(String(row.seller_id)) ?? [];
    list.push({
      id: String(row.id),
      name: String(row.name ?? ""),
      isPrimary: Boolean(row.is_primary),
      createdAt: toIso(row.created_at),
      flags: toStoreSetupFlags(row),
    });
    storesBySeller.set(String(row.seller_id), list);
  }
  const remindersBySeller = new Map<string, SetupReminderRow[]>();
  for (const row of rowsOf(reminderRows)) {
    const list = remindersBySeller.get(String(row.seller_id)) ?? [];
    list.push({
      kind: String(row.kind) as SetupReminderRow["kind"],
      status: String(row.status) as SetupReminderRow["status"],
      attempts: Number(row.attempts ?? 0),
      claimedAt: toIso(row.claimed_at),
      sentAt: row.sent_at ? toIso(row.sent_at) : null,
    });
    remindersBySeller.set(String(row.seller_id), list);
  }

  return sellerRows.map((row) => {
    const sellerId = String(row.id);
    return {
      sellerId,
      createdAt: toIso(row.created_at),
      hasRealOrders: Boolean(row.has_real_orders),
      email: String(row.email ?? ""),
      name: String(row.name ?? ""),
      stores: storesBySeller.get(sellerId) ?? [],
      reminders: remindersBySeller.get(sellerId) ?? [],
    };
  });
}

/** Reminders claimed today (Cairo calendar day) that went out or are going out: the daily cap's count. */
export async function countSetupRemindersSentToday(q: Queryable = db): Promise<number> {
  const [row] = rowsOf(
    await q.execute(sql`
      SELECT count(*)::int AS n FROM seller_setup_reminders
       WHERE kind <> 'opt_out' AND status IN ('sending', 'sent')
         AND claimed_at >= (date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo')
    `),
  );
  return Number(row?.n ?? 0);
}

/**
 * Claims (seller, kind) before sending: a new row, or a failed row under the
 * attempt limit taken back to `sending`. Null when the row is sent, being sent,
 * or out of attempts, so two runs never both send. The opt-out token is made
 * once and kept across retries.
 */
export async function claimSetupReminder(
  sellerId: string,
  kind: SetupReminderKind,
  q: Queryable = db,
): Promise<SetupReminderClaim | null> {
  const token = randomBytes(24).toString("hex");
  const [row] = rowsOf(
    await q.execute(sql`
      INSERT INTO seller_setup_reminders (seller_id, kind, status, attempts, token)
      VALUES (${sellerId}::uuid, ${kind}, 'sending', 1, ${token})
      ON CONFLICT (seller_id, kind) DO UPDATE
         SET status = 'sending',
             attempts = seller_setup_reminders.attempts + 1,
             error = NULL,
             token = coalesce(seller_setup_reminders.token, EXCLUDED.token),
             claimed_at = now(),
             updated_at = now()
       WHERE seller_setup_reminders.status = 'failed'
         AND seller_setup_reminders.attempts < ${SETUP_REMINDER_MAX_ATTEMPTS}
      RETURNING token, attempts
    `),
  );
  return row ? { token: String(row.token), attempts: Number(row.attempts) } : null;
}

export async function markSetupReminderSent(
  sellerId: string,
  kind: SetupReminderKind,
  resendId: string | null,
  q: Queryable = db,
): Promise<void> {
  await q.execute(sql`
    UPDATE seller_setup_reminders
       SET status = 'sent', resend_id = ${resendId}, sent_at = now(), error = NULL, updated_at = now()
     WHERE seller_id = ${sellerId}::uuid AND kind = ${kind} AND status = 'sending'
  `);
}

export async function markSetupReminderFailed(
  sellerId: string,
  kind: SetupReminderKind,
  error: string,
  q: Queryable = db,
): Promise<void> {
  await q.execute(sql`
    UPDATE seller_setup_reminders
       SET status = 'failed', error = ${error.slice(0, 500)}, updated_at = now()
     WHERE seller_id = ${sellerId}::uuid AND kind = ${kind} AND status = 'sending'
  `);
}

const TOKEN_RE = /^[0-9a-f]{32,128}$/;
export const isSetupReminderToken = (value: unknown): value is string => typeof value === "string" && TOKEN_RE.test(value);

/**
 * The email's "stop these reminders" link: the token of one of the seller's
 * reminders adds their `opt_out` row (once). False for an unknown token.
 */
export async function optOutOfSetupReminders(token: unknown, q: Queryable = db): Promise<boolean> {
  if (!isSetupReminderToken(token)) return false;
  const [owner] = rowsOf(
    await q.execute(sql`
      SELECT seller_id FROM seller_setup_reminders WHERE token = ${token} AND kind <> 'opt_out' LIMIT 1
    `),
  );
  if (!owner) return false;
  await q.execute(sql`
    INSERT INTO seller_setup_reminders (seller_id, kind, status, attempts, token, sent_at)
    VALUES (${String(owner.seller_id)}::uuid, 'opt_out', 'opted_out', 0, NULL, now())
    ON CONFLICT (seller_id, kind) DO NOTHING
  `);
  return true;
}

export type SetupReminderHistoryRow = {
  kind: SetupReminderRow["kind"];
  status: SetupReminderRow["status"];
  attempts: number;
  claimedAt: string;
  sentAt: string | null;
  error: string | null;
};

/** One seller's reminder rows, for Admin's seller page. */
export async function listSetupRemindersForSeller(sellerId: string, q: Queryable = db): Promise<SetupReminderHistoryRow[]> {
  return rowsOf(
    await q.execute(sql`
      SELECT kind, status, attempts, claimed_at, sent_at, error
        FROM seller_setup_reminders WHERE seller_id = ${sellerId}::uuid
       ORDER BY claimed_at
    `),
  ).map((row) => ({
    kind: String(row.kind) as SetupReminderRow["kind"],
    status: String(row.status) as SetupReminderRow["status"],
    attempts: Number(row.attempts ?? 0),
    claimedAt: toIso(row.claimed_at),
    sentAt: row.sent_at ? toIso(row.sent_at) : null,
    error: row.error == null ? null : String(row.error),
  }));
}
