import { db, sql } from "@workspace/db";
import { ORDER_GRACE_DAYS, ORDER_GRACE_DAYS_SHORT, ORDER_GRACE_START_FLOOR, SHORT_GRACE_FROM } from "../billing/order-lock.lib";
import { parseIntegrationKey } from "../integrations/crypto.server";
import { MANUAL_TOP_UP_METHODS } from "../store-wallet/top-up.lib";
import { parseStoreCurrency } from "../utils/formatPrice";
import {
  FIRST_WEEK_EMAIL_TYPE,
  INSIGHTS_TIME_ZONE,
  STORE_OFFLINE_EMAIL_TYPE,
  STORE_OFFLINE_EMAIL_WINDOW_DAYS,
  WEEKLY_INSIGHTS_EMAIL_TYPE,
  WEEKLY_INSIGHTS_MAX_STORES,
  WEEKLY_INSIGHTS_TOP_PRODUCTS,
  deriveSellerEmailOptOutKey,
  verifySellerEmailOptOutToken,
  type InsightsWeek,
} from "./seller-insights.lib";

/**
 * Database side of the F-113 seller emails (seller-insights.lib.ts). Server-
 * only, never cached, moves no money. Seller ids come only from this file's
 * own queries; every store read is filtered by `stores.seller_id` of that
 * seller (CLAUDE.md rule 5).
 */

type Queryable = typeof db;

const rowsOf = (result: unknown) => [...(result as Iterable<Record<string, unknown>>)];
const toInt = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isSafeInteger(n) ? n : 0;
};
const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value));
const ymd = (value: unknown) => (value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10));

/** Line items that never turned into revenue (same as the dashboard home and Reports). */
const NON_REVENUE = sql`('cancelled', 'refunded', 'returned')`;

/** Same account rules as the setup reminders (F-94) and F-104: real, reachable sellers only. */
const accountFilters = sql`
  au.email_confirmed_at IS NOT NULL
  AND au.deleted_at IS NULL
  AND (au.banned_until IS NULL OR au.banned_until < now())
  AND nullif(trim(au.email), '') IS NOT NULL
  AND coalesce(s.status::text, 'pending') NOT IN ('suspended', 'restricted')
  AND NOT coalesce(u.is_suspended, false)
  AND NOT u.is_guest
  AND coalesce(u.role::text, 'seller') NOT IN ('admin', 'support', 'marketing', 'driver')
  AND s.referral_excluded_at IS NULL
  AND EXISTS (SELECT 1 FROM stores st WHERE st.seller_id = s.id AND st.deleted_at IS NULL)`;

/** Activated (order-lock.lib.ts `isActivated`): active Pro, an approved top-up, or a balance ever above zero. */
const activated = sql`(
  (s.plan = 'pro'
    AND ((s.plan_expires_at IS NULL AND s.plan_grace_until IS NULL)
         OR greatest(coalesce(s.plan_expires_at, '-infinity'::timestamptz), coalesce(s.plan_grace_until, '-infinity'::timestamptz)) > now()))
  OR EXISTS (SELECT 1 FROM seller_wallet_top_ups t WHERE t.seller_id = s.id AND t.status = 'succeeded')
  OR EXISTS (SELECT 1 FROM wallet_transactions w WHERE w.seller_id = s.id AND w.type = 'top_up')
  OR EXISTS (SELECT 1 FROM seller_wallet sw WHERE sw.seller_id = s.id AND sw.balance > 0)
  OR EXISTS (SELECT 1 FROM wallet_transactions w WHERE w.seller_id = s.id AND w.currency = 'USD' AND w.balance_after > 0)
)`;

const cairoInstant = (day: string) => sql`((${day}::date)::timestamp AT TIME ZONE ${INSIGHTS_TIME_ZONE}::text)`;

/** Deliveries of this type claimed since midnight Cairo (the daily cap). */
export async function emailsSentToday(emailType: string, q: Queryable = db): Promise<number> {
  const [row] = rowsOf(
    await q.execute(sql`
      SELECT count(*)::int AS n FROM email_deliveries
       WHERE email_type = ${emailType}::text
         AND created_at >= (date_trunc('day', now() AT TIME ZONE ${INSIGHTS_TIME_ZONE}::text) AT TIME ZONE ${INSIGHTS_TIME_ZONE}::text)
    `),
  );
  return toInt(row?.n);
}

