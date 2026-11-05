import {
  CREDIT_PACK_CREDITS,
  CREDIT_PACK_USD_CENTS,
  EMAIL_PACK_EMAILS,
  EMAIL_PACK_USD_CENTS,
  FREE_ORDER_FEE_USD_CENTS,
  PRO_MONTHLY_USD_CENTS,
  TOP_UP_MAX_USD_CENTS,
  TOP_UP_MIN_USD_CENTS,
} from "@workspace/lib/billing";
import { PLANS } from "@workspace/lib/plans";

/**
 * Marketing-site price maths. Every number comes from the billing and plans
 * modules; this file only powers what the pages show. What sellers are charged
 * is computed in `@workspace/lib/orders/platform-fee` and `billing`.
 */

/** Only for the "≈" EGP figures on the site. Top-ups use the live rate at the time. */
export const APPROX_EGP_PER_USD = 50;

export const PLAN_PRICES = {
  free: { orderFeeCents: FREE_ORDER_FEE_USD_CENTS, aiCredits: PLANS.free.aiCreditsMonthly, emails: PLANS.free.emailsMonthly },
  pro: { monthlyCents: PRO_MONTHLY_USD_CENTS, aiCredits: PLANS.pro.aiCreditsMonthly, emails: PLANS.pro.emailsMonthly },
  emailPack: { emails: EMAIL_PACK_EMAILS, cents: EMAIL_PACK_USD_CENTS },
  creditPack: { credits: CREDIT_PACK_CREDITS, cents: CREDIT_PACK_USD_CENTS },
  topUp: { minCents: TOP_UP_MIN_USD_CENTS, maxCents: TOP_UP_MAX_USD_CENTS },
} as const;

/** $0.03, $29, $1.50, $1,000: cents only when there are any. */
export function formatUsd(cents: number): string {
  const whole = cents % 100 === 0;
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** Orders a month from which Pro costs less than Free's order fees. */
export function proBreakEvenOrders(): number {
  return Math.ceil(PRO_MONTHLY_USD_CENTS / FREE_ORDER_FEE_USD_CENTS);
}

/** What a campaign-email volume costs beyond the plan's allowance. Extra emails come in whole packs. */
export function extraEmailsCents(emails: number, allowance: number): number {
  const extra = Math.max(0, emails - allowance);
  return Math.ceil(extra / EMAIL_PACK_EMAILS) * EMAIL_PACK_USD_CENTS;
}

export type PlanEstimateInput = { orders: number; emails: number };

export type PlanEstimate = {
  freeCents: number;
  proCents: number;
  cheaper: "free" | "pro" | "same";
  /** The monthly difference between the two, always positive or zero. */
  savingCents: number;
};

/** A month on each plan, before any apps: app prices live in the dashboard. */
export function estimatePlans({ orders, emails }: PlanEstimateInput): PlanEstimate {
  const count = Math.max(0, Math.floor(orders));
  const freeCents = count * FREE_ORDER_FEE_USD_CENTS + extraEmailsCents(emails, PLANS.free.emailsMonthly);
  const proCents = PRO_MONTHLY_USD_CENTS + extraEmailsCents(emails, PLANS.pro.emailsMonthly);
  return {
    freeCents,
    proCents,
    cheaper: freeCents === proCents ? "same" : freeCents < proCents ? "free" : "pro",
    savingCents: Math.abs(freeCents - proCents),
  };
}

/** The old flat fee. Only the blog's price calculator below still uses it. */
export const FLAT_FEE_EGP = 5;

export function orderFee(orderValue: number): number {
  return orderValue > 0 ? FLAT_FEE_EGP : 0;
}

/**
 * Suggested retail price from the blog calculator: cost plus margin plus the
 * fee, rounded up to the next price ending in 9 (437 → 439, 440 → 449).
 */
export function suggestedPrice(input: { unitCost: number; packaging: number; shipping: number; marginPct: number }) {
  const clamp = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);
  const cost = clamp(input.unitCost) + clamp(input.packaging) + clamp(input.shipping);
  const beforeFee = cost * (1 + clamp(input.marginPct) / 100);
  let price = Math.ceil((beforeFee + FLAT_FEE_EGP) / 10) * 10 - 1;
  if (price < 1) price = 0;
  const fee = orderFee(price);
  return { price, cost, fee, profit: price - cost - fee };
}

export const formatNumber = (n: number) => Math.round(n).toLocaleString("en-US");
