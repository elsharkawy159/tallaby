import { routing } from "./routing";

/** One source for the locale list and default: i18n/routing.ts. */
export const locales = routing.locales;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = routing.defaultLocale;
/** The seller's saved language, written only by the language switcher (actions/locale.ts). */
export const LOCALE_COOKIE = "locale";

export function resolveLocale(value: string | undefined | null): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}