export type StoreOfflineCandidate = {
  sellerId: string;
  email: string;
  /** The primary (else oldest) live store. */
  storeName: string;
  storeCount: number;
};

/**
 * Sellers who may be due the store-offline email, at most `limit`, the
 * longest-offline first. The SQL narrows to sellers who aren't activated, have
 * no manual top-up in review, and whose trial days (order-lock.lib.ts: sign-up,
 * never before ORDER_GRACE_START_FLOOR, plus 7 or 14 days) ended within the
 * window; the caller confirms each one with readOrderLockStrict.
 */
export async function loadStoreOfflineCandidates(limit: number, q: Queryable = db): Promise<StoreOfflineCandidate[]> {
  if (limit <= 0) return [];
  const manual = sql.join(
    MANUAL_TOP_UP_METHODS.map((method) => sql`${method}`),
    sql`, `,
  );
  const rows = rowsOf(
    await q.execute(sql`
      WITH base AS (
        SELECT s.id, trim(au.email) AS email,
               greatest(s.created_at, ${ORDER_GRACE_START_FLOOR}::timestamptz)
                 + make_interval(days => CASE WHEN s.created_at >= ${SHORT_GRACE_FROM}::timestamptz
                                              THEN ${ORDER_GRACE_DAYS_SHORT}::int ELSE ${ORDER_GRACE_DAYS}::int END) AS offline_at
          FROM sellers s
          JOIN users u ON u.id = s.id
          JOIN auth.users au ON au.id = s.id
         WHERE ${accountFilters}
           AND NOT ${activated}
           AND NOT EXISTS (SELECT 1 FROM seller_wallet_top_ups t
                            WHERE t.seller_id = s.id AND t.status = 'pending' AND t.provider IN (${manual}))
           AND NOT EXISTS (SELECT 1 FROM email_deliveries ed
                            WHERE ed.email_type = ${STORE_OFFLINE_EMAIL_TYPE}::text AND ed.reference_id = s.id)
      )
      SELECT b.id AS seller_id, b.email, fs.name AS store_name,
             (SELECT count(*)::int FROM stores c WHERE c.seller_id = b.id AND c.deleted_at IS NULL) AS store_count
        FROM base b
        CROSS JOIN LATERAL (
          SELECT st.name FROM stores st
           WHERE st.seller_id = b.id AND st.deleted_at IS NULL
           ORDER BY st.is_primary DESC, st.created_at, st.id
           LIMIT 1
        ) fs
       WHERE b.offline_at <= now()
         AND b.offline_at >= now() - make_interval(days => ${STORE_OFFLINE_EMAIL_WINDOW_DAYS}::int)
       ORDER BY b.offline_at, b.id
       LIMIT ${limit}::int
    `),
  );
  return rows.map((row) => ({
    sellerId: String(row.seller_id),
    email: String(row.email),
    storeName: String(row.store_name ?? ""),
    storeCount: toInt(row.store_count),
  }));
}

/** Whether migration 0183 is applied. The weekly email needs it (opt-outs); the offline email doesn't. */
export async function isSellerEmailOptOutsReady(q: Queryable = db): Promise<boolean> {
  const [row] = rowsOf(await q.execute(sql`SELECT to_regclass('public.seller_email_opt_outs') IS NOT NULL AS ready`));
  return row?.ready === true;
}

export type WeeklyInsightsCandidate = {
  sellerId: string;
  email: string;
  signedUpAt: string;
  /** The latest finished week's first Cairo day, as the SQL computed it. */
  weekStart: string;
};

/**
 * Activated sellers whose latest finished week (seller-insights.lib.ts
 * `latestFinishedWeek`) wasn't sent yet, at most `limit`, the week that ended
 * first going first. Skips opted-out sellers, and week 1 of a seller who
 * already got F-104's first-week email. Needs 0183 (check
 * isSellerEmailOptOutsReady first).
 */
