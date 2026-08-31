import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const locales = ["en", "ar"] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;

  const resolvedLocale =
    (cookieLocale as Locale) || (locale as Locale) || "ar";

  const safeLocale = locales.includes(resolvedLocale as Locale)
    ? resolvedLocale
    : "ar";

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});
