import { FREE_ORDER_FEE_USD_CENTS } from "@workspace/lib/billing";

/**
 * The /tools/profit-margin-calculator maths. Pure, and in integer piastres so a
 * result never shows float noise. Money stays in EGP because orders and prices do;
 * the plan's order fee is in USD, so it's converted at the live rate the page passes in.
 */

export type MarginPlan = "free" | "pro";

/** The margin the suggested price aims for. */
export const TARGET_MARGIN = 0.3;

/**
 * The rate in `DEFAULT_MARGIN_INPUT` (tests and the fallback); the page uses the
 * live rate. Only an input for this sum, never the rate a seller is charged.
 */
export const DEFAULT_EGP_PER_USD = 50;

export type MarginInput = {
  /** Cost of one unit. */
  buy: number;
  /** The shipping the seller pays, not what the customer pays. */
  ship: number;
  /** Ad spend divided by orders. */
  ad: number;
  plan: MarginPlan;
  egpPerUsd: number;
  sell: number;
};

export const DEFAULT_MARGIN_INPUT: MarginInput = {
  buy: 200,
  ship: 45,
  ad: 60,
  plan: "free",
  egpPerUsd: DEFAULT_EGP_PER_USD,
  sell: 450,
};

export type MarginStatus = "needs-price" | "loss" | "low" | "good";

export type MarginResult = {
  /** Tallaby's fee on this order in EGP: nothing on Pro, which is paid by the month. */
  fee: number;
  cost: number;
  profit: number;
  /** Percent of the selling price; null with no selling price. */
  marginPct: number | null;
  /** Whole-pound price that reaches TARGET_MARGIN; null with no costs. */
  suggestedPrice: number | null;
  /** Whole-pound price that covers the costs. */
  breakEvenPrice: number;
  status: MarginStatus;
};

const toPiastres = (egp: number) => Math.round((Number.isFinite(egp) ? Math.max(0, egp) : 0) * 100);
const toEgp = (piastres: number) => piastres / 100;

/** A typed amount: Arabic or Latin digits, either decimal mark. Anything unusable is 0. */
export function parseAmount(raw: string | number): number {
  const latin = String(raw)
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[٫,]/g, ".")
    .replace(/[^\d.]/g, "");
  const value = Number.parseFloat(latin);
  return Number.isFinite(value) ? value : 0;
}

/** The order fee in EGP: cents × rate, rounded up to the piastre like a top-up quote. */
export function planFeeEgp(plan: MarginPlan, egpPerUsd: number): number {
  if (plan === "pro") return 0;
  const rate = Number.isFinite(egpPerUsd) ? Math.max(0, egpPerUsd) : 0;
  return toEgp(Math.ceil(FREE_ORDER_FEE_USD_CENTS * rate));
}

export function calculateMargin(input: MarginInput): MarginResult {
  const fee = toPiastres(planFeeEgp(input.plan, input.egpPerUsd));
  const sell = toPiastres(input.sell);
  const cost = toPiastres(input.buy) + toPiastres(input.ship) + toPiastres(input.ad) + fee;
  const profit = sell - cost;
  const marginPct = sell > 0 ? (profit / sell) * 100 : null;

  let status: MarginStatus = "good";
  if (sell === 0) status = "needs-price";
  else if (profit < 0) status = "loss";
  else if ((marginPct ?? 0) < TARGET_MARGIN * 100) status = "low";

  return {
    fee: toEgp(fee),
    cost: toEgp(cost),
    profit: toEgp(profit),
    marginPct,
    suggestedPrice: cost > 0 ? Math.ceil(toEgp(cost) / (1 - TARGET_MARGIN)) : null,
    breakEvenPrice: Math.ceil(toEgp(cost)),
    status,
  };
}

/** Markup over cost, for the worked example's "margin vs markup" answer. */
export function markupPct(profit: number, cost: number): number {
  return cost > 0 ? (profit / cost) * 100 : 0;
}

export type MarginSegment = { id: "buy" | "ship" | "ad" | "fee" | "profit"; pct: number };

/** The bar under the results: each cost and the profit, as a share of the larger of price and cost. */
export function marginSegments(input: MarginInput, result: MarginResult): MarginSegment[] {
  const base = Math.max(input.sell, result.cost) || 1;
  const share = (value: number) => (Math.max(0, value) / base) * 100;
  const parts: MarginSegment[] = [
    { id: "buy", pct: share(input.buy) },
    { id: "ship", pct: share(input.ship) },
    { id: "ad", pct: share(input.ad) },
    { id: "fee", pct: share(result.fee) },
  ];
  if (result.profit > 0) parts.push({ id: "profit", pct: share(result.profit) });
  return parts.filter((part) => part.pct > 0);
}
