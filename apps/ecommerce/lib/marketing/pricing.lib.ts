import {
  CREDIT_PACK_CREDITS,
  formatEgpApprox,
  CREDIT_PACK_USD_CENTS,
  EMAIL_PACK_EMAILS,
  EMAIL_PACK_USD_CENTS,
  FREE_ORDER_FEE_USD_CENTS,
  PRO_MONTHLY_USD_CENTS,
  TOP_UP_MAX_USD_CENTS,
  TOP_UP_MIN_USD_CENTS,
  usdCentsToPiastres,
} from "@workspace/lib/billing";
import { ORDER_GRACE_DAYS } from "@workspace/lib/billing/order-grace";
import { PLANS } from "@workspace/lib/plans";

/**
 * Marketing-site price maths. Every number comes from the billing and plans
 * modules; this file only powers what the pages show. What sellers are charged
 * is computed in `@workspace/lib/orders/platform-fee` and `billing`.
 */

/**
 * Only when the live rate can't be read: the site's "≈" EGP figures use the
 * dashboard's rate (`getMarketingEgpPerUsd`). Top-ups use the live rate at the time.
 */
export const FALLBACK_EGP_PER_USD = 50;

/**
 * A USD amount in EGP the way the dashboard's /wallet shows it (`quoteTopUp`):
 * converted with the rate in 1/10000 EGP, rounded up to the piastre, then down
 * to a whole pound. Under a dollar (the $0.03 order fee) whole pounds would
 * hide the amount, so it keeps the piastres.
 */
export function usdCentsToEgp(usdCents: number, rate: number): number {
  const piastres = usdCentsToPiastres(Math.max(0, usdCents), rate);
  return usdCents < 100 ? piastres / 100 : Math.floor(piastres / 100);
}

/** "1.5", "1,445", "49.85": Latin digits, up to 2 decimals, like /wallet. */
export const formatEgp = (egp: number) => egp.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const PLAN_PRICES = {
  free: { orderFeeCents: FREE_ORDER_FEE_USD_CENTS, aiCredits: PLANS.free.aiCreditsMonthly, emails: PLANS.free.emailsMonthly },
  pro: { monthlyCents: PRO_MONTHLY_USD_CENTS, aiCredits: PLANS.pro.aiCreditsMonthly, emails: PLANS.pro.emailsMonthly },
  emailPack: { emails: EMAIL_PACK_EMAILS, cents: EMAIL_PACK_USD_CENTS },
  creditPack: { credits: CREDIT_PACK_CREDITS, cents: CREDIT_PACK_USD_CENTS },
  topUp: { minCents: TOP_UP_MIN_USD_CENTS, maxCents: TOP_UP_MAX_USD_CENTS },
} as const;

/** Bidi isolates (around prices in Arabic) belong on the page, not in meta descriptions or JSON-LD. */
export const stripBidiIsolates = (text: string) => text.replace(/[\u2066-\u2069]/g, "");

/** Competitors' list prices as we checked them (USD cents), for the comparison pages. */
export const COMPETITOR_PRICES = {
  easyOrdersOrderFeeCents: 4,
  easyOrdersProCents: 10_000,
  shopifyMinCents: 500,
  shopifyMaxCents: 39_900,
} as const;

/** The ICU values every tallaby.com string with a price takes: `{orderFee}`, `{pro}`, `{topUpMin}`, … */
export type MarketingPriceVars = {
  orderFee: string;
  pro: string;
  topUpMin: string;
  topUpMax: string;
  eoOrderFee: string;
  eoPro: string;
  shopifyMin: string;
  shopifyMax: string;
  /** Not a price: the days a Free seller has for a first top-up before new orders hide (F-84, `ORDER_GRACE_DAYS`). */
  days: string;
};

/**
 * Non-price values the copy can use, filled wherever price tokens are:
 * `{days}` is the grace window (`ORDER_GRACE_DAYS`), never written in the copy.
 */
export const COPY_VARS = { days: String(ORDER_GRACE_DAYS) } as const;

