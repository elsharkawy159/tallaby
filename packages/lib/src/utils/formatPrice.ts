export const DEFAULT_CURRENCY = "EGP";

const currencyNumberFormatOptions = {
  style: "currency" as const,
  currency: DEFAULT_CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
};

/**
 * Standard EGP currency formatting for admin and dashboard surfaces.
 */
export function formatCurrency(
  amount: number,
  locale = "en-EG",
  options?: Partial<Intl.NumberFormatOptions>
): string {
  const isArabic = locale.startsWith("ar");

  return new Intl.NumberFormat(isArabic ? "ar-EG" : "en-EG", {
    ...currencyNumberFormatOptions,
    ...options,
    ...(isArabic && { numberingSystem: "latn" }),
  }).format(amount);
}

/**
 * Parse display currency strings like "EGP 2,500" or "2,500 EGP".
 */
export function parseCurrencyAmount(value: string): number {
  const parsed = parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

type FormatPriceSize = "lg" | "md" | "sm";

const sizeToClass: Record<FormatPriceSize, string> = {
  lg: "text-lg",
  md: "text-base",
  sm: "text-xs",
};

/**
 * Plain-text EGP price formatting for labels, filters, and metadata.
 */
export function formatPricePlain(price: number, locale: string): string {
  const isArabic = locale.startsWith("ar");

  const formatted = new Intl.NumberFormat(isArabic ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...(isArabic && { numberingSystem: "latn" }),
  }).format(price);

  if (isArabic) {
    return formatted
      .replace("EGP", "ج.م")
      .replace(/ج\.م\.\u200F?/g, "ج.م");
  }

  return formatted;
}

export function formatPrice(
  price: number,
  locale: string,
  currencySize: FormatPriceSize = "sm"
): string {
  const formatted = formatPricePlain(price, locale);
  const sizeClass = sizeToClass[currencySize] || sizeToClass.sm;
  const isArabic = locale.startsWith("ar");
  const currencyLabel = isArabic ? "ج.م" : "EGP";

  return formatted.replace(
    currencyLabel,
    `<span class="${sizeClass}">${currencyLabel}</span>`
  );
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
