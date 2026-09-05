import type { WalletTransactionType } from "@workspace/db/wallet";

import type {
  WalletPayoutStatus,
  WalletUserRole,
} from "./wallet.types";

/**
 * Roles that may request a payout out of their wallet.
 *
 * Riders map onto the existing `driver` role — `apps/shipping` keys entirely off
 * that value, so there is no separate "rider" role. `marketing` was added by
 * migration 0025.
 *
 * Customers, sellers, support and admins cannot request. Sellers are paid
 * through the separate seller payout system (`seller_payouts`), which this
 * wallet deliberately does not touch.
 *
 * This is the single source of truth for eligibility. It is checked
 * server-side in wallet.server.ts on every payout write; hiding the button is
 * presentation, not authorization.
 */
export const PAYOUT_ELIGIBLE_ROLES = ["driver", "marketing"] as const;

export function canRequestPayout(role: WalletUserRole | null | undefined): boolean {
  if (!role) return false;
  return (PAYOUT_ELIGIBLE_ROLES as readonly string[]).includes(role);
}

/** EGP. Enforced again by Zod on the client and re-checked in the action. */
export const WALLET_TOP_UP_MIN = 10;
export const WALLET_TOP_UP_MAX = 50_000;
export const WALLET_PAYOUT_MIN = 50;

/**
 * Card (Paymob) top-ups are temporarily off. Flip to true once Paymob is fixed;
 * the UI already has a disabled card option ready to re-enable.
 */
export const WALLET_PAYMOB_TOP_UP_ENABLED = false;

/** Manual transfer methods available for wallet top-up (same as checkout). */
export const WALLET_TOP_UP_METHODS = [
  "instapay",
  "vodafone_cash",
  "e_cash",
] as const;

export type WalletTopUpMethod = (typeof WALLET_TOP_UP_METHODS)[number];

/** Preset amounts offered as one-tap buttons in the top-up dialog. */
export const WALLET_TOP_UP_PRESETS = [50, 100, 250, 500] as const;

export const WALLET_PAYOUT_METHODS = [
  "bank_transfer",
  "instapay",
  "mobile_wallet",
] as const;

export type WalletPayoutMethod = (typeof WALLET_PAYOUT_METHODS)[number];

// The provider reference namespace lives in @workspace/db/wallet so the
// storefront (which writes it) and the backend webhook (which reads it) share
// one definition. Re-exported here for local imports.
export {
  WALLET_TOP_UP_REFERENCE_PREFIX,
  buildTopUpReference,
} from "@workspace/db/wallet";

/** Page size for the transaction history list. */
export const WALLET_TRANSACTIONS_PAGE_SIZE = 10;

/**
 * The error a wallet action returns when there is no signed-in, non-guest user.
 * Lives here rather than in wallet.server.ts because a "use server" module may
 * only export async functions — and the page needs to tell "sign in" apart from
 * "something broke".
 */
export const WALLET_UNAUTHENTICATED_ERROR = "Authentication required";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function payoutStatusBadgeVariant(
  status: WalletPayoutStatus
): BadgeVariant {
  switch (status) {
    case "completed":
      return "default";
    case "rejected":
    case "failed":
      return "destructive";
    case "cancelled":
      return "outline";
    default:
      return "secondary";
  }
}

/**
 * i18n key suffix for a transaction type, so the label lives in messages/*.json
 * rather than being hardcoded in a component.
 */
export function transactionTypeKey(type: WalletTransactionType): string {
  return `transactionType.${type}`;
}

export function payoutStatusKey(status: WalletPayoutStatus): string {
  return `payoutStatus.${status}`;
}

/**
 * Ledger amounts arrive signed. Returns the magnitude for display alongside an
 * explicit +/- prefix, so a debit never renders as a bare negative currency
 * string (which formats badly in Arabic).
 */
export function splitSignedAmount(amount: string): {
  isNegative: boolean;
  magnitude: number;
} {
  const numeric = Number(amount);
  return { isNegative: numeric < 0, magnitude: Math.abs(numeric) };
}
