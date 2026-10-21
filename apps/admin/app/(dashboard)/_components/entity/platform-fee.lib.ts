import {
  STANDARD_FEE_MIN_PIASTRES,
  isTrialActive,
  type SellerFeeProfile,
} from "@workspace/lib/orders/platform-fee";

/**
 * How the Tallaby fee applies to a seller, for display only (PLAN.md §13):
 * a flat EGP 5 per delivered order from the store wallet, nothing during the
 * 7-day trial, nothing when exempt. `sellers.commission_rate` is legacy and
 * never shown. The fee itself is computed by `computeSellerPlatformFee`.
 */
export type PlatformFeeState =
  | { kind: "exempt"; label: string }
  | { kind: "trial"; label: string; endsAt: string }
  | { kind: "standard"; label: string };

export const FLAT_FEE_LABEL = `EGP ${STANDARD_FEE_MIN_PIASTRES / 100} per delivered order`;

export function platformFeeState(seller: SellerFeeProfile, at: Date = new Date()): PlatformFeeState {
  if (seller.isCommissionExempt) return { kind: "exempt", label: "Fee exempt" };
  if (isTrialActive(seller, at) && seller.feeTrialEndsAt) {
    return { kind: "trial", label: "Free trial", endsAt: new Date(seller.feeTrialEndsAt).toISOString() };
  }
  return { kind: "standard", label: FLAT_FEE_LABEL };
}
