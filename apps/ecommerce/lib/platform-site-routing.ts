import { NextResponse } from "next/server";
import { isAccountHost, isTemplatePreviewHost } from "@workspace/lib/storefront/platform-hosts";
import { routing } from "@/i18n/routing";

/**
 * The two reserved subdomains this app serves for tallaby.com once the
 * marketing site runs on its own (apps/marketing; owner, 2026-11-19):
 * `account.<root>` (customer pages) and `preview.<root>` (template preview).
 * Only their own pages are shown there; any other page path is sent to the
 * same path on tallaby.com. API routes and static files (outside the proxy
 * matcher) answer on both hosts as on every other host.
 */
export type PlatformSite = "account" | "preview";

/** Never indexed: tallaby.com and the stores are the public addresses. */
export const PLATFORM_SITE_ROBOTS = "noindex, nofollow";

const LOCALE_PREFIX = `(?:/(?:${routing.locales.join("|")}))?`;
const pagesPattern = (roots: readonly string[]) => new RegExp(`^${LOCALE_PREFIX}/(?:${roots.join("|")})(?:/.*)?$`);

const SITE_PAGES: Record<PlatformSite, RegExp> = {
  // Shared customer pages (app/[locale]/(shop)/{auth,cart,(main)/…}).
  account: pagesPattern(["auth", "cart", "orders", "profile", "returns", "shipping", "payment", "cookies"]),
  // app/[locale]/(template-preview) and (dev-library).
  preview: pagesPattern(["template-preview", "dev-library"]),
};

/** Which reserved subdomain `host` is, or null for every other host. */
export function platformSiteOf(host: string | null | undefined): PlatformSite | null {
  if (isAccountHost(host)) return "account";
  if (isTemplatePreviewHost(host)) return "preview";
  return null;
}

/** True when `pathname` is one of `site`'s own pages (with or without a locale prefix). */
export function isPlatformSitePath(site: PlatformSite, pathname: string): boolean {
  return SITE_PAGES[site].test(pathname);
}

/** The one-time digital download page, `/d/<token>` (app/d/[token], F-108c). */
const DOWNLOAD_PAGE = /^\/d\/[^/]+\/?$/;

/**
 * Account-host routes outside the locale routing: the download page (its own
 * noindex/no-store headers, so it isn't marked here) and the host's own
 * robots.txt (app/robots.ts), which keeps crawlers off download links.
 * `null` for every other path.
 */
export function accountOwnRoute(site: PlatformSite, pathname: string): "download" | "robots" | null {
  if (site !== "account") return null;
  if (DOWNLOAD_PAGE.test(pathname)) return "download";
  if (pathname === "/robots.txt") return "robots";
  return null;
}

/**
 * A 308 to the same path on the marketing site (`marketingOrigin`, no
 * trailing slash) for a path that is not `site`'s own page, else null.
 */
export function platformSiteRedirect(
  site: PlatformSite,
  url: { pathname: string; search: string },
  marketingOrigin: string,
): NextResponse | null {
  if (isPlatformSitePath(site, url.pathname)) return null;
  return NextResponse.redirect(`${marketingOrigin}${url.pathname}${url.search}`, 308);
}

/** Adds the noindex header to a response from a reserved subdomain. */
export function markPlatformSite(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", PLATFORM_SITE_ROBOTS);
  return response;
}
