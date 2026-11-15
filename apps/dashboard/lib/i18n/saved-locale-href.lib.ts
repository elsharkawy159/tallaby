import { defaultLocale, resolveLocale } from "@/i18n/config";

/**
 * A dashboard page path in the seller's saved language (the `locale` cookie,
 * LOCALE_COOKIE), for route handlers under app/api, which sit outside
 * app/[locale] and have no locale segment: `/stores/x` stays as is for
 * Arabic and becomes `/en/stores/x` for English (i18n/routing.ts, as-needed),
 * so the seller skips the proxy's old-preference redirect. `/api/...` paths
 * are returned unchanged. Same result as next-intl's `getPathname`, kept free
 * of next-intl's client navigation so route handlers and tests can import it.
 */
export function savedLocaleHref(href: string, localeCookie: string | null | undefined): string {
  if (href === "/api" || href.startsWith("/api/")) return href;
  const locale = resolveLocale(localeCookie);
  if (locale === defaultLocale) return href;
  // "/" and "/?q" become "/en" and "/en?q" (no trailing slash).
  return /^\/(\?|#|$)/.test(href) ? `/${locale}${href.slice(1)}` : `/${locale}${href}`;
}
