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

/** "EGP 250" / "٢٥٠ جنيه" for a whole or decimal amount in pounds (Arabic says جنيه, never ج.م). */
export function formatMoney(amount: number, locale: string): string {
  const maximumFractionDigits = Number.isInteger(amount) ? 0 : 2;
  if (locale === "en") {
    return new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP", maximumFractionDigits }).format(amount);
  }
  return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits }).format(amount)} جنيه`;
}
