import { getSitemapDataset } from "@/lib/sitemap/sitemap.server";
import {
  chunkEntries,
  latestModified,
  serializeSitemapIndex,
  serializeUrlset,
} from "@/lib/sitemap/sitemap.lib";

// Regenerated from the database at most hourly (ISR); new or changed
// products show up within this window. No URL is HTTP-checked here — see
// scripts/audit-sitemap.mjs (pnpm audit:sitemap) for URL validation.
export const revalidate = 3600;

/**
 * A single <urlset> while the catalog fits the protocol limits (50,000 URLs /
 * 50 MB per file); beyond that, a <sitemapindex> of /sitemaps/[n].xml files.
 * Hand-rolled instead of app/sitemap.ts because Next's generateSitemaps()
 * doesn't serve an index at /sitemap.xml, the URL robots.txt and Search
 * Console already point at.
 */
export async function GET() {
  const { entries, baseUrl } = await getSitemapDataset();
  const chunks = chunkEntries(entries);

  const body =
    chunks.length === 1
      ? serializeUrlset(chunks[0]!)
      : serializeSitemapIndex(
          chunks.map((chunk, i) => ({
            url: `${baseUrl}/sitemaps/${i + 1}.xml`,
            lastModified: latestModified(chunk),
          }))
        );

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
