export const EMAIL_LOCALES = ["en", "ar"] as const;

export type EmailLocale = (typeof EMAIL_LOCALES)[number];

export const DEFAULT_EMAIL_LOCALE: EmailLocale = "en";

/**
 * Maps `users.preferred_language` to an email locale.
 * Anything other than Arabic (including null/empty) falls back to English.
 */
export function resolveEmailLocale(
  preferredLanguage?: string | null
): EmailLocale {
  const normalized = preferredLanguage?.trim().toLowerCase() ?? "";
  if (normalized === "ar" || normalized.startsWith("ar-")) {
    return "ar";
  }
  return DEFAULT_EMAIL_LOCALE;
}

export function isRtlLocale(locale: EmailLocale): boolean {
  return locale === "ar";
}

export function emailIntlLocale(locale: EmailLocale): string {
  return locale === "ar" ? "ar-EG" : "en-EG";
}

export function emailDateLocale(locale: EmailLocale): string {
  return locale === "ar" ? "ar-EG" : "en-US";
}

/**
 * Locale prefix for storefront links. The site's default locale is Arabic
 * (`localePrefix: "as-needed"`), so Arabic links carry no prefix and English
 * ones need `/en` — independent of the email fallback locale above. On a
 * store whose default language is English (`siteDefaultLocale`), the prefixes
 * swap: English has none and Arabic is `/ar` (owner, 2026-11-14).
 */
export function emailPathPrefix(locale: EmailLocale, siteDefaultLocale?: string | null): string {
  const unprefixed: EmailLocale = siteDefaultLocale === "en" ? "en" : "ar";
  return locale === unprefixed ? "" : `/${locale}`;
}
