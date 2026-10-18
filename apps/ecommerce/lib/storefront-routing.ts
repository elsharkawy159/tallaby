/**
 * Request routing for seller storefronts ({subdomain}.tallaby.com, or the
 * seller's own domain such as faster-eg.com), used by proxy.ts. Storefront
 * pages live under `app/[locale]/storefront/[subdomain]` and are only
 * reachable through a store host:
 *
 *   faster.tallaby.com/                 → /ar/storefront/faster
 *   faster.tallaby.com/en/products/x    → /en/storefront/faster/products/x
 *   faster.tallaby.com/cart             → /ar/storefront/faster/cart
 *
 * Checkout, sign-in, orders and the policy pages run as-is on the store host
 * (cart actions are scoped by host, so they act on the storefront cart).
 * Anything else belongs to the marketplace and redirects to tallaby.com.
 */

import { NextResponse, type NextRequest } from "next/server";
import { routing, type AppLocale } from "@/i18n/routing";

const STOREFRONT_SEGMENT = "storefront";

/** `/storefront/...` with or without a locale prefix: internal-only paths. */
export function isInternalStorefrontPath(pathname: string): boolean {
  const pattern = new RegExp(
    `^/(?:(?:${routing.locales.join("|")})/)?${STOREFRONT_SEGMENT}(?:/|$)`,
  );
  return pattern.test(pathname);
}

/** robots.txt, sitemap.xml and its chunk files: answered per host (P5-04). */
export function isCrawlFilePath(pathname: string): boolean {
  return pathname === "/robots.txt" || pathname === "/sitemap.xml" || /^\/sitemaps\/[^/]+$/.test(pathname);
}

/**
 * A store host's robots.txt / sitemap.xml / sitemaps/{n}.xml → that store's
 * own files under `storefront/[subdomain]`, or null for any other path. On
 * tallaby.com these paths keep the marketplace files (app/robots.ts,
 * app/sitemap.xml, app/sitemaps), unchanged.
 */
export function routeStoreCrawlFile(request: NextRequest, subdomain: string): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!isCrawlFilePath(pathname)) return null;
  const url = request.nextUrl.clone();
  url.pathname = `/${routing.defaultLocale}/${STOREFRONT_SEGMENT}/${subdomain}${pathname}`;
  return NextResponse.rewrite(url);
}

/** Paths that keep their normal app behaviour on a store host. */
const PASS_THROUGH = [
  "/cart/checkout",
  "/auth",
  "/orders",
  "/payment",
  "/profile",
  "/error",
  "/privacy",
  "/terms",
  "/returns",
  "/shipping",
  "/cookies",
];

function splitLocale(pathname: string): { locale: AppLocale; path: string } {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return { locale, path: "/" };
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, path: pathname.slice(locale.length + 1) };
    }
  }
  return { locale: routing.defaultLocale, path: pathname };
}

export function marketplaceOrigin(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site.replace(/\/$/, "");
  return `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "tallaby.com"}`;
}

/**
 * The storefront response for a store-host request, or null when the path
 * should go through the regular i18n routing (PASS_THROUGH).
 */
export function routeStorefrontRequest(
  request: NextRequest,
  subdomain: string,
): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  const { locale, path } = splitLocale(pathname);
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  if (PASS_THROUGH.some((p) => path === p || path.startsWith(`${p}/`))) {
    return null;
  }

  const rewrite = (target: string) => {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/${STOREFRONT_SEGMENT}/${subdomain}${target}`;
    // Server actions resolve their locale from this header (see i18n/request.ts).
    const headers = new Headers(request.headers);
    headers.set("X-NEXT-INTL-LOCALE", locale);
    return NextResponse.rewrite(url, { request: { headers } });
  };

  if (path === "/") return rewrite("");
  if (path === "/cart") return rewrite("/cart");
  if (/^\/products\/[^/]+\/?$/.test(path)) return rewrite(path.replace(/\/$/, ""));

  // A builder page of this store (/about). An unknown slug is redirected to
  // the marketplace by the page route, as before (P5-01).
  if (/^\/[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\/?$/.test(path) && path !== "/products" && path !== "/search") {
    return rewrite(`/pages${path.replace(/\/$/, "")}`);
  }

  // The storefront home is the store's catalog.
  if (path === "/products" || path === "/search") {
    const url = request.nextUrl.clone();
    url.pathname = prefix || "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(`${pathname}${search}`, marketplaceOrigin()));
}
