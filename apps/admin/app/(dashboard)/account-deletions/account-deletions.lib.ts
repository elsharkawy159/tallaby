import type { AccountDeletionStatus } from "@workspace/lib/account-deletion";

export const STATUS_LABELS: Record<AccountDeletionStatus, string> = {
  scheduled: "Closed · waiting for purge",
  completed: "Deleted",
  restored: "Restored",
};

export const FILTERS = ["scheduled", "completed", "restored", "all"] as const;
export type AccountDeletionFilterKey = (typeof FILTERS)[number];

export const FILTER_LABELS: Record<AccountDeletionFilterKey, string> = {
  scheduled: "Waiting for purge",
  completed: "Deleted",
  restored: "Restored",
  all: "All (latest 100)",
};

export function parseFilter(value: string | undefined): AccountDeletionFilterKey {
  return (FILTERS as readonly string[]).includes(value ?? "") ? (value as AccountDeletionFilterKey) : "scheduled";
}

export const formatWhen = (iso: string) =>
  new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(iso));
