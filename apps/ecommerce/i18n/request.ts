import { getRequestConfig } from "next-intl/server";

const locales = ["en", "ar"] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Use the provided locale (defaults to "en" during static generation)
  // This allows static generation of all pages
  //
  // NOTE: Cookie-based locale switching will work client-side via LanguageSwitcher
  // but the initial HTML will use the default locale. After router.refresh(),
  // the page will re-render with the cookie-based locale (making it dynamic at that point).
  //
  // For full static generation with locale support, consider using URL-based locale routing:
  // https://next-intl-docs.vercel.app/docs/routing/usage#routing-strategies

  const resolvedLocale = (locale as Locale) || "en";

  // Validate that it's one of our supported locales
  const safeLocale = locales.includes(resolvedLocale as Locale)
    ? resolvedLocale
    : "en";

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});
