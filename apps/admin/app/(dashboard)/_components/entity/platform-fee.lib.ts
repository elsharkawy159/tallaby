import {
  STANDARD_FEE_MIN_PIASTRES,
  isTrialActive,
  type SellerFeeProfile,
} from "@workspace/lib/orders/platform-fee";
import { FREE_ORDER_FEE_USD_CENTS, isProActive } from "@workspace/lib/billing";

/**
 * How the Tallaby fee applies to a seller, for display only (PLAN.md §13):
 * a flat EGP 5 per delivered order from the store wallet, nothing during the
 * 7-day trial, nothing when exempt. `sellers.commission_rate` is legacy and
 * never shown. The fee itself is computed by `computeSellerPlatformFee`.
 */
export type PlatformFeeState =
  | { kind: "exempt"; label: string }
  | { kind: "trial"; label: string; endsAt: string }
  | { kind: "pro"; label: string }
  | { kind: "standard"; label: string };

export const FLAT_FEE_LABEL = `EGP ${STANDARD_FEE_MIN_PIASTRES / 100} per delivered order`;

/** After the USD switch (0136): the Free plan's fee. */
export const USD_FEE_LABEL = `$${(FREE_ORDER_FEE_USD_CENTS / 100).toFixed(2)} per order`;

/** A seller's fee follows their wallet's currency, so these screens match what the wallet is charged. */
export type PlatformFeeSeller = SellerFeeProfile & { walletCurrency?: string | null };

export function platformFeeState(seller: PlatformFeeSeller, at: Date = new Date()): PlatformFeeState {
  if (seller.isCommissionExempt) return { kind: "exempt", label: "Fee exempt" };
  if (isTrialActive(seller, at) && seller.feeTrialEndsAt) {
    return { kind: "trial", label: "Free trial", endsAt: new Date(seller.feeTrialEndsAt).toISOString() };
  }
  if (seller.walletCurrency !== "USD") return { kind: "standard", label: FLAT_FEE_LABEL };
  return isProActive(seller, at) ? { kind: "pro", label: "Pro: no order fee" } : { kind: "standard", label: USD_FEE_LABEL };
}
