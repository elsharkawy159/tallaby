/** "12 October 2026" / "١٢ أكتوبر ٢٠٢٦" for an ISO date (YYYY-MM-DD) or timestamp. */
export function formatLongDate(date: string, locale: string): string {
  const value = new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00Z` : date);
  if (Number.isNaN(value.getTime())) return "";
  return value.toLocaleDateString(locale === "en" ? "en-GB" : "ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: /^\d{4}-\d{2}-\d{2}$/.test(date) ? "UTC" : "Africa/Cairo",
  });
}

/** "EGP 250" / "٢٥٠ ج.م." for a whole or decimal amount in pounds. */
export function formatMoney(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-EG" : "ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
