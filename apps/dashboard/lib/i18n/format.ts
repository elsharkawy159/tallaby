import {
  DEFAULT_CURRENCY,
  PRICE_SYMBOL_MARK,
  SAUDI_RIYAL_LABEL,
  STORE_CURRENCIES,
  currencyLabelText,
  formatPriceMarked,
  formatPricePlain,
  isCurrencyLabelFor,
  isStoreCurrency,
  type CurrencyLabel,
} from "@workspace/lib";
import { formatEgpApprox } from "@workspace/lib/billing";

// Dashboard-wide formatting. Arabic uses Western (latn) digits so numbers,
// SKUs, and order numbers read the same as what sellers type into inputs.
const intlLocale = (locale: string) => (locale.startsWith("ar") ? "ar-EG" : "en-EG");
const digits = (locale: string) =>
  locale.startsWith("ar") ? ({ numberingSystem: "latn" } as const) : {};

type DateInput = string | number | Date | null | undefined;

const toDate = (value: DateInput) => {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * What an amount is in: a store's currency and its label (parseStoreCurrency, on
 * the server page), or an order's currency column. Any part may be missing.
 */
export type MoneyUnit = { currency?: string | null; label?: unknown };

/** What every Arabic dashboard screen calls the pound (owner, 2026-11-05). */
const ARABIC_POUND: string = "جنيه";

/** Whether an amount reads "300 جنيه": Arabic, and in EGP. A missing currency means EGP. */
export function isArabicPound(locale: string, unit?: MoneyUnit) {
  return locale.startsWith("ar") && (unit?.currency || DEFAULT_CURRENCY) === DEFAULT_CURRENCY;
}

/**
 * The direction for an element holding one formatted amount. Amounts and codes stay
 * left to right; "300 جنيه" must not, or Arabic would read it with the word first.
 */
export function moneyDir(locale: string, unit?: MoneyUnit): "ltr" | undefined {
  return isArabicPound(locale, unit) ? undefined : "ltr";
}

/**
 * The label the dashboard writes beside an amount. Missing currency means EGP, and
 * EGP reads "جنيه" in Arabic and "EGP" in English, whatever the store shows its
 * customers. Another currency uses the store's label when given, else its default
 * (SAR: the symbol).
 */
export function moneyLabel(unit: MoneyUnit | undefined, locale: string): CurrencyLabel {
  const { currency, label } = unit ?? {};
  const code = currency || DEFAULT_CURRENCY;
  if (code === DEFAULT_CURRENCY) return isArabicPound(locale, unit) ? (ARABIC_POUND as CurrencyLabel) : DEFAULT_CURRENCY;
  // A code outside the list can only be shown as it is.
  if (!isStoreCurrency(code)) return code as CurrencyLabel;
  return isCurrencyLabelFor(code, label) ? label : STORE_CURRENCIES[code][0];
}

/**
 * An account-level amount when the seller's stores use different currencies. It
 * has no one currency, so it shows the number alone and never a guessed label.
 */
export const MIXED_CURRENCIES = "MIXED";

const toAmount = (value: string | number | null | undefined) => {
  const num = value == null ? 0 : typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(num) ? num : 0;
};

/**
 * Intl starts a negative Arabic number with a left-to-right mark, which would turn a
 * <bdi> holding "-500 جنيه" left to right, so the mark goes.
 */
const withoutBidiMark = (text: string, locale: string, unit?: MoneyUnit) =>
  isArabicPound(locale, unit) ? text.replace(/\u200e/g, "") : text;

/** An amount as plain text ("300 EGP", "300 جنيه"), for <option>, titles, toasts and push alerts. */
export function formatMoney(value: string | number | null | undefined, locale: string, unit?: MoneyUnit) {
  if (unit?.currency === MIXED_CURRENCIES) return formatNumber(toAmount(value), locale, { maximumFractionDigits: 2 });
  return withoutBidiMark(formatPricePlain(toAmount(value), locale, moneyLabel(unit, locale)), locale, unit);
}

/** `formatMoney` for the screen: SAR carries a mark that <MoneyText> draws as the symbol. Never an attribute or a title. */
export function formatMoneyMarked(value: string | number | null | undefined, locale: string, unit?: MoneyUnit) {
  if (unit?.currency === MIXED_CURRENCIES) return formatMoney(value, locale, unit);
  return withoutBidiMark(formatPriceMarked(toAmount(value), locale, moneyLabel(unit, locale)), locale, unit);
}

/** The unit alone as text, for a label. */
export function moneyUnitText(locale: string, unit?: MoneyUnit) {
  if (unit?.currency === MIXED_CURRENCIES) return locale.startsWith("ar") ? "عملة المتجر" : "store currency";
  return currencyLabelText(moneyLabel(unit, locale), locale);
}

/** The unit alone for a sentence drawn through <MoneyText>. */
export function moneyUnitMarked(locale: string, unit?: MoneyUnit) {
  if (unit?.currency === MIXED_CURRENCIES) return moneyUnitText(locale, unit);
  const label = moneyLabel(unit, locale);
  return label === SAUDI_RIYAL_LABEL ? PRICE_SYMBOL_MARK : currencyLabelText(label, locale);
}

/**
 * Message values for a string that names the currency: `unit` is the text label
 * and `code` lets Arabic keep its word for the pound with
 * "{code, select, EGP {جنيه} other {{unit}}}".
 */
export function moneyParams(locale: string, unit?: MoneyUnit) {
  return { code: unit?.currency || DEFAULT_CURRENCY, unit: moneyUnitText(locale, unit) };
}

