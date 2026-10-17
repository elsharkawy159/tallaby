/**
 * Fee trial status for the dashboard banner and the reminder emails
 * (PLAN.md §13.5, P6-07). Pure.
 */

const DAY_MS = 86_400_000;

export type FeeTrialFields = {
  feeTrialEligible?: boolean | null;
  feeTrialStartedAt?: string | Date | null;
  feeTrialEndsAt?: string | Date | null;
};

export type FeeTrialStatus =
  /** Old seller, or an admin removed eligibility: no trial, nothing to show. */
  | { state: "none" }
  /** Eligible; starts with the first active product or the first publish (D20). */
  | { state: "not_started" }
  | { state: "active"; endsAt: Date; daysLeft: number }
  | { state: "ended"; endsAt: Date };

function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getFeeTrialStatus(seller: FeeTrialFields, now: Date = new Date()): FeeTrialStatus {
  const started = toDate(seller.feeTrialStartedAt);
  const endsAt = toDate(seller.feeTrialEndsAt);
  if (!started || !endsAt) return seller.feeTrialEligible ? { state: "not_started" } : { state: "none" };
  if (now.getTime() >= endsAt.getTime()) return { state: "ended", endsAt };
  // Whole days left, rounded up: 6 days and 1 hour is "7 days".
  return { state: "active", endsAt, daysLeft: Math.max(1, Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS)) };
}

export type FeeTrialReminderStage = "t7" | "t1";

/**
 * Which reminder is due: "t1" in the last day, "t7" in the last week, else
 * none. The sender claims each stage once per seller, so a missed cron run
 * still sends it the next day, and a seller already in the last day only
 * gets "t1".
 */
export function feeTrialReminderStage(
  endsAt: string | Date | null | undefined,
  now: Date = new Date(),
): FeeTrialReminderStage | null {
  const end = toDate(endsAt);
  if (!end) return null;
  const left = end.getTime() - now.getTime();
  if (left <= 0) return null;
  if (left <= DAY_MS) return "t1";
  if (left <= 7 * DAY_MS) return "t7";
  return null;
}
