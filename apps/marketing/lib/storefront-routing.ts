/**
 * Request routing for seller storefronts ({subdomain}.tallaby.com, or the
 * seller's own domain such as faster-eg.com), used by proxy.ts. Storefront
 * pages live under `app/[locale]/(shop)/storefront/[subdomain]` and are only
 * reachable through a store host:
 *
 *   faster.tallaby.com/                 → /ar/storefront/faster
 *   faster.tallaby.com/en/products/x    → /en/storefront/faster/products/x
 *   faster.tallaby.com/cart             → /ar/storefront/faster/cart
 *   faster.tallaby.com/products?q=x     → /ar/storefront/faster/products?q=x
 *
 * An unprefixed address shows the store's DEFAULT language (owner,
 * 2026-11-14). Arabic-default stores route as above, as before. On an
 * English-default store the prefixes swap: "/" is English, "/ar/..." is
 * Arabic, and "/en/..." permanently redirects to the unprefixed address. A
 * store that offers one language only redirects the other prefix the same
 * way. The full table is on `storeLocaleDecision`.
 *
 * Checkout, sign-in, orders and the cookies page run as-is on the store host
 * (cart actions are scoped by host, so they act on the storefront cart).
 * Anything else is the store's own 404: a store host never redirects to
 * tallaby.com (owner, 2026-11-03).
 */

import { NextResponse, type NextRequest } from "next/server";
import { storeBaseLocale } from "@workspace/lib/storefront";
import { routing, type AppLocale } from "@/i18n/routing";

const STOREFRONT_SEGMENT = "storefront";

/** `/storefront/...` with or without a locale prefix: internal-only paths. */
export function isInternalStorefrontPath(pathname: string): boolean {
  const pattern = new RegExp(
    `^/(?:(?:${routing.locales.join("|")})/)?${STOREFRONT_SEGMENT}(?:/|$)`,
  );
  return pattern.test(pathname);
}

/** robots.txt, sitemap.xml, its stylesheet and its chunk files: answered per host (P5-04). */
export function isCrawlFilePath(pathname: string): boolean {
  return (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/sitemap.xsl" ||
    /^\/sitemaps\/[^/]+$/.test(pathname)
  );
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
  url.pathname = `/${routing.defaultLocale}/${STOREFRONT_SEGMENT}/${subdomain}${STORE_CRAWL_ROUTES[pathname] ?? pathname}`;
  return NextResponse.rewrite(url);
}

/**
 * Crawl files whose route folder can't carry the public name. A folder named
 * `sitemap.xml` is a Next.js metadata route: the build flattens its dynamic
 * segments (`/-/storefront/-/sitemap.xml`), so on Vercel the rewrite matched
 * nothing and every store sitemap was a 500.
 */
const STORE_CRAWL_ROUTES: Record<string, string> = {
  "/sitemap.xml": "/sitemap-index",
  // The readable sitemap page, titled with the store's name (2026-11-09).
  "/sitemap.xsl": "/sitemap-xsl",
};

/** Paths that keep their normal app behaviour on a store host. */
const PASS_THROUGH = [
  "/cart/checkout",
  "/auth",
  "/orders",
  "/payment",
  "/profile",
  "/error",
  // /privacy, /terms, /shipping and /returns are not here: a store host serves
  // its own builder page of that slug, or else the store's own policy page (F-46).
  "/cookies",
];

/** A store's languages as the proxy routes them (Store settings › General). */
export type StoreLocales = {
  /** What an unprefixed address shows. */
  defaultLocale: AppLocale;
  /** Always includes `defaultLocale`. */
  supportedLocales: readonly AppLocale[];
};

/** A store with no known languages (unknown subdomain, failed lookup): Arabic unprefixed, both offered, as before. */
export const DEFAULT_STORE_LOCALES: StoreLocales = { defaultLocale: "ar", supportedLocales: ["ar", "en"] };

/** The stored `default_locale` / `supported_locales`, made safe: unknown values dropped, the default always offered. */
export function storeLocalesOf(
  store: { defaultLocale?: string | null; supportedLocales?: readonly string[] | null } | null | undefined,
): StoreLocales {
  if (!store) return DEFAULT_STORE_LOCALES;
  const defaultLocale = storeBaseLocale(store.defaultLocale);
  const listed = routing.locales.filter((l) => store.supportedLocales?.includes(l));
  const supported = listed.length ? listed : [...routing.locales];
  return {
    defaultLocale,
    supportedLocales: supported.includes(defaultLocale) ? supported : [defaultLocale, ...supported],
  };
}

function splitLocale(pathname: string): { prefix: AppLocale | null; path: string } {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return { prefix: locale, path: "/" };
    if (pathname.startsWith(`/${locale}/`)) {
      return { prefix: locale, path: pathname.slice(locale.length + 1) };
    }
  }
  return { prefix: null, path: pathname };
}

export type StoreLocaleDecision =
  /** Render `path` in `locale`. */
  | { action: "serve"; locale: AppLocale; path: string }
  /** 308 to `path` (unprefixed), keeping the query string. */
  | { action: "redirect"; path: string };

