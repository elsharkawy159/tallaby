import { formatPricePlain } from "@workspace/lib";

// Dashboard-wide formatting. Arabic uses Western (latn) digits so numbers,
// SKUs, and order numbers read the same as what sellers type into inputs.
const intlLocale = (locale: string) => (locale.startsWith("ar") ? "ar-EG" : "en-EG");
const digits = (locale: string) =>
  locale.startsWith("ar") ? ({ numberingSystem: "latn" } as const) : {};

type DateInput = string | number | Date | null | undefined;

const toDate = (value: DateInput) => {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function formatMoney(value: string | number | null | undefined, locale: string) {
  const num = value == null ? 0 : typeof value === "string" ? parseFloat(value) : value;
  return formatPricePlain(Number.isFinite(num) ? num : 0, locale);
}

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat(intlLocale(locale), { ...options, ...digits(locale) }).format(value);
}

export function formatDate(
  value: DateInput,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), { ...options, ...digits(locale) }).format(date);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

/** "12 minutes ago" / "منذ 12 دقيقة", with the same digits as the rest of the dashboard. */
export function formatRelativeTime(value: DateInput, locale: string, now: Date = new Date()) {
  const date = toDate(value);
  if (!date) return "—";
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const [unit, size] =
    RELATIVE_UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? RELATIVE_UNITS[RELATIVE_UNITS.length - 1]!;
  // RelativeTimeFormat takes the numbering system via the locale tag.
  const tag = locale.startsWith("ar") ? `${intlLocale(locale)}-u-nu-latn` : intlLocale(locale);
  return new Intl.RelativeTimeFormat(tag, { numeric: "auto" }).format(
    Math.round(seconds / size),
    unit
  );
}

/** Short number for chart axes: 1.2K / 1.2 ألف. */
export function formatCompactNumber(value: number, locale: string) {
  return formatNumber(value, locale, { notation: "compact", maximumFractionDigits: 1 });
}

export function formatDateTime(value: DateInput, locale: string) {
  return formatDate(value, locale, { dateStyle: "medium", timeStyle: "short" });
}
