export function formatPrice(
  price: number,
  locale: string,
  makeCurrencySmall: boolean = true
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

  // Adjust the currency symbol for Arabic layout
  if (isArabic) {
    // Ensures correct RTL display: ٦١١ ج.م
    const result = formatted.replace("EGP", "ج.م");
    if (makeCurrencySmall) {
      return result.replace("ج.م", '<span class="text-xs">ج.م</span>');
    }
    return result;
  }

  // English format: EGP 611
  if (makeCurrencySmall) {
    return formatted.replace("EGP", '<span class="text-xs">EGP</span>');
  }
  return formatted;
}

export function roundPrice(price: number): number {
  return Math.ceil(price);
}
