import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const locales = ["en", "ar"] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // INFO: 1. Try to read from cookies
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value as Locale | undefined;

  // INFO: 2. Fallback to default
  const resolvedLocale = cookieLocale || (locale as Locale) || "en";

  // Validate that it's one of our supported locales
  const safeLocale = locales.includes(resolvedLocale as Locale) ? (resolvedLocale as Locale) : "en";

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});
