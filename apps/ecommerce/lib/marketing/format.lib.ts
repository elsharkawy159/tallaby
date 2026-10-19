/** "12 October 2026" / "١٢ أكتوبر ٢٠٢٦" for an ISO date (YYYY-MM-DD). */
export function formatLongDate(date: string, locale: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale === "en" ? "en-GB" : "ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