/**
 * Which language a store-host path shows, or where it moved for good:
 *
 *   default │ offers  │ "/x"     │ "/ar/x"      │ "/en/x"
 *   ────────┼─────────┼──────────┼──────────────┼─────────────
 *   Arabic  │ ar + en │ Arabic   │ Arabic (*)   │ English
 *   Arabic  │ ar      │ Arabic   │ Arabic (*)   │ 308 → "/x"
 *   English │ en + ar │ English  │ Arabic       │ 308 → "/x"
 *   English │ en      │ English  │ 308 → "/x"   │ 308 → "/x"
 *
 * (*) as before this change: storefront pages answer "/ar/x" too, and on
 * shared pages (checkout, sign-in…) next-intl redirects it to "/x".
 */
export function storeLocaleDecision(pathname: string, store: StoreLocales): StoreLocaleDecision {
  const { prefix, path } = splitLocale(pathname);
  if (!prefix) return { action: "serve", locale: store.defaultLocale, path };
  // An English store's own language has no prefix (old /en links land here).
  if (prefix === store.defaultLocale && prefix !== routing.defaultLocale) return { action: "redirect", path };
  // A language the store doesn't offer: its one language, unprefixed.
  if (!store.supportedLocales.includes(prefix)) return { action: "redirect", path };
  return { action: "serve", locale: prefix, path };
}

/**
 * The storefront response for a store-host request, or null when the path
 * should go through the regular i18n routing (PASS_THROUGH on an
 * Arabic-default store, exactly as before).
 */
export function routeStorefrontRequest(
  request: NextRequest,
  subdomain: string,
  store: StoreLocales = DEFAULT_STORE_LOCALES,
): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  const decision = storeLocaleDecision(pathname, store);
  if (decision.action === "redirect") {
    // A fresh URL, not nextUrl.clone() (see rewrite below).
    return NextResponse.redirect(new URL(`${decision.path}${search}`, request.url), 308);
  }
  const { locale, path } = decision;

  if (PASS_THROUGH.some((p) => path === p || path.startsWith(`${p}/`))) {
    // next-intl's routing takes an unprefixed address as Arabic, so an
    // English store's shared pages are rewritten here instead.
    if (store.defaultLocale === routing.defaultLocale) return null;
    const url = new URL(`/${locale}${path}${search}`, request.url);
    const headers = new Headers(request.headers);
    headers.set("X-NEXT-INTL-LOCALE", locale);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  const rewrite = (target: string) => {
    // A fresh URL, not nextUrl.clone(): NextURL keeps the request's trailing
    // slash, so "/blog/?page=2" would rewrite to ".../blog/" instead of ".../blog".
    const url = new URL(`/${locale}/${STOREFRONT_SEGMENT}/${subdomain}${target}${search}`, request.url);
    // Server actions resolve their locale from this header (see i18n/request.ts).
    const headers = new Headers(request.headers);
    headers.set("X-NEXT-INTL-LOCALE", locale);
    return NextResponse.rewrite(url, { request: { headers } });
  };

  if (path === "/") return rewrite("");
  if (path === "/cart") return rewrite("/cart");
  if (/^\/products\/[^/]+\/?$/.test(path)) return rewrite(path.replace(/\/$/, ""));

  // The store blog (P4-16): /blog (?page=, ?tag=) and /blog/{post}.
  if (path === "/blog" || path === "/blog/") return rewrite("/blog");
  const blogPost = /^\/blog\/([a-z0-9](?:[a-z0-9-]{0,198}[a-z0-9])?)\/?$/.exec(path);
  if (blogPost) return rewrite(`/blog/${blogPost[1]}`);

  // A shared catalog link (ROADMAP.md F-11c): /catalog/{body}.{mac}. The dot
  // keeps it apart from a CMS item, whose slugs can't contain one.
  const catalog = /^\/catalog\/([A-Za-z0-9_-]{8,2400}\.[A-Za-z0-9_-]{8,64})\/?$/.exec(path);
  if (catalog) return rewrite(`/catalog/${catalog[1]}`);

  // A CMS item (/{collection}/{item}, P4-11). An unknown collection or item
  // is the store's 404.
  const cmsItem = /^\/([a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?)\/([a-z0-9](?:[a-z0-9-]{0,198}[a-z0-9])?)\/?$/.exec(path);
  if (cmsItem && cmsItem[1] !== "products" && cmsItem[1] !== "blog") {
    return rewrite(`/cms/${cmsItem[1]}/${cmsItem[2]}`);
  }

  // A builder page of this store (/about). An unknown slug is the store's 404.
  if (/^\/[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\/?$/.test(path) && path !== "/products" && path !== "/search") {
    return rewrite(`/pages${path.replace(/\/$/, "")}`);
  }

  // The catalog page (search, category, sort, pages). On a store without a
  // builder site the route sends it on to the home page, which is its catalog.
  if (path === "/products" || path === "/products/" || path === "/search") return rewrite("/products");

  // No route matches, and no builder slug can contain "_", so the page route 404s.
  return rewrite("/pages/_missing");
}
