/**
 * Store setup reminder emails (ROADMAP.md F-94, owner 2026-11-13): a seller
 * whose store isn't set up gets `day1` 24 hours after the seller account was
 * made and `day7` after 7 days, each once ever, Arabic only. Pure rules and
 * orchestration; the database side is setup-reminders.server.ts, the email is
 * sent by the backend (apps/backend/src/lib/emails/setup-reminder-email.ts).
 *
 * Who: the server query already keeps only sellers made in the last
 * SETUP_REMINDER_WINDOW_DAYS with a confirmed email and an account that isn't
 * suspended, restricted, an admin/staff role or a guest. Here: no store of
 * theirs is set up (`isStoreSetupDone`), no real order, no opt-out.
 *
 * Resend's free plan is 3,000 a month and 100 a day, shared with every other
 * email, so the run and the Cairo day are capped; what's left goes next run.
 */

import { isStoreSetupDone, type StoreSetupFlags } from "./store-setup.lib";

/** Every seller, old ones too (owner, 2026-11-13: "consider old sellers who didn't finish setup"); an old seller gets only the day-7 email. */
export const SETUP_REMINDER_WINDOW_DAYS = 3650;
export const SETUP_REMINDER_DAY1_HOURS = 24;
export const SETUP_REMINDER_DAY7_DAYS = 7;
/** day7 waits at least this long after day1 went out (a late day1 is not followed by day7 an hour later). */
export const SETUP_REMINDER_MIN_GAP_HOURS = 48;
/** Reminders per Cairo day (Resend free plan: 100 a day for every email). */
export const SETUP_REMINDER_DAILY_CAP = 40;
/** Reminders per hourly run. */
export const SETUP_REMINDER_RUN_CAP = 10;
/** Sends tried per (seller, kind) before giving up. */
export const SETUP_REMINDER_MAX_ATTEMPTS = 3;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export type SetupReminderKind = "day1" | "day7";
export const SETUP_REMINDER_KINDS: readonly SetupReminderKind[] = ["day1", "day7"];
export const isSetupReminderKind = (value: unknown): value is SetupReminderKind => value === "day1" || value === "day7";

export type SetupReminderRow = {
  kind: SetupReminderKind | "opt_out";
  status: "sending" | "sent" | "failed" | "opted_out";
  attempts: number;
  claimedAt: string;
  sentAt: string | null;
};

export type SetupReminderStore = { id: string; name: string; isPrimary: boolean; createdAt: string; flags: StoreSetupFlags };

export type SetupReminderSeller = {
  sellerId: string;
  /** sellers.created_at: when the seller account was made (signup step 2). */
  createdAt: string;
  hasRealOrders: boolean;
  /** The seller's stores that aren't deleted. */
  stores: SetupReminderStore[];
  reminders: SetupReminderRow[];
};

