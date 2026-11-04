import { FREE_ORDER_FEE_USD_CENTS, TOP_UP_MAX_USD_CENTS, TOP_UP_MIN_USD_CENTS } from "@workspace/lib/billing";
import { STANDARD_FEE_MIN_PIASTRES } from "@workspace/lib/orders/platform-fee";
import { STORE_TOP_UP_MAX_PIASTRES, STORE_TOP_UP_MIN_EGP } from "@workspace/lib/store-wallet";
import { formatWalletMoney } from "@/lib/i18n/format";

/** The flat platform fee per delivered order, in EGP (PLAN.md §13). */
export const FEE_PER_ORDER_EGP = STANDARD_FEE_MIN_PIASTRES / 100;

export const TOP_UP_MAX_EGP = STORE_TOP_UP_MAX_PIASTRES / 100;

/** What /wallet calls the pound: "جنيه" in Arabic, "EGP" in English (owner, 2026-11-04). */
export const walletPoundLabel = (locale: string) => (locale.startsWith("ar") ? "جنيه" : "EGP");

/**
 * An amount on /wallet: formatWalletMoney with walletPoundLabel. Show it in a <bdi> with no dir, so
 * Arabic reads "277 جنيه" right to left. Intl starts a negative Arabic number with a left-to-right
 * mark, which would turn that <bdi> left to right, so the mark goes.
 */
export function walletMoney(value: string | number | null | undefined, currency: string | null | undefined, locale: string) {
  const text = formatWalletMoney(value, currency, locale);
  if (currency === "USD" || !locale.startsWith("ar")) return text;
  return text.replace(/\u200e/g, "").replace(/EGP$/, walletPoundLabel(locale));
}

/** The amounts offered as one-tap choices; 500 is marked as the most chosen. */
export const TOP_UP_PRESETS = [100, 250, 500, 1000, 2000] as const;
export const POPULAR_TOP_UP = 500;

/** The +/- buttons beside the amount field move by this much (EGP). */
export const TOP_UP_STEP_EGP = 50;

/** USD wallet (0136): one-tap top-ups in dollars, and the +/- step. */
export const TOP_UP_PRESETS_USD = [5, 10, 20, 50, 100, 200, 500, 1000] as const;
export const POPULAR_TOP_UP_USD = 10;
/** The card already chosen when the page opens. */
export const DEFAULT_TOP_UP_USD = 5;
export const TOP_UP_STEP_USD = 5;
export const FEE_PER_ORDER_USD = FREE_ORDER_FEE_USD_CENTS / 100;

/** How many orders an amount covers at the flat fee (none for zero or less). */
export function ordersCovered(amount: number, currency: string = "EGP"): number {
  if (amount <= 0) return 0;
  return currency === "USD"
    ? Math.floor((Math.round(amount * 100)) / FREE_ORDER_FEE_USD_CENTS)
    : Math.floor(amount / FEE_PER_ORDER_EGP);
}

/** The amount after a +/- tap on a USD top-up, kept within the limits. */
export function stepUsdTopUp(current: number, delta: number): number {
  return Math.min(TOP_UP_MAX_USD_CENTS / 100, Math.max(TOP_UP_MIN_USD_CENTS / 100, (current || 0) + delta));
}

/** The amount after a +/- tap, kept within the top-up limits. */
export function stepTopUpAmount(current: number, delta: number): number {
  return Math.min(TOP_UP_MAX_EGP, Math.max(STORE_TOP_UP_MIN_EGP, (current || 0) + delta));
}
