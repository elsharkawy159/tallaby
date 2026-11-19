import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { isMarketplaceHost, isPlatformHost, storeSubdomainFromHost } from "@workspace/lib/storefront";
import { REFERRAL_COOKIE, referralCookieOptions, referralCookieToSet } from "@workspace/lib/referrals";
import { LOCALE_COOKIE, routing } from "@/i18n/routing";
import { englishLandingRedirect, LOCALE_LANDING_REDIRECT_HEADERS } from "@/lib/marketing/locale-landing.lib";
import { LLMS_TXT_PATH } from "@/lib/marketing/llms-txt-path.lib";
import { geoServerTiming, requestCountry } from "@/lib/marketing/visitor-country.lib";
import { isCrawlFilePath, isInternalStorefrontPath } from "@/lib/storefront-routing";
import { updateSession } from "./supabase/middleware";
import { getClientCountry } from "@workspace/lib/http/client-ip";

const handleI18nRouting = createMiddleware(routing);

/**
 * tallaby.com and www only: the platform-host branch of apps/ecommerce/proxy.ts,
 * unchanged. Seller storefronts ({sub}.tallaby.com and custom domains) are
 * served by apps/ecommerce and must never be answered here.
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  if (storeSubdomainFromHost(host) || !isPlatformHost(host)) {
    // A store host reached this app by mistake: show nothing.
    return new NextResponse(null, { status: 404 });
  }
  if (isInternalStorefrontPath(request.nextUrl.pathname)) {
    // Storefront pages only exist on their own subdomain, where the cart is
    // scoped to the store; on tallaby.com they would show the wrong cart.
    return new NextResponse(null, { status: 404 });
  }
  if (isCrawlFilePath(request.nextUrl.pathname) || request.nextUrl.pathname === LLMS_TXT_PATH) {
    // tallaby.com's robots.txt / sitemap files and /llms.txt: no locale
    // routing, no session.
    return NextResponse.next();
  }

  // A visitor outside the Arab world (by IP country) or, with no country, a
  // browser that doesn't prefer Arabic, landing on an Arabic marketing page
  // with no language chosen yet, gets the English page. The full rule and its
  // exclusions are in locale-landing.lib.ts.
  const marketplace = isMarketplaceHost(host);
  const country = marketplace
    ? requestCountry({
        header: getClientCountry(request.headers),
        override: request.nextUrl.searchParams.get("country"),
        production: process.env.NODE_ENV === "production",
      })
    : null;
  if (marketplace) {
    const english = englishLandingRedirect({
      country,
      method: request.method,
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
      host,
      headers: request.headers,
      localeCookie: request.cookies.get(LOCALE_COOKIE)?.value ?? null,
    });
    if (english) {
      const redirect = NextResponse.redirect(new URL(english, request.url), 307);
      for (const [key, value] of Object.entries(LOCALE_LANDING_REDIRECT_HEADERS)) redirect.headers.set(key, value);
      return redirect;
    }
  }

  const response = handleI18nRouting(request);
  // Affiliate link on tallaby.com (F-37): remember ?ref= for 60 days; the first link wins.
  const referral = referralCookieToSet(request.nextUrl.searchParams.get("ref"), request.cookies.get(REFERRAL_COOKIE)?.value);
  if (referral) response.cookies.set(REFERRAL_COOKIE, referral, referralCookieOptions(process.env.REFERRAL_COOKIE_DOMAIN));
  const final = await updateSession(request, response);
  // The visitor's country for tallaby.com's prices, read by the page from its
  // navigation entry (visitor-currency.client.ts), so the right currency shows
  // at hydration with no /api/geo round trip. A response header added here
  // per request: the page itself stays static and cached.
  if (country) final.headers.append("Server-Timing", geoServerTiming(country));
  return final;
}

export const config = {
  matcher: [
    /*
     * Same matcher as apps/ecommerce/proxy.ts. Skips _next/static, _next/image,
     * favicon.ico, api/ (route handlers), manifest.webmanifest, store-sw.js and
     * images. robots.txt, sitemap.xml, sitemap.xsl and sitemaps/ DO run through
     * the proxy and pass straight through (isCrawlFilePath above).
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|manifest.webmanifest|store-sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
