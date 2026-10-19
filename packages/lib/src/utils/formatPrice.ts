export const DEFAULT_CURRENCY = "EGP";

/**
 * The currencies a store can show its prices in (Store settings › General,
 * stores.settings.currency), each with the symbols it can be labelled with
 * (stores.settings.currencyLabel). Display only: amounts are not converted.
 * Symbols are a fixed list, never free text, because `formatPrice` puts the
 * label into HTML. Egypt and the Gulf first, then the major world currencies.
 */
export const STORE_CURRENCIES = {
  EGP: ["EGP", "ج.م", "جنيهاً"],
  SAR: ["SAR", "ر.س", "ريال"],
  AED: ["AED", "د.إ", "درهم"],
  KWD: ["KWD", "د.ك", "دينار"],
  QAR: ["QAR", "ر.ق", "ريال"],
  BHD: ["BHD", "د.ب", "دينار"],
  OMR: ["OMR", "ر.ع", "ريال"],
  USD: ["USD", "$", "دولار"],
  EUR: ["EUR", "€", "يورو"],
  GBP: ["GBP", "£", "إسترليني"],
} as const;

export type StoreCurrency = keyof typeof STORE_CURRENCIES;
export const STORE_CURRENCY_CODES = Object.keys(STORE_CURRENCIES) as [StoreCurrency, ...StoreCurrency[]];
/** Shown first in the currency picker; the rest are international. */
export const REGIONAL_CURRENCY_CODES: readonly StoreCurrency[] = ["EGP", "SAR", "AED", "KWD", "QAR", "BHD", "OMR"];

export type CurrencyLabel = (typeof STORE_CURRENCIES)[StoreCurrency][number];
export const CURRENCY_LABELS = [...new Set(Object.values(STORE_CURRENCIES).flat())] as [CurrencyLabel, ...CurrencyLabel[]];

export function isStoreCurrency(value: unknown): value is StoreCurrency {
  return typeof value === "string" && Object.hasOwn(STORE_CURRENCIES, value);
}

/** Whether `label` is one of `currency`'s symbols. */
export function isCurrencyLabelFor(currency: StoreCurrency, label: unknown): label is CurrencyLabel {
  return (STORE_CURRENCIES[currency] as readonly unknown[]).includes(label);
}

/**
 * A store's currency and label from `stores.settings`. Stores saved before
 * `currency` existed only have an EGP label, so they read as EGP.
 */
export function parseStoreCurrency(settings: unknown): { currency: StoreCurrency; label: CurrencyLabel } {
  const s = (settings ?? {}) as Record<string, unknown>;
  const currency = isStoreCurrency(s.currency) ? s.currency : DEFAULT_CURRENCY;
  const label = isCurrencyLabelFor(currency, s.currencyLabel) ? s.currencyLabel : STORE_CURRENCIES[currency][0];
  return { currency, label };
}

function formatAmount(amount: number, locale: string, options?: Partial<Intl.NumberFormatOptions>) {
  const isArabic = locale.startsWith("ar");
  const { style: _style, currency: _currency, currencyDisplay: _display, ...rest } = options ?? {};
  return new Intl.NumberFormat(isArabic ? "ar-EG" : "en-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...rest,
    // Western digits in Arabic too, so amounts read like what sellers type.
    ...(isArabic && { numberingSystem: "latn" }),
  }).format(amount);
}

/**
 * Standard currency formatting for admin and dashboard surfaces: "2,500 EGP".
 */
export function formatCurrency(
  amount: number,
  locale = "en-EG",
  options?: Partial<Intl.NumberFormatOptions>,
  label: CurrencyLabel = DEFAULT_CURRENCY,
): string {
  return `${formatAmount(amount, locale, options)} ${label}`;
}

/**
 * Parse display currency strings like "EGP 2,500" or "2,500 EGP".
 */
export function parseCurrencyAmount(value: string): number {
  const parsed = parseInt(value.replace(/[^d]/g, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

type FormatPriceSize = "lg" | "md" | "sm";

const sizeToClass: Record<FormatPriceSize, string> = {
  lg: "text-lg",
  md: "text-base",
  sm: "text-xs",
};

/**
 * Plain-text price formatting for labels, filters, and metadata: "300 EGP"
 * (or the store's chosen label, e.g. "300 جنيهاً").
 */
export function formatPricePlain(price: number, locale: string, label: CurrencyLabel = DEFAULT_CURRENCY): string {
  return `${formatAmount(price, locale)} ${label}`;
}

export function formatPrice(
  price: number,
  locale: string,
  currencySize: FormatPriceSize = "sm",
  label: CurrencyLabel = DEFAULT_CURRENCY,
): string {
  const sizeClass = sizeToClass[currencySize] || sizeToClass.sm;
  return `${formatAmount(price, locale)} <span class="${sizeClass}">${label}</span>`;
}

/**
 * @deprecated Do not use this function in price calculations.
 * Prices should be calculated without rounding to maintain precision.
 * This function is kept for backwards compatibility only.
 */
export function roundPrice(price: number): number {
  // Return price without rounding to maintain calculation precision
  return price;
}