export async function loadWeeklyInsightsCandidates(limit: number, q: Queryable = db): Promise<WeeklyInsightsCandidate[]> {
  if (limit <= 0) return [];
  const rows = rowsOf(
    await q.execute(sql`
      WITH base AS (
        SELECT s.id, trim(au.email) AS email, s.created_at,
               ((now() AT TIME ZONE ${INSIGHTS_TIME_ZONE}::text)::date - (s.created_at AT TIME ZONE ${INSIGHTS_TIME_ZONE}::text)::date) / 7 AS week_index,
               (s.created_at AT TIME ZONE ${INSIGHTS_TIME_ZONE}::text)::date AS first_day
          FROM sellers s
          JOIN users u ON u.id = s.id
          JOIN auth.users au ON au.id = s.id
         WHERE ${accountFilters}
           AND ${activated}
           AND NOT EXISTS (SELECT 1 FROM seller_email_opt_outs o WHERE o.seller_id = s.id AND o.kind = 'weekly_insights')
      ), due AS (
        SELECT b.*, b.first_day + 7 * (b.week_index - 1) AS week_start FROM base b WHERE b.week_index >= 1
      )
      SELECT d.id AS seller_id, d.email, to_json(d.created_at) #>> '{}' AS created_at, to_char(d.week_start, 'YYYY-MM-DD') AS week_start
        FROM due d
       WHERE NOT EXISTS (
               SELECT 1 FROM email_deliveries ed
                WHERE ed.email_type = ${WEEKLY_INSIGHTS_EMAIL_TYPE}::text
                  AND ed.reference_id = md5(${WEEKLY_INSIGHTS_EMAIL_TYPE}::text || ':' || d.id::text || ':' || to_char(d.week_start, 'YYYY-MM-DD'))::uuid)
         AND NOT (d.week_index = 1 AND EXISTS (
               SELECT 1 FROM email_deliveries ed
                WHERE ed.email_type = ${FIRST_WEEK_EMAIL_TYPE}::text AND ed.reference_id = d.id))
       ORDER BY d.week_start, d.id
       LIMIT ${limit}::int
    `),
  );
  return rows.map((row) => ({
    sellerId: String(row.seller_id),
    email: String(row.email),
    signedUpAt: iso(row.created_at),
    weekStart: ymd(row.week_start),
  }));
}

export type InsightsStore = { id: string; name: string; currency: string };

/** The seller's live stores, primary first, at most WEEKLY_INSIGHTS_MAX_STORES. */
export async function loadInsightsStores(sellerId: string, q: Queryable = db): Promise<InsightsStore[]> {
  const rows = rowsOf(
    await q.execute(sql`
      SELECT id, name, settings FROM stores
       WHERE seller_id = ${sellerId}::uuid AND deleted_at IS NULL
       ORDER BY is_primary DESC, created_at, id
       LIMIT ${WEEKLY_INSIGHTS_MAX_STORES}::int
    `),
  );
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    currency: parseStoreCurrency(row.settings).currency,
  }));
}

export type StoreWeekStats = {
  orders: { current: number; previous: number | null };
  /** Integer piastres (hundredths) in the store's currency. */
  sales: { current: number; previous: number | null };
  topProducts: { name: string; units: number }[];
};

/**
 * Real orders, sales and best sellers of each store in the week (and orders and
 * sales of the week before). Two grouped queries for all the seller's stores.
 * Real orders: not a test order, not an online payment still unpaid. Sales: the
 * seller's line totals that weren't cancelled, refunded or returned, in the
 * store's currency (the Reports page's definition).
 */
