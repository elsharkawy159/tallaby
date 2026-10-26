import { STANDARD_FEE_MIN_PIASTRES } from "@workspace/lib/orders/platform-fee";
import { STORE_TOP_UP_MAX_PIASTRES, STORE_TOP_UP_MIN_EGP } from "@workspace/lib/store-wallet";

/** The flat platform fee per delivered order, in EGP (PLAN.md §13). */
export const FEE_PER_ORDER_EGP = STANDARD_FEE_MIN_PIASTRES / 100;

export const TOP_UP_MAX_EGP = STORE_TOP_UP_MAX_PIASTRES / 100;

/** The amounts offered as one-tap choices; 500 is marked as the most chosen. */
export const TOP_UP_PRESETS = [100, 250, 500, 1000, 2000] as const;
export const POPULAR_TOP_UP = 500;

/** The +/- buttons beside the amount field move by this much (EGP). */
export const TOP_UP_STEP_EGP = 50;

/** How many delivered orders an amount covers at the flat fee (none for zero or less). */
export function ordersCovered(amountEgp: number): number {
  return amountEgp > 0 ? Math.floor(amountEgp / FEE_PER_ORDER_EGP) : 0;
}

/** The amount after a +/- tap, kept within the top-up limits. */
export function stepTopUpAmount(current: number, delta: number): number {
  return Math.min(TOP_UP_MAX_EGP, Math.max(STORE_TOP_UP_MIN_EGP, (current || 0) + delta));
}
