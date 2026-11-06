import type { ThemeRequestStatus } from "@workspace/lib/theme-requests";

export const STATUS_LABELS: Record<ThemeRequestStatus, string> = {
  new: "New",
  in_progress: "In progress",
  ready: "Ready",
  declined: "Declined",
};

export const FILTERS = ["open", "new", "in_progress", "ready", "declined", "all"] as const;
export type ThemeRequestFilterKey = (typeof FILTERS)[number];

export const FILTER_LABELS: Record<ThemeRequestFilterKey, string> = {
  open: "Open",
  new: "New",
  in_progress: "In progress",
  ready: "Ready",
  declined: "Declined",
  all: "All (latest 100)",
};

export function parseFilter(value: string | undefined): ThemeRequestFilterKey {
  return (FILTERS as readonly string[]).includes(value ?? "") ? (value as ThemeRequestFilterKey) : "open";
}

export const formatWhen = (iso: string) =>
  new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(iso));
