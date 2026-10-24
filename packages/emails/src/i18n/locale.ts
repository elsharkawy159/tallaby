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
 * ones need `/en` — independent of the email fallback locale above.
 */
export function emailPathPrefix(locale: EmailLocale): string {
  return locale === "ar" ? "" : `/${locale}`;
}