/** The names of the price tokens copy can use. */
export const PRICE_NAMES = ["orderFee", "pro", "topUpMin", "topUpMax", "eoOrderFee", "eoPro", "shopifyMin", "shopifyMax"] as const satisfies readonly (keyof MarketingPriceVars)[];
export type PriceName = (typeof PRICE_NAMES)[number];

/** Every price token, each formatted by `format` (USD cents in). */
export function priceVarsWith(format: (usdCents: number) => string): MarketingPriceVars {
  return {
    orderFee: format(FREE_ORDER_FEE_USD_CENTS),
    pro: format(PRO_MONTHLY_USD_CENTS),
    topUpMin: format(TOP_UP_MIN_USD_CENTS),
    topUpMax: format(TOP_UP_MAX_USD_CENTS),
    eoOrderFee: format(COMPETITOR_PRICES.easyOrdersOrderFeeCents),
    eoPro: format(COMPETITOR_PRICES.easyOrdersProCents),
    shopifyMin: format(COMPETITOR_PRICES.shopifyMinCents),
    shopifyMax: format(COMPETITOR_PRICES.shopifyMaxCents),
    ...COPY_VARS,
  };
}

/**
 * The price tokens in EGP ("≈ 1.62 جنيه" / "≈ 1.62 EGP", `formatEgpApprox` from
 * the billing module, as in the dashboard). For metadata, JSON-LD and the EGP
 * calculators; visible copy follows the visitor's currency (`VisitorPricesProvider`).
 * `isolate: false` drops the bidi isolates for meta descriptions and structured data.
 */
export function marketingPriceVars(rate: number, locale: string, { isolate = true }: { isolate?: boolean } = {}): MarketingPriceVars {
  return priceVarsWith((cents) => {
    const text = formatEgpApprox(cents, rate, locale);
    return isolate ? text : stripBidiIsolates(text);
  });
}

/** Each token as itself: pass to `t()` so the formatted string keeps `{orderFee}` for `withPrices` to fill on the page. */
export const PRICE_TOKENS: MarketingPriceVars = {
  ...(Object.fromEntries(PRICE_NAMES.map((name) => [name, `{${name}}`])) as Omit<MarketingPriceVars, "days">),
  // `{days}` is not a price: filled with its value right away.
  ...COPY_VARS,
};

/** Fills `{orderFee}`-style tokens in a string read with `t.raw` (FAQ arrays and the like), and `{days}` (`COPY_VARS`) always; unknown tokens stay. */
export function fillPriceTokens(text: string, values: Record<string, string>): string {
  const copy: Record<string, string> = COPY_VARS;
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? copy[key] ?? match);
}

/** Fills only the non-price tokens (`{days}`), leaving price tokens for `withPrices`. */
export function fillCopyTokens(text: string): string {
  return fillPriceTokens(text, {});
}

/** $0.03, $29, $1.50, $1,000: cents only when there are any. Internal maths and tests only, never shown (owner, 2026-11-09). */
export function formatUsd(cents: number): string {
  const whole = cents % 100 === 0;
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** Orders a month from which Pro costs less than Free's order fees. */
export function proBreakEvenOrders(): number {
  return Math.ceil(PRO_MONTHLY_USD_CENTS / FREE_ORDER_FEE_USD_CENTS);
}

/** The break-even as marketing copy shows it: rounded up to a clean hundred (967 → 1,000). */
export function proBreakEvenOrdersShown(): number {
  return Math.ceil(proBreakEvenOrders() / 100) * 100;
}

export type PlanEstimateInput = { orders: number };

export type PlanEstimate = {
  freeCents: number;
  proCents: number;
  cheaper: "free" | "pro" | "same";
  /** The monthly difference between the two, always positive or zero. */
  savingCents: number;
};

/** A month on each plan from the orders alone, before any apps or extra packs: those prices live in the dashboard. */
export function estimatePlans({ orders }: PlanEstimateInput): PlanEstimate {
  const count = Math.max(0, Math.floor(orders));
  const freeCents = count * FREE_ORDER_FEE_USD_CENTS;
  const proCents = PRO_MONTHLY_USD_CENTS;
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
