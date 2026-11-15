import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { updateSession } from "@/supabase/middleware";
import { LOCALE_COOKIE, defaultLocale, resolveLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { englishPreferenceRedirect, LOCALE_PREFERENCE_REDIRECT_HEADERS } from "@/lib/i18n/locale-preference.lib";
import { REFERRAL_COOKIE, referralCookieOptions, referralCookieToSet } from "@workspace/lib/referrals";

/** Arabic unprefixed (rewritten to /ar/...), English under /en; never writes a cookie (i18n/routing.ts). */
const handleI18nRouting = createMiddleware(routing);

/**
 * Root files outside app/[locale] that still pass through this proxy (the
 * matcher skips api/, sw.js, manifest, robots, sitemap and images). They get
 * the session step only, exactly as before [locale]; the locale rewrite would
 * send them to /ar/... and 404.
 */
function skipsLocaleRouting(pathname: string): boolean {
  return pathname.startsWith("/.well-known/") || pathname === "/favicon.ico";
}

async function route(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  if (skipsLocaleRouting(pathname)) return updateSession(request, NextResponse.next({ request }));

  // A seller who chose English opening an unprefixed (Arabic) URL, e.g. from
  // an email or push (plan §5.1). Before the session step, so a signed-out
  // seller lands on /en/login next.
  const english = englishPreferenceRedirect({
    method: request.method,
    pathname,
    search,
    headers: request.headers,
    localeCookie: request.cookies.get(LOCALE_COOKIE)?.value ?? null,
  });
  if (english) {
    const redirect = NextResponse.redirect(new URL(english, request.url), 307);
    for (const [key, value] of Object.entries(LOCALE_PREFERENCE_REDIRECT_HEADERS)) redirect.headers.set(key, value);
    return redirect;
  }

  return updateSession(request, handleI18nRouting(request));
}

export async function proxy(request: NextRequest) {
  // if (
  //   process.env.NEXT_PUBLIC_MAINTENANCE_MODE &&
  //   request.nextUrl.pathname !== "/maintenance"
  // ) {
  //   return NextResponse.redirect(new URL("/maintenance", request.url));
  // }

  const response = await route(request);

  // Arabic is the default; only an explicit choice (the language switcher)
  // changes it. Missing or unknown values are reset to the default.
  const localeFromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (resolveLocale(localeFromCookie) !== localeFromCookie) {
    response.cookies.set(LOCALE_COOKIE, defaultLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  // Affiliate link (F-37): remember ?ref= for 60 days; the first link wins.
  const referral = referralCookieToSet(request.nextUrl.searchParams.get("ref"), request.cookies.get(REFERRAL_COOKIE)?.value);
  if (referral) response.cookies.set(REFERRAL_COOKIE, referral, referralCookieOptions(process.env.REFERRAL_COOKIE_DOMAIN));

  return response;
}

export const config = {
  // api/, sw.js, manifest, robots, sitemap and images live outside
  // app/[locale] and never reach the proxy (see skipsLocaleRouting for the rest).
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.png|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
