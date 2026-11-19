import { SITEMAP_XSL_HEADERS, sitemapStylesheet } from "@/lib/sitemap/sitemap-xsl.lib";

// tallaby.com's sitemap stylesheet (lib/sitemap/sitemap-xsl.lib.ts). A store
// host gets its own, with the store's name, from storefront/[subdomain]/sitemap-xsl
// (proxy.ts rewrites /sitemap.xsl there).
export const dynamic = "force-static";

const XSL = sitemapStylesheet(null);

export function GET() {
  return new Response(XSL, {
    headers: { ...SITEMAP_XSL_HEADERS, "Cache-Control": "public, max-age=86400" },
  });
}
