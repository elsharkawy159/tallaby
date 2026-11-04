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
  product_bulk_map: "Bulk products: columns",
  product_bulk_pdf: "Bulk products: PDF reading",
  product_bulk_copy: "Bulk products: copy",
  shipping_zones: "Delivery areas",
  store_builder_chat: "Store builder: chat",
  store_builder_brief: "Store builder: brief",
  store_builder_product: "Store builder: product copy",
  store_builder_site_copy: "Store builder: site copy",
  store_builder_shipping: "Store builder: shipping",
  store_builder_policies: "Store builder: policies",
  store_builder_review: "Store builder: final check",
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

/**
 * The one way Admin shows an AI cost: "$0.50 (~25 EGP)". The EGP is an estimate
 * at the market rate (F-58); with no rate, or a zero cost, it shows USD only.
 */
export function formatAiCost(micro: number, marketRate: number | null): string {
  const usd = formatMicroUsd(micro);
  if (!marketRate || micro === 0) return usd;
  const egp = (micro / 1_000_000) * marketRate;
  const digits = Math.abs(egp) < 10 ? 2 : 0;
  return `${usd} (~${egp.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })} EGP)`;
}

/** Average cost of a successful call, in whole micro-USD; null with no calls. */
export function averageCostMicro(costMicroUsd: number, calls: number): number | null {
  return calls > 0 ? Math.round(costMicroUsd / calls) : null;
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
