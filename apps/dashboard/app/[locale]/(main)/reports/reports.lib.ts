import { getGovernorateLabel, normalizeGovernorate } from "@workspace/lib/shipping";

/**
 * Reports (ROADMAP.md F-15a): pure helpers shared by the report queries, the
 * page and their tests. No server imports here. Money is integer piastres.
 */

export const REPORT_RANGES = [7, 30, 90] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];
export const DEFAULT_REPORT_RANGE: ReportRange = 30;

/** Reports count days on the Cairo calendar, like the home page and GA4. */
export const REPORT_TIME_ZONE = "Africa/Cairo";

/** Aggregates only (counts and sums), cached briefly per seller + store + range. */
export const REPORT_TTL_SECONDS = 300;

/** Products shown in the best and in the worst list. */
export const REPORT_PRODUCTS_MAX = 5;

export function parseReportRange(value: string | string[] | undefined): ReportRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (REPORT_RANGES as readonly number[]).includes(n) ? (n as ReportRange) : DEFAULT_REPORT_RANGE;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `?store=` is only a hint: it must be one of the seller's own stores, else the fallback is used. */
export function pickReportStore(
  wanted: string | string[] | undefined,
  ownStoreIds: readonly string[],
  fallback: string | null,
): string | null {
  const id = Array.isArray(wanted) ? wanted[0] : wanted;
  if (id && UUID_RE.test(id) && ownStoreIds.includes(id)) return id;
  return fallback && ownStoreIds.includes(fallback) ? fallback : (ownStoreIds[0] ?? null);
}

// ---------------------------------------------------------------------------
// Cairo date range
// ---------------------------------------------------------------------------

/** `YYYY-MM-DD` of `date` in `timeZone`. */
export function dayIn(date: Date, timeZone: string = REPORT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Wall-clock minus UTC (ms) of `timeZone` at `instant`. */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return wall - Math.floor(instant / 1000) * 1000;
}

/** The instant local midnight of `day` (`YYYY-MM-DD`) happens in `timeZone` (DST-safe). */
export function zonedMidnight(day: string, timeZone: string = REPORT_TIME_ZONE): Date {
  const [y, m, d] = day.split("-").map(Number);
  const guess = Date.UTC(y!, m! - 1, d!);
  let utc = guess - zoneOffsetMs(guess, timeZone);
  const second = guess - zoneOffsetMs(utc, timeZone);
  if (second !== utc) utc = second;
  return new Date(utc);
}

/**
 * The report period: the last `days` Cairo calendar days, today included.
 * `start` is Cairo midnight of the first day (ISO, UTC). It only changes at
 * Cairo midnight, so it is a stable part of the cache key.
 */
