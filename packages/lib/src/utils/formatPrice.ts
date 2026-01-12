type FormatPriceSize = "lg" | "md" | "sm";

const sizeToClass: Record<FormatPriceSize, string> = {
  lg: "text-lg",
  md: "text-base",
  sm: "text-xs",
};

export function formatPrice(
  price: number,
  locale: string,
  currencySize: FormatPriceSize = "sm"
): string {
  // Determine if the locale is Arabic
  const isArabic = locale.startsWith("ar");

  // Format using Intl.NumberFormat with appropriate locale
  // Display prices with 2 decimal places for currency precision
  const formatted = new Intl.NumberFormat(isArabic ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);

  const sizeClass = sizeToClass[currencySize] || sizeToClass.sm;

  // Adjust the currency symbol for Arabic layout
  if (isArabic) {
    // Ensures correct RTL display: ٦١١ ج.م
    const result = formatted.replace("EGP", "ج.م");
    return result.replace("ج.م", `<span class="${sizeClass}">ج.م</span>`);
  }

  // English format: EGP 611.00
  return formatted.replace("EGP", `<span class="${sizeClass}">EGP</span>`);
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
