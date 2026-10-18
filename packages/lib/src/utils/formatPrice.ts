export const DEFAULT_CURRENCY = "EGP";

/**
 * How amounts are labelled. "EGP" everywhere by default (both languages); a
 * store can pick an Arabic label for its own storefront (Store settings ›
 * General, stores.settings.currencyLabel).
 */
export const CURRENCY_LABELS = ["EGP", "جنيهاً", "ج.م"] as const;
export type CurrencyLabel = (typeof CURRENCY_LABELS)[number];

export function parseCurrencyLabel(value: unknown): CurrencyLabel {
  return (CURRENCY_LABELS as readonly unknown[]).includes(value) ? (value as CurrencyLabel) : DEFAULT_CURRENCY;
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
