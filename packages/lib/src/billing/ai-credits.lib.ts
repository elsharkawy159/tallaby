import { AI_CREDITS_MONTHLY_NOT_ACTIVATED, getPlanLimits } from "../plans";

/** Which monthly allowance applies now, and the key that loads it once per period. */
export function aiCreditAllowance(input: {
  isPro: boolean;
  planExpiresAt: string | null;
  /** From getOrderLock; always false before the USD switch. */
  locked: boolean;
  month: string;
}): { plan: "free" | "pro"; allowance: number; period: string; notActivated: boolean } {
  if (input.isPro) {
    return { plan: "pro", allowance: getPlanLimits("pro").aiCreditsMonthly, period: `pro:${input.planExpiresAt ?? "open"}`, notActivated: false };
  }
  return input.locked
    ? { plan: "free", allowance: AI_CREDITS_MONTHLY_NOT_ACTIVATED, period: `free-locked:${input.month}`, notActivated: true }
    : { plan: "free", allowance: getPlanLimits("free").aiCreditsMonthly, period: `free:${input.month}`, notActivated: false };
}

const freePeriod = (period: string | null) => {
  const match = period?.match(/^free(-locked)?:(.+)$/);
  return match ? { locked: Boolean(match[1]), month: match[2]! } : null;
};

/**
 * Monthly credits after moving to a new period key. No carry-over: a new month, a
 * first load or a move from Pro gets the full allowance. Activation is for good
 * (F-68), so a seller normally only moves up. The period can still flip because
 * getOrderLock fails open: a failed check reads as activated, and the next good one as
 * locked. Inside one month:
 * - going locked keeps at most the locked allowance, so nobody gains by it;
 * - activating loads the full Free allowance the first time;
 * - activating again can't refill: it gives back only what the month's Free allowance
 *   still has after what was used since it first loaded.
 */
export function nextMonthlyCredits(input: {
  previousPeriod: string | null;
  remaining: number;
  nextPeriod: string;
  allowance: number;
  /** Monthly credits used since `nextPeriod` first loaded; null if it never has. */
  usedSinceGrant: number | null;
}): number {
  const before = freePeriod(input.previousPeriod);
  const after = freePeriod(input.nextPeriod);
  if (!before || !after || before.month !== after.month) return input.allowance;
  if (after.locked) return Math.min(input.remaining, input.allowance);
  if (input.usedSinceGrant === null) return input.allowance;
  return Math.max(input.remaining, Math.min(input.allowance, input.allowance - input.usedSinceGrant));
}
