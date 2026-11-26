import { createHash, createHmac, hkdfSync, timingSafeEqual } from "node:crypto";
import type { OrderLock } from "../billing/order-lock.lib";

/**
 * Seller lifecycle emails of ROADMAP.md F-113 (owner, 2026-11-26). Pure rules;
 * the queries are in seller-insights.server.ts and the sender in the backend.
 *
 * - `seller_store_offline`: once per seller, ever, when a seller who isn't
 *   activated reaches the end of their trial days and their stores go offline
 *   (order-lock.lib.ts `storeOffline`). Only while that moment is at most
 *   STORE_OFFLINE_EMAIL_WINDOW_DAYS old, so long-dormant accounts get nothing.
 * - `seller_weekly_insights`: activated sellers, once per finished week. Weeks
 *   are 7 Cairo calendar days counted from the sign-up's Cairo date; only the
 *   latest finished week is ever sent (no backfill). Week 1 replaces F-104's
 *   first-week email. One-click opt-out (seller_email_opt_outs, 0183).
 *
 * Resend's free plan allows 100 emails a day for every email together, so
 * each kind has a small daily and per-run cap; the offline email goes first.
 */

export const STORE_OFFLINE_EMAIL_TYPE = "seller_store_offline";
export const WEEKLY_INSIGHTS_EMAIL_TYPE = "seller_weekly_insights";
/** The F-104 email that week 1 of the weekly email replaces. */
export const FIRST_WEEK_EMAIL_TYPE = "seller_first_week";

/** Only stores that went offline at most this many days ago get the email. */
export const STORE_OFFLINE_EMAIL_WINDOW_DAYS = 7;
export const STORE_OFFLINE_DAILY_CAP = 15;
export const STORE_OFFLINE_RUN_CAP = 5;
export const WEEKLY_INSIGHTS_DAILY_CAP = 20;
export const WEEKLY_INSIGHTS_RUN_CAP = 5;
/** Stores per weekly email: Pro's store limit, so every store of a seller fits. */
export const WEEKLY_INSIGHTS_MAX_STORES = 10;
export const WEEKLY_INSIGHTS_TOP_PRODUCTS = 3;
export const INSIGHTS_TIME_ZONE = "Africa/Cairo";

/** The opt-out kinds 0183 allows. */
export const SELLER_EMAIL_OPT_OUT_KINDS = ["weekly_insights"] as const;
export type SellerEmailOptOutKind = (typeof SELLER_EMAIL_OPT_OUT_KINDS)[number];

const DAY_MS = 86_400_000;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** How many to send now: what is left of the day's cap, at most the run's. */
export function sendBudget(dailyCap: number, runCap: number, sentToday: number): number {
  return Math.max(0, Math.min(runCap, dailyCap - Math.max(0, sentToday)));
}

/** The Cairo calendar date of an instant, `YYYY-MM-DD`. */
export function cairoDate(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: INSIGHTS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** `YYYY-MM-DD` plus `days` (calendar arithmetic, no time zone involved). */
export function addCalendarDays(ymd: string, days: number): string {
  if (!YMD_RE.test(ymd)) throw new Error("invalid date");
  const [y, m, d] = ymd.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
}

function calendarDaysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = to.split("-").map(Number) as [number, number, number];
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / DAY_MS);
}

export type InsightsWeek = {
  /** 1 for the first 7 days after sign-up. */
  index: number;
  /** First Cairo day of the week. */
  start: string;
  /** Last Cairo day of the week (inclusive). */
  lastDay: string;
  /** The day after the week (exclusive end). */
  end: string;
  /** First day of the week before, or null for week 1 (nothing before sign-up). */
  previousStart: string | null;
};

/**
 * The latest week that is over at `now`. Week N covers the Cairo days
 * [start + 7(N−1), start + 7N), start = the sign-up's Cairo date; it is over
 * once its last day has ended in Cairo. Null before week 1 ends.
 */
export function latestFinishedWeek(signedUpAt: string | Date, now: Date = new Date()): InsightsWeek | null {
  const signup = new Date(signedUpAt);
  if (!Number.isFinite(signup.getTime())) return null;
  const first = cairoDate(signup);
  const index = Math.floor(calendarDaysBetween(first, cairoDate(now)) / 7);
  if (index < 1) return null;
  const start = addCalendarDays(first, 7 * (index - 1));
  return {
    index,
    start,
    lastDay: addCalendarDays(start, 6),
    end: addCalendarDays(start, 7),
    previousStart: index > 1 ? addCalendarDays(start, -7) : null,
  };
}

/**
 * The `email_deliveries.reference_id` of one seller's weekly email (the column
 * is a uuid): the MD5 of `seller_weekly_insights:<seller id>:<week start>`
 * written as a uuid. Postgres computes the same value with
 * `md5('seller_weekly_insights:' || seller_id::text || ':' || week_start)::uuid`,
 * so the batch query can skip weeks already sent. An id, not a secret.
 */
