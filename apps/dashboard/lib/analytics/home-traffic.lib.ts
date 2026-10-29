import { STORE_ID_DIMENSION, rangeDays } from "./store-views.lib";

/**
 * Store-website traffic for the dashboard home (visits, conversion, traffic
 * sources), read from the same GA4 property as Store views (SA-01). Pure:
 * request bodies and parsing. Visits are GA4 sessions of the seller's stores.
 */

/** GA4 filter on one or more of the seller's (already checked) store ids. */
function storeFilter(storeIds: string[]) {
  return {
    filter: {
      fieldName: STORE_ID_DIMENSION,
      inListFilter: { values: storeIds, caseSensitive: true },
    },
  };
}

/** Daily sessions of the range, plus the period of the same length before it. */
export function homeVisitsReportBody(storeIds: string[], days: number) {
  return {
    dateRanges: [
      { startDate: `${days - 1}daysAgo`, endDate: "today", name: "current" },
      { startDate: `${days * 2 - 1}daysAgo`, endDate: `${days}daysAgo`, name: "previous" },
    ],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }],
    dimensionFilter: storeFilter(storeIds),
    limit: 1000,
  };
}

/** Sessions per traffic source over the range. */
export function homeSourcesReportBody(storeIds: string[], days: number) {
  return {
    dateRanges: [{ startDate: `${days - 1}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "sessionSource" }],
    metrics: [{ name: "sessions" }],
    dimensionFilter: storeFilter(storeIds),
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 50,
  };
}

type Ga4Row = { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] };
type Ga4Response = { rows?: Ga4Row[] };

const toInt = (value: string | undefined) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export type HomeVisits = { visits: number; previousVisits: number; daily: number[] };

/** Sessions per day (oldest first, zero-filled) and the two period totals. */
export function parseHomeVisits(json: unknown, days: number, today: string): HomeVisits {
  const byDay = new Map<string, number>();
  let visits = 0;
  let previousVisits = 0;
  for (const row of (json as Ga4Response | null)?.rows ?? []) {
    const raw = row.dimensionValues?.[0]?.value ?? "";
    const range = row.dimensionValues?.[1]?.value;
    const sessions = toInt(row.metricValues?.[0]?.value);
    if (range === "previous") {
      previousVisits += sessions;
      continue;
    }
    visits += sessions;
    if (/^\d{8}$/.test(raw)) byDay.set(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`, sessions);
  }
  const daily = rangeDays(today, days).map((day) => byDay.get(day) ?? 0);
  return { visits, previousVisits, daily };
}

/** Known platforms get one row each whatever the referrer host (l.instagram.com, m.facebook.com…). */
export const TRAFFIC_PLATFORMS = ["instagram", "facebook", "tiktok", "google", "whatsapp", "youtube", "direct"] as const;
export type TrafficPlatform = (typeof TRAFFIC_PLATFORMS)[number];

export function trafficPlatform(source: string): TrafficPlatform | null {
  const s = source.trim().toLowerCase();
  if (!s || s === "(direct)" || s === "(none)") return "direct";
  if (/instagram|^ig$/.test(s)) return "instagram";
  if (/facebook|^fb$|^m\.me$|messenger/.test(s)) return "facebook";
  if (/tiktok/.test(s)) return "tiktok";
  if (/google/.test(s)) return "google";
  if (/whatsapp|^wa\.me$/.test(s)) return "whatsapp";
  if (/youtube|youtu\.be/.test(s)) return "youtube";
  return null;
}

export type TrafficSource = {
  /** A known platform, or null for any other site (shown by its host name). */
  platform: TrafficPlatform | null;
  label: string;
  sessions: number;
};

/** Groups GA4 sources into platforms and returns the biggest `limit` (others are dropped). */
export function parseHomeSources(json: unknown, limit = 5): TrafficSource[] {
  const grouped = new Map<string, TrafficSource>();
  for (const row of (json as Ga4Response | null)?.rows ?? []) {
    const source = row.dimensionValues?.[0]?.value ?? "";
    const sessions = toInt(row.metricValues?.[0]?.value);
    if (!sessions || source === "(not set)") continue;
    const platform = trafficPlatform(source);
    const key = platform ?? source.toLowerCase();
    const entry = grouped.get(key) ?? { platform, label: platform ?? source, sessions: 0 };
    entry.sessions += sessions;
    grouped.set(key, entry);
  }
  return [...grouped.values()].sort((a, b) => b.sessions - a.sessions).slice(0, limit);
}
