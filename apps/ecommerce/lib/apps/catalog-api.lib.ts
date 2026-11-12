import { parsePublicLocale, publicCatalog, publicCatalogApp } from "@workspace/apps/public";

/**
 * GET /api/apps/catalog[/:appId] (ROADMAP.md F-93, docs/apps-platform.md):
 * the App Center registry, public fields only, for tallaby.com and the future
 * apps.tallaby.com. No store data, no auth, no database: the response changes
 * only with a deploy, so the CDN keeps it an hour and serves it stale for a day.
 */

/** tallaby.com and any of its subdomains (apps., www., a store's subdomain) over https. Local dev too. */
const ALLOWED_ORIGIN = /^https:\/\/(?:[a-z0-9-]+\.)*tallaby\.com$/;
const DEV_ORIGIN = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{2,5})?$/;

export const CATALOG_CACHE_CONTROL = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export function corsHeaders(origin: string | null, production = process.env.NODE_ENV === "production"): Record<string, string> {
  const headers: Record<string, string> = { Vary: "Origin" };
  if (origin && (ALLOWED_ORIGIN.test(origin) || (!production && DEV_ORIGIN.test(origin)))) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

/** Where the manifests' `/app-logos/…` files are served: the dashboard. */
export function assetOrigin(): string {
  return (process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.tallaby.com").replace(/\/$/, "");
}

export function catalogResponseBody(locale: string | null) {
  return publicCatalog(parsePublicLocale(locale), assetOrigin());
}

export function catalogAppResponseBody(appId: string, locale: string | null) {
  // Ids are snake case, slugs kebab case; anything else is not looked up.
  if (!/^[a-z0-9_-]{1,64}$/.test(appId)) return null;
  return publicCatalogApp(appId, parsePublicLocale(locale), assetOrigin());
}
