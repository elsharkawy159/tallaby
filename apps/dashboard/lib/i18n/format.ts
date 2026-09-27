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

export function formatDateTime(value: DateInput, locale: string) {
  return formatDate(value, locale, { dateStyle: "medium", timeStyle: "short" });
}