export function weeklyInsightsReferenceId(sellerId: string, weekStart: string): string {
  if (!UUID_RE.test(sellerId) || !YMD_RE.test(weekStart)) throw new Error("invalid weekly insights reference");
  const hex = createHash("md5").update(`${WEEKLY_INSIGHTS_EMAIL_TYPE}:${sellerId.toLowerCase()}:${weekStart}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Whether the store-offline email is due now: every store is offline for
 * billing (not activated, trial days over, no top-up in review) and that
 * moment is at most STORE_OFFLINE_EMAIL_WINDOW_DAYS old.
 */
export function isStoreOfflineEmailDue(lock: Pick<OrderLock, "activated" | "storeOffline" | "grace">, now: Date = new Date()): boolean {
  if (lock.activated || !lock.storeOffline || !lock.grace) return false;
  const offlineAt = new Date(lock.grace.offlineAt).getTime();
  if (!Number.isFinite(offlineAt)) return false;
  const age = now.getTime() - offlineAt;
  return age >= 0 && age <= STORE_OFFLINE_EMAIL_WINDOW_DAYS * DAY_MS;
}

/* ---------- One-click opt-out link ---------- */

const MAC_BYTES = 16;
const TOKEN_RE = /^[0-9a-f]{32}\.[A-Za-z0-9_-]{22}$/;

/**
 * The HMAC key of the opt-out links, derived with HKDF from the server-only
 * INTEGRATIONS_ENCRYPTION_KEY (no new secret; the backend signs, the dashboard
 * checks, both hold that key). Rotating the key retires every link.
 */
export function deriveSellerEmailOptOutKey(key: Buffer): Buffer {
  return Buffer.from(hkdfSync("sha256", key, Buffer.alloc(0), "tallaby:seller-email-opt-out:v1", 32));
}

function optOutMac(key: Buffer, sellerId: string, kind: SellerEmailOptOutKind): Buffer {
  return createHmac("sha256", key).update(`tallaby:seller-email-opt-out:v1|${kind}|${sellerId}`).digest().subarray(0, MAC_BYTES);
}

/** `<seller id hex>.<mac>`: names the seller, can't be guessed or edited. */
export function signSellerEmailOptOutToken(sellerId: string, kind: SellerEmailOptOutKind, key: Buffer): string {
  if (!UUID_RE.test(sellerId)) throw new Error("invalid seller id");
  const id = sellerId.toLowerCase();
  return `${id.replace(/-/g, "")}.${optOutMac(key, id, kind).toString("base64url")}`;
}

export const isSellerEmailOptOutToken = (value: unknown): value is string => typeof value === "string" && TOKEN_RE.test(value);

/** The seller id a valid token names, or null. Constant-time compare. */
export function verifySellerEmailOptOutToken(token: unknown, kind: SellerEmailOptOutKind, key: Buffer): string | null {
  if (!isSellerEmailOptOutToken(token)) return null;
  const [hex, mac] = token.split(".") as [string, string];
  const sellerId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  const given = Buffer.from(mac, "base64url");
  const expected = optOutMac(key, sellerId, kind);
  return given.length === expected.length && timingSafeEqual(given, expected) ? sellerId : null;
}

/* ---------- GA4 visits ---------- */

export type StoreSessions = { current: number | null; previous: number | null };

type Ga4Report = {
  dimensionHeaders?: { name?: string }[];
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
};

const count = (raw: unknown): number | null =>
  typeof raw === "string" && /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : null;

/**
 * Sessions per store from one GA4 report (dimension STORE_ID_DIMENSION, date
 * ranges named `current` and, after week 1, `previous`). A store with no row
 * had no visits (0); an unreadable value is null. `previous` is null when the
 * week has no week before it.
 */
export function parseStoreSessionsReport(
  report: unknown,
  input: { storeIds: string[]; storeDimension: string; hasPrevious: boolean },
): Map<string, StoreSessions> {
  const out = new Map<string, StoreSessions>();
  for (const id of input.storeIds) out.set(id, { current: 0, previous: input.hasPrevious ? 0 : null });
  const r = (report ?? {}) as Ga4Report;
  const headers = (r.dimensionHeaders ?? []).map((h) => h.name);
  const storeAt = headers.indexOf(input.storeDimension);
  const rangeAt = headers.indexOf("dateRange");
  for (const row of r.rows ?? []) {
    const values = row.dimensionValues ?? [];
    const storeId = values[storeAt >= 0 ? storeAt : 0]?.value;
    const entry = storeId ? out.get(storeId) : undefined;
    if (!entry) continue;
    const range = input.hasPrevious ? values[rangeAt >= 0 ? rangeAt : 1]?.value : "current";
    const sessions = count(row.metricValues?.[0]?.value);
    if (range === "current") entry.current = sessions;
    else if (range === "previous" && input.hasPrevious) entry.previous = sessions;
  }
  return out;
}
