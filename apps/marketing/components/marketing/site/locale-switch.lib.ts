import { routing } from "@/i18n/routing";

/**
 * The other language's URL for a locale-free `pathname`. "as-needed": Arabic,
 * the default, has no prefix, so its link is never /ar/... (next-intl's Link
 * adds that prefix when it switches locale).
 */
export function localeSwitchHref(pathname: string, locale: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