/** A timestamp from a raw row (Date or Postgres text) as ISO, or "" when unreadable. */
export function toIso(value: unknown): string {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  const text = String(value ?? "").trim();
  if (!text) return "";
  const date = new Date(text.includes("T") ? text : text.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00"));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

const time = (value: string | null | undefined) => (value ? new Date(value).getTime() : Number.NaN);

/** A kind is finished when it went out, is being sent, or failed too often. */
function finished(row: SetupReminderRow | undefined): boolean {
  if (!row) return false;
  return row.status !== "failed" || row.attempts >= SETUP_REMINDER_MAX_ATTEMPTS;
}

export function sellerSetupDone(stores: SetupReminderStore[]): boolean {
  return stores.some((store) => isStoreSetupDone(store.flags));
}

/** The reminder this seller should get now, with when it became due; null for none. At most one per call. */
export function dueSetupReminder(seller: SetupReminderSeller, now: Date): { kind: SetupReminderKind; dueAt: number } | null {
  const created = time(seller.createdAt);
  if (!Number.isFinite(created)) return null;
  const age = now.getTime() - created;
  if (age < SETUP_REMINDER_DAY1_HOURS * HOUR || age > SETUP_REMINDER_WINDOW_DAYS * DAY) return null;
  if (seller.hasRealOrders || sellerSetupDone(seller.stores)) return null;

  const byKind = new Map(seller.reminders.map((row) => [row.kind, row]));
  if (byKind.has("opt_out")) return null;

  if (age >= SETUP_REMINDER_DAY7_DAYS * DAY) {
    if (finished(byKind.get("day7"))) return null;
    const day1 = byKind.get("day1");
    if (day1 && day1.status !== "failed") {
      const last = time(day1.sentAt ?? day1.claimedAt);
      if (Number.isFinite(last) && now.getTime() - last < SETUP_REMINDER_MIN_GAP_HOURS * HOUR) return null;
    }
    return { kind: "day7", dueAt: created + SETUP_REMINDER_DAY7_DAYS * DAY };
  }
  if (finished(byKind.get("day1"))) return null;
  return { kind: "day1", dueAt: created + SETUP_REMINDER_DAY1_HOURS * HOUR };
}

export type PlannedSetupReminder = { sellerId: string; kind: SetupReminderKind };

/** This run's sends: one per seller, oldest due first, within the run cap and what's left of the day's cap. */
export function planSetupReminderRun(
  sellers: SetupReminderSeller[],
  options: { now: Date; sentToday: number; dailyCap?: number; runCap?: number },
): PlannedSetupReminder[] {
  const room = Math.min(
    options.runCap ?? SETUP_REMINDER_RUN_CAP,
    Math.max(0, (options.dailyCap ?? SETUP_REMINDER_DAILY_CAP) - options.sentToday),
  );
  if (room <= 0) return [];
  return sellers
    .flatMap((seller) => {
      const due = dueSetupReminder(seller, options.now);
      return due ? [{ sellerId: seller.sellerId, kind: due.kind, dueAt: due.dueAt }] : [];
    })
    .sort((a, b) => a.dueAt - b.dueAt || a.sellerId.localeCompare(b.sellerId))
    .slice(0, room)
    .map(({ sellerId, kind }) => ({ sellerId, kind }));
}

/** The store the email talks about: the primary one, else the oldest. */
export function reminderStore(stores: SetupReminderStore[]): SetupReminderStore | null {
  if (stores.length === 0) return null;
  return [...stores].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || time(a.createdAt) - time(b.createdAt))[0] ?? null;
}

// ---------------------------------------------------------------------------
// Delivery: claim before send, mark after.
// ---------------------------------------------------------------------------

export type SetupReminderClaim = { token: string; attempts: number };

export type DeliverSetupReminderDeps<S extends SetupReminderSeller = SetupReminderSeller> = {
  now: () => Date;
  /** The seller as the server query sees them now, or null when the account rules leave them out. */
  load: (sellerId: string) => Promise<S | null>;
  /** INSERT … ON CONFLICT claim; null when another run holds it or it is finished. */
  claim: (sellerId: string, kind: SetupReminderKind) => Promise<SetupReminderClaim | null>;
  send: (input: { seller: S; kind: SetupReminderKind; claim: SetupReminderClaim }) => Promise<{ id: string | null }>;
  markSent: (sellerId: string, kind: SetupReminderKind, resendId: string | null) => Promise<void>;
  markFailed: (sellerId: string, kind: SetupReminderKind, error: string) => Promise<void>;
};

export type DeliverSetupReminderResult =
  | { status: "sent"; emailId: string | null }
  | { status: "duplicate" }
  | { status: "failed" }
  | { status: "skipped"; reason: "not_eligible" | "not_due" | "paused" | "no_email" };

/**
 * Sends one reminder at most once: re-reads the seller, checks this exact kind
 * is due now, claims the (seller, kind) row, then sends. A send error marks the
 * row failed (a later run retries it up to SETUP_REMINDER_MAX_ATTEMPTS).
 */
export async function deliverSetupReminder<S extends SetupReminderSeller>(
  deps: DeliverSetupReminderDeps<S>,
  sellerId: string,
  kind: SetupReminderKind,
): Promise<DeliverSetupReminderResult> {
  const seller = await deps.load(sellerId);
  if (!seller) return { status: "skipped", reason: "not_eligible" };
  if (dueSetupReminder(seller, deps.now())?.kind !== kind) return { status: "skipped", reason: "not_due" };

  const claim = await deps.claim(sellerId, kind);
  if (!claim) return { status: "duplicate" };

  let id: string | null;
  try {
    ({ id } = await deps.send({ seller, kind, claim }));
  } catch (error) {
    await deps.markFailed(sellerId, kind, (error instanceof Error ? error.message : String(error)).slice(0, 500));
    return { status: "failed" };
  }
  await deps.markSent(sellerId, kind, id);
  return { status: "sent", emailId: id };
}

export type SetupReminderRunSummary = {
  candidates: number;
  planned: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: number;
  day1: number;
  day7: number;
  /** What's left of today's cap after this run. */
  capLeft: number;
};

/** One cron run. Counts only: no emails or names (they never reach the logs). */
export async function runSetupReminders(deps: {
  now: () => Date;
  countSentToday: () => Promise<number>;
  loadSellers: () => Promise<SetupReminderSeller[]>;
  deliver: (sellerId: string, kind: SetupReminderKind) => Promise<{ status: string }>;
  dailyCap?: number;
  runCap?: number;
}): Promise<SetupReminderRunSummary> {
  const dailyCap = deps.dailyCap ?? SETUP_REMINDER_DAILY_CAP;
  const [sentToday, sellers] = await Promise.all([deps.countSentToday(), deps.loadSellers()]);
  const plan = planSetupReminderRun(sellers, { now: deps.now(), sentToday, dailyCap, runCap: deps.runCap });
  const summary: SetupReminderRunSummary = {
    candidates: sellers.length,
    planned: plan.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: 0,
    day1: 0,
    day7: 0,
    capLeft: 0,
  };
  for (const item of plan) {
    try {
      const result = await deps.deliver(item.sellerId, item.kind);
      if (result.status === "sent") {
        summary.sent++;
        summary[item.kind]++;
      } else if (result.status === "failed") summary.failed++;
      else summary.skipped++;
    } catch {
      summary.errors++;
    }
  }
  summary.capLeft = Math.max(0, dailyCap - sentToday - summary.sent);
  return summary;
}