export async function loadWeeklyStoreStats(
  sellerId: string,
  stores: InsightsStore[],
  week: InsightsWeek,
  q: Queryable = db,
): Promise<Map<string, StoreWeekStats>> {
  const out = new Map<string, StoreWeekStats>();
  if (stores.length === 0) return out;
  const hasPrevious = week.previousStart !== null;
  for (const store of stores) {
    out.set(store.id, {
      orders: { current: 0, previous: hasPrevious ? 0 : null },
      sales: { current: 0, previous: hasPrevious ? 0 : null },
      topProducts: [],
    });
  }

  const currencies = sql.join(
    stores.map((store) => sql`(${store.id}::uuid, ${store.currency}::text)`),
    sql`, `,
  );
  const ids = sql.join(
    stores.map((store) => sql`${store.id}::uuid`),
    sql`, `,
  );
  const weekStart = cairoInstant(week.start);
  const weekEnd = cairoInstant(week.end);
  const from = cairoInstant(week.previousStart ?? week.start);

  const [totals, products] = await Promise.all([
    q.execute(sql`
      SELECT o.store_id::text AS store_id,
             (o.created_at >= ${weekStart}) AS is_current,
             count(*)::int AS orders,
             coalesce(sum(li.piastres) FILTER (WHERE coalesce(o.currency, 'EGP') = c.currency), 0)::text AS piastres
        FROM orders o
        JOIN stores st ON st.id = o.store_id AND st.seller_id = ${sellerId}::uuid
        JOIN (VALUES ${currencies}) AS c(store_id, currency) ON c.store_id = o.store_id
        LEFT JOIN LATERAL (
          SELECT sum((oi.total * 100)::bigint) AS piastres
            FROM order_items oi
           WHERE oi.order_id = o.id
             AND oi.seller_id = ${sellerId}::uuid
             AND oi.status NOT IN ${NON_REVENUE}
             AND coalesce(oi.is_refunded, false) = false
        ) li ON true
       WHERE NOT o.is_test
         AND o.status IS DISTINCT FROM 'payment_processing'
         AND o.created_at >= ${from}
         AND o.created_at < ${weekEnd}
       GROUP BY 1, 2
    `),
    q.execute(sql`
      SELECT t.store_id, t.name, t.units FROM (
        SELECT o.store_id::text AS store_id,
               (array_agg(oi.product_name ORDER BY oi.created_at DESC))[1] AS name,
               sum(oi.quantity)::int AS units,
               row_number() OVER (PARTITION BY o.store_id ORDER BY sum(oi.quantity) DESC, oi.product_id) AS rn
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          JOIN stores st ON st.id = o.store_id AND st.seller_id = ${sellerId}::uuid
         WHERE oi.seller_id = ${sellerId}::uuid
           AND o.store_id IN (${ids})
           AND NOT o.is_test
           AND o.status IS DISTINCT FROM 'payment_processing'
           AND oi.status NOT IN ${NON_REVENUE}
           AND coalesce(oi.is_refunded, false) = false
           AND o.created_at >= ${weekStart}
           AND o.created_at < ${weekEnd}
         GROUP BY o.store_id, oi.product_id
      ) t
       WHERE t.rn <= ${WEEKLY_INSIGHTS_TOP_PRODUCTS}::int
       ORDER BY t.store_id, t.rn
    `),
  ]);

  for (const row of rowsOf(totals)) {
    const entry = out.get(String(row.store_id));
    if (!entry) continue;
    const current = row.is_current === true;
    if (!current && !hasPrevious) continue;
    entry.orders[current ? "current" : "previous"] = toInt(row.orders);
    entry.sales[current ? "current" : "previous"] = toInt(row.piastres);
  }
  for (const row of rowsOf(products)) {
    const entry = out.get(String(row.store_id));
    if (entry) entry.topProducts.push({ name: String(row.name ?? ""), units: toInt(row.units) });
  }
  return out;
}

/* ---------- Opt-out ---------- */

/** The opt-out link key, or null when INTEGRATIONS_ENCRYPTION_KEY is missing or invalid (then no weekly email). */
export function sellerEmailOptOutKey(raw: string | undefined = process.env.INTEGRATIONS_ENCRYPTION_KEY): Buffer | null {
  try {
    return deriveSellerEmailOptOutKey(parseIntegrationKey(raw));
  } catch {
    return null;
  }
}

/** True for Postgres' undefined_table (42P01), however the driver wraps it. */
function isUndefinedTable(error: unknown): boolean {
  for (let e: unknown = error, depth = 0; e && depth < 4; e = (e as { cause?: unknown }).cause, depth++) {
    if ((e as { code?: unknown }).code === "42P01") return true;
  }
  return false;
}

/**
 * The weekly email's "stop these emails" link: a valid signed token adds the
 * seller's `weekly_insights` opt-out (once). `invalid` for a bad token,
 * `unavailable` when 0183 or the key is missing.
 */
export async function optOutOfWeeklyInsights(token: unknown, q: Queryable = db): Promise<"done" | "invalid" | "unavailable"> {
  const key = sellerEmailOptOutKey();
  if (!key) return "unavailable";
  const sellerId = verifySellerEmailOptOutToken(token, "weekly_insights", key);
  if (!sellerId) return "invalid";
  try {
    await q.execute(sql`
      INSERT INTO seller_email_opt_outs (seller_id, kind)
      SELECT s.id, 'weekly_insights' FROM sellers s WHERE s.id = ${sellerId}::uuid
      ON CONFLICT (seller_id, kind) DO NOTHING
    `);
    return "done";
  } catch (error) {
    if (isUndefinedTable(error)) return "unavailable";
    throw error;
  }
}
