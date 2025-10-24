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
  // Round up the price to the nearest integer
  const rounded = Math.ceil(price);

  // Determine if the locale is Arabic
  const isArabic = locale.startsWith("ar");

  // Format using Intl.NumberFormat with appropriate locale
  const formatted = new Intl.NumberFormat(isArabic ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);

  const sizeClass = sizeToClass[currencySize] || sizeToClass.sm;

  // Adjust the currency symbol for Arabic layout
  if (isArabic) {
    // Ensures correct RTL display: ٦١١ ج.م
    const result = formatted.replace("EGP", "ج.م");
    return result.replace(
      "ج.م",
      `<span class="${sizeClass}">ج.م</span>`
    );
  }

  // English format: EGP 611
  return formatted.replace(
    "EGP",
    `<span class="${sizeClass}">EGP</span>`
  );
}

export function roundPrice(price: number): number {
  return Math.ceil(price);
}
