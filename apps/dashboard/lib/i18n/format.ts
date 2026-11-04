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

/**
 * The label the dashboard writes beside an amount. Missing currency means EGP, and
 * EGP always reads "EGP" here whatever the store shows its customers. Another
 * currency uses the store's label when given, else its default (SAR: the symbol).
 */
export function moneyLabel({ currency, label }: MoneyUnit = {}): CurrencyLabel {
  const code = currency || DEFAULT_CURRENCY;
  if (code === DEFAULT_CURRENCY) return DEFAULT_CURRENCY;
  // A code outside the list can only be shown as it is.
  if (!isStoreCurrency(code)) return code as CurrencyLabel;
  return isCurrencyLabelFor(code, label) ? label : STORE_CURRENCIES[code][0];
}

const toAmount = (value: string | number | null | undefined) => {
  const num = value == null ? 0 : typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(num) ? num : 0;
};

/** An amount as plain text ("300 EGP"), for <option>, titles, toasts, exports and push alerts. */
export function formatMoney(value: string | number | null | undefined, locale: string, unit?: MoneyUnit) {
  return formatPricePlain(toAmount(value), locale, moneyLabel(unit));
}

/** `formatMoney` for the screen: SAR carries a mark that <MoneyText> draws as the symbol. Never an attribute or a title. */
export function formatMoneyMarked(value: string | number | null | undefined, locale: string, unit?: MoneyUnit) {
  return formatPriceMarked(toAmount(value), locale, moneyLabel(unit));
}

/** The unit alone as text, for a label or an export column. */
export function moneyUnitText(locale: string, unit?: MoneyUnit) {
  return currencyLabelText(moneyLabel(unit), locale);
}

/** The unit alone for a sentence drawn through <MoneyText>. */
export function moneyUnitMarked(locale: string, unit?: MoneyUnit) {
  const label = moneyLabel(unit);
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

/** A store-wallet amount in the wallet's own currency (EGP until the USD switch, 0136). */
export function formatWalletMoney(
  value: string | number | null | undefined,
  currency: string | null | undefined,
  locale: string,
) {
  if (currency !== "USD") return formatMoney(value, locale);
  const num = value == null ? 0 : Number(value);
  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(Number.isFinite(num) ? num : 0));
  return `${num < 0 ? "-" : ""}$${amount}`;
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
