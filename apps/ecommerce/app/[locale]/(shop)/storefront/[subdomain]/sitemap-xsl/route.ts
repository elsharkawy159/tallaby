import { getStorefrontBySubdomain } from "@/lib/storefront.server";
import { SITEMAP_XSL_HEADERS, sitemapStylesheet } from "@/lib/sitemap/sitemap-xsl.lib";

// Cached per store (the path has the subdomain), refreshed with the store's
// profile tags when the seller renames it, like robots.txt and sitemap.xml.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

/**
 * {store host}/sitemap.xsl (2026-11-09): the readable sitemap page titled
 * "Sitemap — {store name}". Reached only through the proxy.ts rewrite on a
 * store host, so the store comes from the request host. Anything unknown gets
 * the plain Tallaby stylesheet: a stylesheet never 404s under a sitemap.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; subdomain: string }> },
) {
  const { subdomain } = await params;
  const store = await getStorefrontBySubdomain(subdomain).catch(() => null);
  return new Response(sitemapStylesheet(store?.displayName ?? null), {
    headers: { ...SITEMAP_XSL_HEADERS, "Cache-Control": "public, max-age=3600" },
  });
}
