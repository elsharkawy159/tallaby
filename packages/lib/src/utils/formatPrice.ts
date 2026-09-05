export const DEFAULT_CURRENCY = "EGP";

/**
 * Shape shared by products.price and product_variants.price (both jsonb):
 * a list price plus an optional discount, resolved down to a final price.
 */
export interface PriceJson {
  base?: number | string | null;
  list?: number | string | null;
  final?: number | string | null;
  discountType?: "amount" | "percent" | null;
  discountValue?: number | string | null;
}

export interface ParsedPrice {
  base: number;
  list: number | null;
  final: number;
  discountType: "amount" | "percent" | null;
  discountValue: number | null;
}

/**
 * Parses a products.price / product_variants.price jsonb value. Falls back to
 * treating a bare number as the final price, for legacy/unset rows.
 */
export function parsePriceJson(price: unknown): ParsedPrice {
  if (typeof price === "number") {
    return { base: price, list: null, final: price, discountType: null, discountValue: null };
  }

  if (!price || typeof price !== "object") {
    return { base: 0, list: null, final: 0, discountType: null, discountValue: null };
  }

  const p = price as PriceJson;
  const base = p.base != null ? Number(p.base) : 0;
  const list = p.list != null ? Number(p.list) : null;
  const final = p.final != null ? Number(p.final) : (list ?? base);
  const discountType = p.discountType ?? null;
  const discountValue = p.discountValue != null ? Number(p.discountValue) : null;

  return { base, list, final, discountType, discountValue };
}

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
