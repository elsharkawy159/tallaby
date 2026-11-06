import type { AccountDeletionStatus } from "@workspace/lib/account-deletion";

export const STATUS_LABELS: Record<AccountDeletionStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled by seller",
  declined: "Declined",
};

export const FILTERS = ["pending", "completed", "declined", "cancelled", "all"] as const;
export type AccountDeletionFilterKey = (typeof FILTERS)[number];

export const FILTER_LABELS: Record<AccountDeletionFilterKey, string> = {
  pending: "Pending",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
  all: "All (latest 100)",
};

export function parseFilter(value: string | undefined): AccountDeletionFilterKey {
  return (FILTERS as readonly string[]).includes(value ?? "") ? (value as AccountDeletionFilterKey) : "pending";
}

export const formatWhen = (iso: string) =>
  new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(iso));
