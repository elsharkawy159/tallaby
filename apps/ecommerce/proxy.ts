import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import {
  hostnameOf,
  isLocalHost,
  isPlatformHost,
  storeSubdomainFromHost,
} from "@workspace/lib/storefront";
import { STORE_PREVIEW_COOKIE } from "@workspace/lib/store-sites/preview";
import { REFERRAL_COOKIE, referralCookieOptions, referralCookieToSet } from "@workspace/lib/referrals";
import { routing } from "@/i18n/routing";
import {
  isCrawlFilePath,
  isInternalStorefrontPath,
  routeStoreCrawlFile,
  routeStorefrontRequest,
} from "@/lib/storefront-routing";
import {
  customDomainForSubdomain,
  subdomainForCustomDomain,
} from "@/lib/custom-domain-lookup";
import { updateSession } from "./supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

/**
 * A browser in "Preview on my store" (P4-08) may be shown drafts: never let a
 * shared cache keep that response, and never let it be indexed. The draft
 * itself is only rendered after the token is verified for this host's store.
 */
function markStorePreview(request: NextRequest, response: NextResponse): NextResponse {
  if (request.cookies.has(STORE_PREVIEW_COOKIE)) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  // Seller storefronts: {subdomain}.tallaby.com
  const storeSubdomain = storeSubdomainFromHost(host);
  if (storeSubdomain) {
    // A store that has its own domain lives there; the subdomain forwards
    // (not in local development: the custom domain is production).
    const customDomain = isLocalHost(host) ? null : await customDomainForSubdomain(storeSubdomain);
    if (customDomain) {
      const { pathname, search } = request.nextUrl;
      return NextResponse.redirect(`https://${customDomain}${pathname}${search}`, 308);
    }
    // The store's own robots.txt / sitemap.xml (P5-04); no session needed.
    const crawlFile = routeStoreCrawlFile(request, storeSubdomain);
    if (crawlFile) return crawlFile;
    const storefront = routeStorefrontRequest(request, storeSubdomain);
    if (storefront) return markStorePreview(request, await updateSession(request, storefront));
  } else if (!isPlatformHost(host)) {
    // A seller's own domain (faster-eg.com). Vercel only routes domains we
    // attached, but an inactive or removed one must not show anything.
    const subdomain = await subdomainForCustomDomain(hostnameOf(host));
    if (!subdomain) return new NextResponse(null, { status: 404 });
    const crawlFile = routeStoreCrawlFile(request, subdomain);
    if (crawlFile) return crawlFile;
    const storefront = routeStorefrontRequest(request, subdomain);
    if (storefront) return markStorePreview(request, await updateSession(request, storefront));
  } else if (isInternalStorefrontPath(request.nextUrl.pathname)) {
    // Storefront pages only exist on their own subdomain, where the cart is
    // scoped to the store; on tallaby.com they would show the wrong cart.
    return new NextResponse(null, { status: 404 });
  } else if (isCrawlFilePath(request.nextUrl.pathname)) {
    // The marketplace robots.txt / sitemap files, exactly as before this
    // proxy started matching them (no locale routing, no session).
    return NextResponse.next();
  }

  const response = handleI18nRouting(request);
  // Affiliate link on tallaby.com (F-37): remember ?ref= for 60 days; the first link wins.
  const referral = referralCookieToSet(request.nextUrl.searchParams.get("ref"), request.cookies.get(REFERRAL_COOKIE)?.value);
  if (referral) response.cookies.set(REFERRAL_COOKIE, referral, referralCookieOptions(process.env.REFERRAL_COOKIE_DOMAIN));
  return updateSession(request, response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (route handlers under app/api/, including OAuth callback and
     *   server-to-server webhooks — locale routing must not intercept these
     *   or they 404 instead of running their handlers)
     * - sitemap.xsl (the sitemap's browser stylesheet), manifest.webmanifest, store-sw.js
     *   (top-level files outside app/[locale]/ — locale routing must not
     *   intercept these or they 404 instead of returning their content)
     * robots.txt, sitemap.xml and sitemaps/ DO run through the proxy: store
     * hosts get their own (P5-04); tallaby.com passes straight through to the
     * marketplace files (see isCrawlFilePath above).
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xsl|manifest.webmanifest|store-sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
