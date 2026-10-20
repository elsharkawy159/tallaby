import type {
  WalletStatus,
  WalletTransactionType,
} from "@workspace/db/wallet";

/** The `users.role` enum. Mirrors packages/db `user_role`. */
export type WalletUserRole =
  | "customer"
  | "seller"
  | "admin"
  | "support"
  | "driver"
  | "marketing";

export type WalletTransactionDirection = "credit" | "debit";

export type WalletTransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "reversed";

export type WalletPayoutStatus =
  | "pending"
  | "approved"
  | "processing"
  | "completed"
  | "rejected"
  | "cancelled"
  | "failed";

export interface WalletBalance {
  /** Total held, including anything reserved against an open payout. */
  balance: string;
  /** Held against an open payout request. */
  reservedBalance: string;
  /** `balance - reservedBalance` — what the user can actually spend. */
  availableBalance: string;
  currency: string;
  status: WalletStatus;
}

export interface WalletTransactionView {
  id: string;
  type: WalletTransactionType;
  /** Signed: negative for debits. */
  amount: string;
  direction: WalletTransactionDirection;
  balanceAfter: string;
  status: WalletTransactionStatus;
  description: string | null;
  createdAt: string;
}

export interface WalletPayoutRequestView {
  id: string;
  amount: string;
  status: WalletPayoutStatus;
  method: string;
  rejectionReason: string | null;
  externalReference: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface WalletOverview {
  wallet: WalletBalance;
  role: WalletUserRole;
  /** Server-computed. The UI must not re-derive payout eligibility itself. */
  canRequestPayout: boolean;
  hasOpenPayoutRequest: boolean;
  transactions: WalletTransactionView[];
  payoutRequests: WalletPayoutRequestView[];
}

/** The shape every wallet server action returns. */
export type WalletActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };
