import { getRequestConfig } from "next-intl/server";

const locales = ["en", "ar"] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = "ar";

export default getRequestConfig(async ({ locale }) => {
  // Static default for ISR/SSG. Per-request locale preference is handled
  // client-side (LanguageSwitcher sets a cookie + refresh); reading cookies
  // here would opt every route into dynamic rendering (DYNAMIC_SERVER_USAGE).
  const candidate = (locale as Locale) || defaultLocale;
  const safeLocale = locales.includes(candidate) ? candidate : defaultLocale;

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});
