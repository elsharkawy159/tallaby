import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { storeSubdomainFromHost } from "@workspace/lib/storefront";
import { routing } from "@/i18n/routing";
import {
  isInternalStorefrontPath,
  routeStorefrontRequest,
} from "@/lib/storefront-routing";
import { updateSession } from "./supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Seller storefronts: {subdomain}.tallaby.com
  const storeSubdomain = storeSubdomainFromHost(request.headers.get("host"));
  if (storeSubdomain) {
    const storefront = routeStorefrontRequest(request, storeSubdomain);
    if (storefront) return updateSession(request, storefront);
  } else if (isInternalStorefrontPath(request.nextUrl.pathname)) {
    // Storefront pages only exist on their own subdomain, where the cart is
    // scoped to the store; on tallaby.com they would show the wrong cart.
    return new NextResponse(null, { status: 404 });
  }

  const response = handleI18nRouting(request);
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
     * - sitemap.xml, robots.txt, manifest.webmanifest (top-level metadata
     *   route handlers outside app/[locale]/ — locale routing must not
     *   intercept these or they 404 instead of returning their content)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
