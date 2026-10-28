/**
 * Admin › AI usage (PLAN.md AI-1): the date ranges, labels and number
 * formats shared by the platform page and the seller page's AI tab. The data
 * is `ai_usage_logs` (0110, one row per model call) and `products.ai_source`
 * (0112).
 */

export const AI_USAGE_RANGES = ["7d", "30d", "90d", "all"] as const;
export type AiUsageRange = (typeof AI_USAGE_RANGES)[number];

export const AI_USAGE_RANGE_LABELS: Record<AiUsageRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

const RANGE_DAYS: Record<AiUsageRange, number | null> = { "7d": 7, "30d": 30, "90d": 90, all: null };

/** Start of the range, or null for all time. */
export function aiUsageRangeStart(range: AiUsageRange, now = new Date()): Date | null {
  const days = RANGE_DAYS[range];
  return days === null ? null : new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/** The AI features that log usage; an unknown one shows its raw key. */
export const AI_FEATURE_LABELS: Record<string, string> = {
  product_autofill: "Product autofill",
};

export function aiFeatureLabel(feature: string): string {
  return AI_FEATURE_LABELS[feature] ?? feature;
}

/** Micro-USD (integer) → "$0.0123". Small sums keep 4 decimals so a few calls never show as $0.00. */
export function formatMicroUsd(micro: number): string {
  const usd = micro / 1_000_000;
  const digits = usd !== 0 && Math.abs(usd) < 1 ? 4 : 2;
  return `$${usd.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 10_000) return `${Math.round(tokens / 1_000)}k`;
  return tokens.toLocaleString("en-US");
}

/** Share of calls that failed (errors only; blocked calls hit the daily cap and never reached the model). */
export function errorRate(ok: number, errors: number): string {
  const total = ok + errors;
  return total === 0 ? "—" : `${((errors / total) * 100).toFixed(1)}%`;
}

export function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}
