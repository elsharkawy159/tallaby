/**
 * Prices and money maths for the USD store wallet, plans and AI credits
 * (ROADMAP.md F-55, F-56, F-57). Pure and integer-based: US cents, piastres,
 * and rates in 1/10000 of an EGP, so no float ever touches a balance.
 */

export const FREE_ORDER_FEE_USD_CENTS = 3;
export const PRO_MONTHLY_USD_CENTS = 2900;
export const CREDIT_PACK_CREDITS = 100;
export const CREDIT_PACK_USD_CENTS = 100;
/** Extra campaign emails from the wallet (owner, 2026-11-04). */
export const EMAIL_PACK_EMAILS = 1000;
export const EMAIL_PACK_USD_CENTS = 150;
export const TOP_UP_MIN_USD_CENTS = 500;
export const TOP_UP_MAX_USD_CENTS = 100_000;
/** Days a Pro seller keeps Pro after a renewal the wallet couldn't pay. */
export const PLAN_GRACE_DAYS = 3;

export type BillingState = {
  usdLive: boolean;
  /** EGP per USD: the Admin override, else the latest fetch. Null before the first fetch. */
  marketRate: number | null;
  taxEnabled: boolean;
  taxRateBps: number;
  /** When the latest market rate was fetched. */
  rateFetchedAt: string | null;
};

const rateUnits = (rate: number) => Math.round(rate * 10_000);

/** US cents at this rate, in piastres. Rounds up, so a fee estimate never falls short. */
export function usdCentsToPiastres(usdCents: number, rate: number): number {
  return Math.ceil((usdCents * rateUnits(rate)) / 10_000);
}

/** Piastres at this rate, in US cents, rounded to the nearest cent. */
export function piastresToUsdCents(piastres: number, rate: number): number {
  return Math.round((piastres * 10_000) / rateUnits(rate));
}

export type TopUpQuote = {
  usdCents: number;
  rate: number;
  /** The EGP the top-up is worth, before tax. */
  basePiastres: number;
  taxPiastres: number;
  /** What the seller pays. */
  totalPiastres: number;
};

/** Down to a whole pound: 1471.57 EGP is 1471 EGP (owner, 2026-11-04). */
const wholePounds = (piastres: number) => Math.floor(piastres / 100) * 100;

/** A top-up at the market rate, no margin (owner, 2026-11-04). Every EGP amount is whole pounds. */
export function quoteTopUp(
  usdCents: number,
  state: Pick<BillingState, "marketRate" | "taxEnabled" | "taxRateBps">,
): TopUpQuote | null {
  if (!state.marketRate) return null;
  const rate = state.marketRate;
  const basePiastres = wholePounds(usdCentsToPiastres(usdCents, rate));
  const taxPiastres = state.taxEnabled ? wholePounds((basePiastres * state.taxRateBps) / 10_000) : 0;
  return { usdCents, rate, basePiastres, taxPiastres, totalPiastres: basePiastres + taxPiastres };
}

/**
 * A USD amount in whole EGP for display, the way /wallet's top-up quote prices it
 * (`quoteTopUp`, before tax): rounded up to the piastre, then down to a whole
 * pound. Under a dollar (the $0.03 order fee) whole pounds would hide the amount,
 * so it keeps the piastres. Display only: nothing is charged from this figure.
 */
export function usdCentsToApproxEgp(usdCents: number, rate: number): number {
  const cents = Math.abs(Math.round(usdCents));
  const piastres = usdCentsToPiastres(cents, rate);
  const egp = cents < 100 ? piastres / 100 : Math.floor(piastres / 100);
  return usdCents < 0 && egp !== 0 ? -egp : egp;
}

/**
 * Every price a seller sees is in EGP (owner, 2026-11-09, for Paymob): a USD
 * amount at the live rate, with "≈" in front. "≈ 1.62 جنيه", "≈ 1,563 EGP".
 * Latin digits, en-US grouping, 2 decimals under a dollar. In Arabic only the
 * number sits in a left-to-right isolate, so a minus or a decimal never flips
 * and "≈" stays to the right of the number. Zero is "0 جنيه", with no "≈".
 */
export function formatEgpApprox(usdCents: number, rate: number, locale: string): string {
  const egp = usdCentsToApproxEgp(usdCents, rate);
  const small = Math.abs(Math.round(usdCents)) < 100 && egp !== 0;
  const number = egp.toLocaleString("en-US", { minimumFractionDigits: small ? 2 : 0, maximumFractionDigits: small ? 2 : 0 });
  const approx = egp === 0 ? "" : "≈ ";
  return locale.startsWith("ar") ? `${approx}\u2066${number}\u2069 جنيه` : `${approx}${number} EGP`;
}

