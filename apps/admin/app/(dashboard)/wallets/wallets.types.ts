export type WalletPayoutStatus =
  | "pending"
  | "approved"
  | "processing"
  | "completed"
  | "rejected"
  | "cancelled"
  | "failed";

export type WalletStatus = "active" | "frozen" | "closed";

export type WalletTransactionType =
  | "top_up"
  | "payout"
  | "commission"
  | "order_payment"
  | "refund"
  | "adjustment"
  | "bonus";

export interface PayoutRequestRow {
  id: string;
  walletId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  amount: string;
  currency: string;
  status: WalletPayoutStatus;
  method: string;
  destination: unknown;
  adminNotes: string | null;
  rejectionReason: string | null;
  externalReference: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  processedAt: string | null;
  createdAt: string;
  /** Wallet figures at read time, so a reviewer can sanity-check the request. */
  walletBalance: string;
  walletReservedBalance: string;
}

export interface WalletRow {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  balance: string;
  reservedBalance: string;
  availableBalance: string;
  currency: string;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionRow {
  id: string;
  walletId: string;
  userId: string;
  userName: string | null;
  type: WalletTransactionType;
  amount: string;
  direction: string | null;
  balanceBefore: string;
  balanceAfter: string;
  status: string;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface WalletStats {
  totalWallets: number;
  totalBalance: string;
  totalReserved: string;
  pendingPayouts: number;
  pendingPayoutAmount: string;
}

export interface PayoutRequestFilters {
  status?: WalletPayoutStatus;
  search?: string;
}

export interface WalletFilters {
  status?: WalletStatus;
  search?: string;
}

export type AdminWalletResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface WalletsPageProps {
  searchParams?: Promise<{ status?: string; search?: string; tab?: string }>;
}
