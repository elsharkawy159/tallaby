import { minorToAmount } from "./billing.lib";

/**
 * How a store app is priced and what each charge claims (ROADMAP.md F-47;
 * docs/superpowers/specs/2026-11-03-apps-marketplace-design.md). Pure and
 * integer-based: all prices are US cents. A new model adds a member to the
 * union, and the switch below stops compiling until it handles it.
 */

export const APP_USAGE_UNITS = ["action", "minute", "hour", "day"] as const;
export type AppUsageUnit = (typeof APP_USAGE_UNITS)[number];

export type AppPricing =
  | { model: "free" }
  | { model: "one_time"; usdCents: number }
  | { model: "monthly"; usdCents: number }
  | { model: "per_order"; usdCents: number }
  | { model: "usage"; usdCents: number; unit: AppUsageUnit };

export type AppPricingModel = AppPricing["model"];
export type PaidAppPricing = Exclude<AppPricing, { model: "free" }>;

/** The most one usage event may bill at once, as a guard against a caller's bad quantity. */
export const MAX_APP_USAGE_QUANTITY = 10_000;
/** Usage event ids are the caller's; they end up in the ledger's claim. */
const USAGE_EVENT_ID_RE = /^[\w.:-]{1,120}$/;

export function isPaidAppPricing(pricing: AppPricing): pricing is PaidAppPricing {
  return pricing.model !== "free";
}

export function isValidAppPricing(pricing: AppPricing): boolean {
  if (!isPaidAppPricing(pricing)) return true;
  if (!Number.isInteger(pricing.usdCents) || pricing.usdCents <= 0) return false;
  return pricing.model !== "usage" || APP_USAGE_UNITS.includes(pricing.unit);
}

/** Whether a usage event's id and quantity may be billed. */
export function isValidAppUsageEvent(eventId: string, quantity: number): boolean {
  return USAGE_EVENT_ID_RE.test(eventId) && Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_APP_USAGE_QUANTITY;
}

/** The signed ledger amount for a charge, as the 2-decimal string the wallet takes. */
export function appChargeAmount(usdCents: number, quantity = 1): string {
  return `-${minorToAmount(usdCents * quantity)}`;
}

/** What one charge is for; its claim makes it happen once. */
export type AppCharge =
  | { model: "one_time" }
  | { model: "monthly"; periodStart: Date }
  | { model: "per_order"; orderId: string }
  | { model: "usage"; eventId: string };

/**
 * The wallet claim (`reference_id`) for a charge. It keys on store and app, not
 * the install row, so reinstalling can't charge a bought app or a billed order twice.
 */
export function appChargeReference(storeId: string, appKey: string, charge: AppCharge): string {
  const base = `${storeId}:${appKey}`;
  switch (charge.model) {
    case "one_time":
      return base;
    case "monthly":
      return `${base}:${charge.periodStart.toISOString()}`;
    case "per_order":
      return `${base}:order:${charge.orderId}`;
    case "usage":
      return `${base}:usage:${charge.eventId}`;
  }
}
