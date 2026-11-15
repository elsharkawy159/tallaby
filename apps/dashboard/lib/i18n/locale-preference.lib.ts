import { routing } from "@/i18n/routing";

export interface LocalePreferenceRequest {
  method: string;
  pathname: string;
  /** The query string with its leading `?`, or "". */
  search: string;
  headers: { get(name: string): string | null };
  /** The `locale` cookie (LOCALE_COOKIE) written by the language switcher, or null. */
  localeCookie: string | null;
}

function hasLocalePrefix(pathname: string): boolean {
  return routing.locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

/** A client-router fetch, prefetch or server action, not a page load. */
function isNotPageLoad(headers: LocalePreferenceRequest["headers"]): boolean {
  if (headers.get("next-action") != null) return true;
  if (headers.get("rsc") != null) return true;
  if (headers.get("next-router-prefetch") != null) return true;
  const purpose = `${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""} ${headers.get("x-purpose") ?? ""}`;
  if (/prefetch|prerender/i.test(purpose)) return true;
  // Next may strip the RSC headers before the proxy; Sec-Fetch-Dest is the
  // reliable signal (as in apps/ecommerce/lib/marketing/locale-landing.lib.ts).
  const dest = headers.get("sec-fetch-dest");
  return dest != null && dest !== "document";
}

/**
 * The old-preference rule (docs/plans/dashboard-static-shell.md §5.1): a seller
 * who chose English in the switcher and opens an unprefixed (Arabic) URL, e.g.
 * from an email or push, gets the English page. Only GET page loads; the query
 * is kept. Returns the target path, or null to serve the request as is.
 */
export function englishPreferenceRedirect(request: LocalePreferenceRequest): string | null {
  if (request.method !== "GET") return null;
  if (request.localeCookie !== "en") return null;
  if (hasLocalePrefix(request.pathname)) return null;
  if (isNotPageLoad(request.headers)) return null;
  const path = request.pathname === "/" ? "/en" : `/en${request.pathname}`;
  return `${path}${request.search}`;
}

/** Headers on that redirect: it depends on the cookie, so no shared cache may keep it. */
export const LOCALE_PREFERENCE_REDIRECT_HEADERS = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
} as const;
