import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const locales = ["en", "ar"] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Read locale from cookie if available, otherwise use the provided locale or default to "ar"
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;

  // Use cookie locale if valid, otherwise use the provided locale, otherwise default to "ar"
  const resolvedLocale = (cookieLocale as Locale) || (locale as Locale) || "ar";

  // Validate that it's one of our supported locales
  const safeLocale = locales.includes(resolvedLocale as Locale)
    ? resolvedLocale
    : "ar";

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});
