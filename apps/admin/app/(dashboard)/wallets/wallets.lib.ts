import { formatCurrency } from "@workspace/lib";

import type { WalletPayoutStatus, WalletStatus } from "./wallets.types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function payoutStatusVariant(status: WalletPayoutStatus): BadgeVariant {
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

export function walletStatusVariant(status: WalletStatus): BadgeVariant {
  switch (status) {
    case "active":
      return "default";
    case "frozen":
      return "destructive";
    default:
      return "outline";
  }
}

/** Money arrives as a decimal string; format for display without going via float math elsewhere. */
export function money(value: string | number | null | undefined): string {
  return formatCurrency(Number(value ?? 0));
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB");
}

export const PAYOUT_STATUS_OPTIONS: {
  value: WalletPayoutStatus;
  label: string;
}[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

export const WALLET_STATUS_OPTIONS: { value: WalletStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "frozen", label: "Frozen" },
  { value: "closed", label: "Closed" },
];

/** Renders the free-form destination jsonb without assuming a fixed shape. */
export function describeDestination(destination: unknown): string {
  if (!destination || typeof destination !== "object") return "—";

  const record = destination as Record<string, unknown>;
  const parts = [record.accountName, record.accountNumber]
    .filter((part): part is string => typeof part === "string" && part.length > 0);

  return parts.length > 0 ? parts.join(" · ") : "—";
}