export type UsdAmountResult =
  | { success: true; usdCents: number }
  | { success: false; error: "invalid" | "too_small" | "too_large" };

/** A seller-entered USD top-up amount, up to 2 decimals. */
export function parseUsdTopUp(raw: unknown): UsdAmountResult {
  const text = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim().replace(",", ".") : "";
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(text)) return { success: false, error: "invalid" };
  const usdCents = Math.round(Number(text) * 100);
  if (usdCents < TOP_UP_MIN_USD_CENTS) return { success: false, error: "too_small" };
  if (usdCents > TOP_UP_MAX_USD_CENTS) return { success: false, error: "too_large" };
  return { success: true, usdCents };
}

/** Integer minor units as the 2-decimal string the ledger stores. */
export function minorToAmount(minor: number): string {
  return (minor / 100).toFixed(2);
}

/** Sanity range for a fetched or typed EGP-per-USD rate. */
/**
 * Where the market rate comes from. With a key: ExchangeRate-API's keyed endpoint.
 * Without one: its open endpoint, whose terms require a visible attribution link.
 */
export function exchangeRateSource(apiKey?: string): { url: string; source: string } {
  const key = apiKey?.trim();
  return key
    ? { url: `https://v6.exchangerate-api.com/v6/${encodeURIComponent(key)}/latest/USD`, source: "exchangerate-api.com" }
    : { url: "https://open.er-api.com/v6/latest/USD", source: "open.er-api.com" };
}

/** EGP per USD from either endpoint's response, or null if it isn't a usable answer. */
export function egpRateFromResponse(body: unknown): number | null {
  const data = body as { result?: string; rates?: { EGP?: unknown }; conversion_rates?: { EGP?: unknown } } | null;
  const rate = Number(data?.conversion_rates?.EGP ?? data?.rates?.EGP);
  return data?.result === "success" && isPlausibleRate(rate) ? rate : null;
}

/**
 * USD→X rates for the given ISO codes from either endpoint's response (both
 * list every currency), keeping only the ones that pass a loose sanity check
 * (finite, 0.1 to 100,000 per dollar: KWD ≈ 0.3, IQD ≈ 1,300). An unusable
 * answer gives {}. For tallaby.com's local-currency prices only; the billing
 * rate stays `egpRateFromResponse`.
 */
export function usdRatesFromResponse(body: unknown, codes: readonly string[]): Record<string, number> {
  const data = body as { result?: string; rates?: unknown; conversion_rates?: unknown } | null;
  if (data?.result !== "success") return {};
  const table = (data.conversion_rates ?? data.rates) as Record<string, unknown> | null | undefined;
  if (!table || typeof table !== "object") return {};
  const out: Record<string, number> = {};
  for (const code of codes) {
    const value = table[code];
    const rate = typeof value === "number" || typeof value === "string" ? Number(value) : Number.NaN;
    if (Number.isFinite(rate) && rate >= 0.1 && rate <= 100_000) out[code] = rate;
  }
  return out;
}

export function isPlausibleRate(rate: number): boolean {
  return Number.isFinite(rate) && rate >= 10 && rate <= 500;
}

/** Cairo calendar month, e.g. "2026-11": when Free credits reset. */
export function cairoMonthKey(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit" }).format(at);
  return parts.slice(0, 7);
}

export type PlanDates = {
  plan?: string | null;
  planExpiresAt?: string | Date | null;
  planGraceUntil?: string | Date | null;
};

/**
 * Whether Pro applies right now. The dates decide, not only the column, so a
 * lapsed seller stops counting as Pro even before the renewal job runs. No end
 * date means Pro never lapses (an open-ended Admin grant).
 */
export function isProActive(seller: PlanDates, at: Date = new Date()): boolean {
  if (seller.plan !== "pro") return false;
  const ends = [seller.planExpiresAt, seller.planGraceUntil]
    .filter((value) => value != null)
    .map((value) => new Date(value as string | Date).getTime());
  if (ends.length === 0) return true;
  return Math.max(...ends) > at.getTime();
}

/** One calendar month after a date, keeping the end of the month sensible. */
export function addOneMonth(from: Date): Date {
  const next = new Date(from);
  const day = next.getUTCDate();
  next.setUTCMonth(next.getUTCMonth() + 1);
  if (next.getUTCDate() !== day) next.setUTCDate(0);
  return next;
}
