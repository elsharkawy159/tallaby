import { getMarketingSitemapEntries } from "@/lib/marketing/sitemap.server";
import { serializeMarketingSitemap } from "@/lib/marketing/sitemap.lib";

/**
 * tallaby.com's /sitemap.xml. A route handler instead of `app/sitemap.ts`
 * because Next's metadata route can't add the `<?xml-stylesheet?>` instruction
 * that lets a person opening it in a browser see a readable page
 * (app/sitemap.xsl). Same entries and XML as the metadata route wrote.
 *
 * Caching matches the metadata route it replaces: static (built once, then
 * revalidated only by the cached queries it reads), dropping to dynamic only
 * if a request-time API is used. `revalidate = false` turns on static
 * generation while keeping that "auto" tracking; a plain GET handler would
 * run on every request.
 */
export const revalidate = false;

export async function GET() {
  const xml = serializeMarketingSitemap(await getMarketingSitemapEntries());
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      // The header Next's sitemap metadata route sent.
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
