import { isActivated } from "./order-lock.lib";

/**
 * The 24-hour top-up reminder (owner, 2026-11-15; migration 0172). One seller
 * bell row, type `top_up_reminder`, for a seller who isn't activated (no top-up,
 * no balance ever above zero, no active Pro; order-lock.lib.ts) once their first
 * store is TOP_UP_REMINDER_AFTER_HOURS old. Sent once per seller, ever
 * (`dedupe_key` + ON CONFLICT). Pure rules; the queries are in
 * top-up-reminder.server.ts.
 */

/** Hours after the seller's first store was created. */
export const TOP_UP_REMINDER_AFTER_HOURS = 24;
/**
 * Only first stores at most this many days old, so the first run doesn't
 * remind long-dormant sellers. 14 = the longest grace window (ORDER_GRACE_DAYS).
 */
export const TOP_UP_REMINDER_WINDOW_DAYS = 14;
/** The most rows one run inserts; the rest go next run. */
export const TOP_UP_REMINDER_BATCH = 200;
export const TOP_UP_REMINDER_TYPE = "top_up_reminder";

export const topUpReminderDedupeKey = (sellerId: string) => `top_up_reminder_24h:${sellerId}`;

export type TopUpReminderCandidate = {
  sellerId: string;
  /** The seller's oldest live store: its id goes on the row, its age decides the timing. */
  firstStoreId: string;
  firstStoreCreatedAt: string;
  plan: string | null;
  planExpiresAt: string | null;
  planGraceUntil: string | null;
  /** A succeeded top-up row or a `top_up` ledger entry. */
  hasTopUp: boolean;
  /** Balance above zero now, or a USD ledger entry once left it above zero. */
  hasHadPositiveBalance: boolean;
  /** A manual (InstaPay, Vodafone Cash) top-up is waiting for review: they already topped up. */
  hasPendingManualTopUp: boolean;
  /** This reminder's row already exists. */
  alreadyReminded: boolean;
};

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Whether this seller gets the reminder now. Before the USD switch nobody does. */
export function isTopUpReminderDue(candidate: TopUpReminderCandidate, usdLive: boolean, now: Date = new Date()): boolean {
  if (!usdLive || candidate.alreadyReminded || candidate.hasPendingManualTopUp) return false;
  const created = new Date(candidate.firstStoreCreatedAt).getTime();
  if (!Number.isFinite(created)) return false;
  const age = now.getTime() - created;
  if (age < TOP_UP_REMINDER_AFTER_HOURS * HOUR_MS || age > TOP_UP_REMINDER_WINDOW_DAYS * DAY_MS) return false;
  return !isActivated({
    usdLive,
    seller: { plan: candidate.plan, planExpiresAt: candidate.planExpiresAt, planGraceUntil: candidate.planGraceUntil },
    hasTopUp: candidate.hasTopUp,
    hasHadPositiveBalance: candidate.hasHadPositiveBalance,
    at: now,
  });
}
