import { FREE_ORDER_FEE_USD_CENTS, PRO_MONTHLY_USD_CENTS } from "@workspace/lib/billing";
import { DEFAULT_EGP_PER_USD, parseAmount } from "./margin-calculator.lib";
import { proBreakEvenOrders } from "./pricing.lib";

/**
 * The /tools/store-cost-calculator maths: a month on Tallaby's Free and Pro
 * plans from the seller's own numbers. Pure, in integer piastres. Tallaby's
 * prices come from the billing module (USD) at the live rate the page passes
 * in; the gateway's rate and the domain price are the seller's to type, since
 * Tallaby doesn't set them. Shipping is left out: the customer usually pays it,
 * and it's the same on both plans.
 */

export { parseAmount };

export type StoreCostInput = {
  /** Orders a month. */
  orders: number;
  /** Average order value in EGP. */
  averageOrder: number;
  /** Share of orders paid by card, 0–100 (the rest is cash on delivery). */
  cardShare: number;
  /** The gateway's percentage on a card payment (Paymob or Kashier sets it). */
  gatewayPct: number;
  /** The gateway's fixed EGP amount per card payment, if any. */
  gatewayFixed: number;
  /** What the seller pays a registrar for a domain each year; 0 = the free tallaby.com link. */
  domainYearly: number;
  egpPerUsd: number;
};

export const DEFAULT_STORE_COST_INPUT: StoreCostInput = {
  orders: 300,
  averageOrder: 450,
  cardShare: 20,
  gatewayPct: 3,
  gatewayFixed: 0,
  domainYearly: 0,
  egpPerUsd: DEFAULT_EGP_PER_USD,
};

/** Every amount in EGP (two decimals at most). */
export type PlanCost = { platform: number; gateway: number; domain: number; total: number; perOrder: number };

export type StoreCostResult = {
  free: PlanCost;
  pro: PlanCost;
  cheaper: "free" | "pro" | "same";
  /** The monthly difference in EGP, never negative. */
  saving: number;
  /** Orders a month from which Pro costs less (the same at any rate). */
  breakEvenOrders: number;
  /** Card orders this month, rounded to whole orders. */
  cardOrders: number;
};

const clamp = (value: number, min: number, max = Number.POSITIVE_INFINITY) => (Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min);
const toPiastres = (egp: number) => Math.round(clamp(egp, 0) * 100);
const toEgp = (piastres: number) => piastres / 100;
/** USD cents to piastres, rounded up like a top-up quote. */
const usdToPiastres = (cents: number, rate: number) => Math.ceil(cents * clamp(rate, 0));

export function calculateStoreCost(input: StoreCostInput): StoreCostResult {
  const orders = Math.floor(clamp(input.orders, 0));
  const cardOrders = Math.round((orders * clamp(input.cardShare, 0, 100)) / 100);
  const perPayment = Math.round((toPiastres(input.averageOrder) * clamp(input.gatewayPct, 0, 100)) / 100) + toPiastres(input.gatewayFixed);
  const gateway = cardOrders * perPayment;
  const domain = Math.ceil(toPiastres(input.domainYearly) / 12);

  const plan = (platform: number): PlanCost => {
    const total = platform + gateway + domain;
    return {
      platform: toEgp(platform),
      gateway: toEgp(gateway),
      domain: toEgp(domain),
      total: toEgp(total),
      perOrder: orders > 0 ? toEgp(Math.round(total / orders)) : 0,
    };
  };

  // The wallet is charged in USD cents ($0.03 an order on Free, $29 a month on Pro), so the plans are compared in cents and shown in EGP.
  const freeCents = orders * FREE_ORDER_FEE_USD_CENTS;
  const freePlatform = usdToPiastres(freeCents, input.egpPerUsd);
  const proPlatform = usdToPiastres(PRO_MONTHLY_USD_CENTS, input.egpPerUsd);
  const free = plan(freePlatform);
  const pro = plan(proPlatform);

  return {
    free,
    pro,
    cheaper: freeCents === PRO_MONTHLY_USD_CENTS ? "same" : freeCents < PRO_MONTHLY_USD_CENTS ? "free" : "pro",
    saving: toEgp(Math.abs(freePlatform - proPlatform)),
    breakEvenOrders: proBreakEvenOrders(),
    cardOrders,
  };
}