export function reportPeriod(days: number, now: Date = new Date(), timeZone: string = REPORT_TIME_ZONE) {
  const today = dayIn(now, timeZone);
  const t = Date.parse(`${today}T00:00:00Z`);
  const firstDay = new Date(t - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  return { firstDay, today, start: zonedMidnight(firstDay, timeZone).toISOString() };
}

// ---------------------------------------------------------------------------
// Rates
// ---------------------------------------------------------------------------

/** part / whole in 0..1, or null when there is nothing to divide by. */
export function rate(part: number, whole: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return null;
  return Math.min(1, Math.max(0, part / whole));
}

/** `"1234.50"`-style DB numbers (or a piastres bigint string) to a safe integer. */
export function toInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/** Order outcome counts, the same rules as the customers page (`orderOutcome`). */
export type OutcomeCounts = { orders: number; delivered: number; refused: number; cancelled: number };

export type OutcomeRates = {
  /** refused ÷ (delivered + refused): of the orders that reached an end on the road. */
  refusalRate: number | null;
  /** cancelled ÷ all orders. */
  cancelRate: number | null;
  /** delivered ÷ (delivered + refused). */
  deliveryRate: number | null;
  /** Orders still on their way (not delivered, refused or cancelled). */
  open: number;
};

export function outcomeRates(c: OutcomeCounts): OutcomeRates {
  const ended = c.delivered + c.refused;
  return {
    refusalRate: rate(c.refused, ended),
    cancelRate: rate(c.cancelled, c.orders),
    deliveryRate: rate(c.delivered, ended),
    open: Math.max(0, c.orders - c.delivered - c.refused - c.cancelled),
  };
}

// ---------------------------------------------------------------------------
// Governorates
// ---------------------------------------------------------------------------

export type GovernorateRawRow = OutcomeCounts & { governorate: string | null };
export type GovernorateRow = OutcomeCounts &
  OutcomeRates & {
    /** Canonical key (`CAIRO`) or `"unknown"` when the address had none we recognise. */
    key: string;
    label: string;
  };

export const UNKNOWN_GOVERNORATE = "unknown";

/**
 * Merges raw `user_addresses.state` groups (typed in Arabic, English or by
 * the geocoder) into canonical governorates, busiest first; unknown last.
 */
export function governorateRows(rows: GovernorateRawRow[], locale: string, unknownLabel: string): GovernorateRow[] {
  const merged = new Map<string, OutcomeCounts>();
  for (const row of rows) {
    const key = normalizeGovernorate(row.governorate) ?? UNKNOWN_GOVERNORATE;
    const acc = merged.get(key) ?? { orders: 0, delivered: 0, refused: 0, cancelled: 0 };
    acc.orders += toInt(row.orders);
    acc.delivered += toInt(row.delivered);
    acc.refused += toInt(row.refused);
    acc.cancelled += toInt(row.cancelled);
    merged.set(key, acc);
  }
  return [...merged.entries()]
    .filter(([, c]) => c.orders > 0)
    .map(([key, c]) => ({
      key,
      label: key === UNKNOWN_GOVERNORATE ? unknownLabel : getGovernorateLabel(key, locale),
      ...c,
      ...outcomeRates(c),
    }))
    .sort((a, b) => {
      if ((a.key === UNKNOWN_GOVERNORATE) !== (b.key === UNKNOWN_GOVERNORATE)) return a.key === UNKNOWN_GOVERNORATE ? 1 : -1;
      return b.orders - a.orders || a.label.localeCompare(b.label);
    });
}

export function sumOutcomes(rows: OutcomeCounts[]): OutcomeCounts {
  return rows.reduce(
    (acc, r) => ({
      orders: acc.orders + r.orders,
      delivered: acc.delivered + r.delivered,
      refused: acc.refused + r.refused,
      cancelled: acc.cancelled + r.cancelled,
    }),
    { orders: 0, delivered: 0, refused: 0, cancelled: 0 },
  );
}

// ---------------------------------------------------------------------------
// Sales by source
// ---------------------------------------------------------------------------

/** This store's website, the seller's other stores, the Tallaby marketplace, orders added by hand. */
export const REPORT_SOURCES = ["store", "otherStores", "marketplace", "manual"] as const;
export type ReportSource = (typeof REPORT_SOURCES)[number];

export type SourceRow = { source: ReportSource; orders: number; revenuePiastres: number; share: number | null };

/** Every source in a fixed order (zeros kept so the legend never jumps); share is of revenue. */
export function sourceRows(raw: { source: string; orders: unknown; revenuePiastres: unknown }[]): SourceRow[] {
  const bySource = new Map<ReportSource, { orders: number; revenuePiastres: number }>();
  for (const r of raw) {
    if (!(REPORT_SOURCES as readonly string[]).includes(r.source)) continue;
    const key = r.source as ReportSource;
    const acc = bySource.get(key) ?? { orders: 0, revenuePiastres: 0 };
    acc.orders += toInt(r.orders);
    acc.revenuePiastres += toInt(r.revenuePiastres);
    bySource.set(key, acc);
  }
  const total = [...bySource.values()].reduce((sum, r) => sum + r.revenuePiastres, 0);
  return REPORT_SOURCES.map((source) => {
    const r = bySource.get(source) ?? { orders: 0, revenuePiastres: 0 };
    return { source, ...r, share: rate(r.revenuePiastres, total) };
  }).filter((r) => r.source !== "manual" || r.orders > 0);
}

// ---------------------------------------------------------------------------
// Funnel
// ---------------------------------------------------------------------------

export const FUNNEL_STEPS = ["views", "checkouts", "orders", "delivered"] as const;
export type FunnelStepKey = (typeof FUNNEL_STEPS)[number];
export type FunnelStep = {
  key: FunnelStepKey;
  value: number;
  /** Of the step before (0..1); null on the first step or when the step before is 0. */
  fromPrevious: number | null;
  /** Of the first step shown (0..1). */
  fromTop: number | null;
};

/**
 * Views (GA4 sessions, null when GA4 is not set up) → checkouts started →
 * orders → delivered. Checkouts are the orders plus the checkouts left
 * without an order, so they never fall below orders. Views come from another
 * system and can trail checkouts; the rates are capped at 100%.
 */
export function funnelSteps(input: {
  views: number | null;
  abandonedCheckouts: number;
  orders: number;
  delivered: number;
}): FunnelStep[] {
  const orders = Math.max(0, toInt(input.orders));
  const values: [FunnelStepKey, number][] = [
    ["checkouts", orders + Math.max(0, toInt(input.abandonedCheckouts))],
    ["orders", orders],
    ["delivered", Math.min(orders, Math.max(0, toInt(input.delivered)))],
  ];
  if (input.views !== null) values.unshift(["views", Math.max(0, toInt(input.views))]);
  const top = values[0]![1];
  return values.map(([key, value], i) => ({
    key,
    value,
    fromPrevious: i === 0 ? null : rate(value, values[i - 1]![1]),
    fromTop: i === 0 ? null : rate(value, top),
  }));
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export type ReportProduct = {
  productId: string;
  title: string;
  image: string | null;
  units: number;
  orders: number;
  revenuePiastres: number;
};

/** The worst list leaves out products already in the best list (small catalogs). */
export function worstProducts(candidates: ReportProduct[], best: ReportProduct[], max = REPORT_PRODUCTS_MAX): ReportProduct[] {
  const bestIds = new Set(best.map((p) => p.productId));
  return candidates.filter((p) => !bestIds.has(p.productId)).slice(0, max);
}

/** Average order value in piastres (integer), null without orders. */
export function averageOrderPiastres(revenuePiastres: number, orders: number): number | null {
  return orders > 0 ? Math.round(revenuePiastres / orders) : null;
}

/** Piastres to pounds for display only. */
export const piastresToPounds = (piastres: number) => piastres / 100;
