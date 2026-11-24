import { orderGraceDays, orderGraceStart } from "@workspace/lib/billing/order-grace";

/**
 * Where a seller stands with the trial before a top-up (docs/seller-top-up-rules.md,
 * packages/lib/src/billing/order-lock.lib.ts), for the Admin sellers list:
 *
 * - `activated`: activated for good (§1), or the USD switch is off (nothing applies).
 * - `in_trial`: not activated and the trial's days aren't over (§2, §3).
 * - `in_review`: the days are over but a manual top-up waits for review, so the
 *   stores stay online (§5).
 * - `offline`: the days are over, no top-up in review: every store is offline (§4).
 *
 * sellers.query.ts filters on the same states in SQL (seller-trial.query.ts).
 */
export const SELLER_TRIAL_STATES = ["offline", "in_review", "in_trial", "activated"] as const;
export type SellerTrialState = (typeof SELLER_TRIAL_STATES)[number];

export const SELLER_TRIAL_LABELS: Record<SellerTrialState, string> = {
  offline: "Trial ended — stores offline",
  in_review: "Trial ended — top-up in review",
  in_trial: "In trial",
  activated: "Activated",
};

export const isSellerTrialState = (value: string): value is SellerTrialState =>
  (SELLER_TRIAL_STATES as readonly string[]).includes(value);

export type SellerTrialStatus = {
  state: SellerTrialState;
  /** When the trial's days end (or ended); null for an activated seller. */
  endsAt: string | null;
};

const DAY_MS = 86_400_000;

/**
 * The same answer as orderLockState's `storeOffline` and grace `offlineAt`, from
 * facts read for many sellers at once. `activated` is isActivated's money and Pro
 * part (a succeeded top-up, a balance ever above zero, active Pro).
 */
export function sellerTrialStatus(input: {
  usdLive: boolean;
  activated: boolean;
  hasPendingManualTopUp: boolean;
  createdAt: string | null | undefined;
  at?: Date;
}): SellerTrialStatus {
  if (!input.usdLive || input.activated) return { state: "activated", endsAt: null };
  const at = input.at ?? new Date();
  const endsAt = new Date(orderGraceStart(input.createdAt).getTime() + orderGraceDays(input.createdAt) * DAY_MS);
  const state: SellerTrialState =
    at.getTime() < endsAt.getTime() ? "in_trial" : input.hasPendingManualTopUp ? "in_review" : "offline";
  return { state, endsAt: endsAt.toISOString() };
}