/**
 * Totals per currency → the one a summary leads with and the rest. A store's own
 * currency leads when it is given (`preferred`), else EGP, else the first; with
 * no totals at all it is `fallback`, so an empty card still names the right unit.
 */
export function splitHeadline(
  totals: readonly { currency: string; total: number }[],
  { preferred, fallback }: { preferred?: string | null; fallback?: string | null } = {},
): { currency: string; total: number; others: { currency: string; total: number }[] } {
  const lead =
    totals.find((t) => t.currency === preferred) ??
    totals.find((t) => t.currency === DEFAULT_CURRENCY) ??
    totals[0];
  return {
    currency: lead?.currency ?? preferred ?? fallback ?? DEFAULT_CURRENCY,
    total: lead?.total ?? 0,
    others: totals.filter((t) => t !== lead),
  };
}

/** Options for next-intl's `format.number` where a screen uses it for money. Intl has no "جنيه": check `isArabicPound` and use `formatMoney` for it. */
export function moneyNumberOptions(unit?: MoneyUnit) {
  if (unit?.currency === MIXED_CURRENCIES) return { maximumFractionDigits: 2 };
  return { style: "currency" as const, currency: unit?.currency || DEFAULT_CURRENCY };
}

/**
 * Adds amounts that may be in different currencies without ever mixing them: one
 * total per currency, EGP first, then by code. A missing currency counts as EGP.
 */
export function totalsByCurrency<T>(
  rows: readonly T[],
  read: (row: T) => { currency?: string | null; amount: string | number | null | undefined },
): { currency: string; total: number }[] {
  const minor = new Map<string, number>();
  for (const row of rows) {
    const { currency, amount } = read(row);
    const code = currency || DEFAULT_CURRENCY;
    minor.set(code, (minor.get(code) ?? 0) + Math.round(toAmount(amount) * 100));
  }
  return [...minor.entries()]
    .sort(([a], [b]) => (a === DEFAULT_CURRENCY ? -1 : b === DEFAULT_CURRENCY ? 1 : a.localeCompare(b)))
    .map(([currency, total]) => ({ currency, total: total / 100 }));
}

/**
 * A store-wallet amount. An EGP wallet shows it as it is. A USD wallet (0136) shows
 * it in EGP at the live `rate` with "≈" (owner, 2026-11-09: every price a seller
 * sees is in EGP); with no rate it falls back to the exact dollars, which is also
 * what a statement shows beside the EGP. Display only.
 */
export function formatWalletMoney(
  value: string | number | null | undefined,
  currency: string | null | undefined,
  locale: string,
  rate?: number | null,
) {
  if (currency !== "USD") return formatMoney(value, locale);
  const num = value == null ? 0 : Number(value);
  if (rate && rate > 0) return formatEgpApprox(Math.round((Number.isFinite(num) ? num : 0) * 100), rate, locale);
  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(Number.isFinite(num) ? num : 0));
  return `${num < 0 ? "-" : ""}$${amount}`;
}

/** `formatWalletMoney` with a "+" on a credit, kept inside the number: "≈ +269 EGP", "+277 جنيه". */
export function formatSignedWalletMoney(
  value: string | number | null | undefined,
  currency: string | null | undefined,
  locale: string,
  rate?: number | null,
) {
  const num = value == null ? 0 : Number(value);
  const text = formatWalletMoney(num, currency, locale, rate);
  if (!(num > 0)) return text;
  if (text.includes("\u2066")) return text.replace("\u2066", "\u2066+");
  if (text.startsWith("≈ ")) return text.replace("≈ ", "≈ +");
  return `+${text}`;
}

/** Whether `formatWalletMoney` shows this amount in EGP at a rate, so a statement adds the exact dollars beside it. */
export function isApproxWalletMoney(currency: string | null | undefined, rate?: number | null) {
  return currency === "USD" && Boolean(rate && rate > 0);
}

/** The direction for an element holding `formatWalletMoney`'s text: an amount shown in EGP reads like EGP. */
export function walletMoneyDir(locale: string, currency: string | null | undefined, rate?: number | null) {
  return moneyDir(locale, { currency: currency === "USD" && !(rate && rate > 0) ? "USD" : DEFAULT_CURRENCY });
}

/** A USD price in cents as the seller sees it: "≈ 1.62 جنيه"; the exact dollars only when there is no rate yet. */
export function formatUsdPrice(usdCents: number, locale: string, rate: number | null | undefined) {
  return formatWalletMoney(usdCents / 100, "USD", locale, rate);
}

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat(intlLocale(locale), { ...options, ...digits(locale) }).format(value);
}

export function formatDate(
  value: DateInput,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), { ...options, ...digits(locale) }).format(date);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

/** "12 minutes ago" / "منذ 12 دقيقة", with the same digits as the rest of the dashboard. */
export function formatRelativeTime(value: DateInput, locale: string, now: Date = new Date()) {
  const date = toDate(value);
  if (!date) return "—";
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const [unit, size] =
    RELATIVE_UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? RELATIVE_UNITS[RELATIVE_UNITS.length - 1]!;
  // RelativeTimeFormat takes the numbering system via the locale tag.
  const tag = locale.startsWith("ar") ? `${intlLocale(locale)}-u-nu-latn` : intlLocale(locale);
  return new Intl.RelativeTimeFormat(tag, { numeric: "auto" }).format(
    Math.round(seconds / size),
    unit
  );
}

/** Short number for chart axes: 1.2K / 1.2 ألف. */
export function formatCompactNumber(value: number, locale: string) {
  return formatNumber(value, locale, { notation: "compact", maximumFractionDigits: 1 });
}

export function formatDateTime(value: DateInput, locale: string) {
  return formatDate(value, locale, { dateStyle: "medium", timeStyle: "short" });
}
