import { chunkEntries, latestModified, serializeSitemapIndex, serializeUrlset } from "@/lib/sitemap/sitemap.lib";
import { getStoreSitemapDataset, renamedStoreFileResponse } from "@/lib/sitemap/store-sitemap.server";

// Same window as the marketplace sitemap; store settings, catalog and publish
// changes also purge it through the tags of the data it reads.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

/**
 * {store host}/sitemap.xml (P5-04): home, published builder pages and the
 * store's products on the store's canonical host. An empty <urlset> for a
 * store kept out of search (no products, indexing off). Reached only through
 * the proxy.ts rewrite on a store host.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; subdomain: string }> },
) {
  const { subdomain } = await params;
  const dataset = await getStoreSitemapDataset(subdomain);
  if (!dataset) return renamedStoreFileResponse(subdomain, "/sitemap.xml");

  const chunks = chunkEntries(dataset.entries);
  const body =
    chunks.length === 1
      ? serializeUrlset(chunks[0]!)
      : serializeSitemapIndex(
          chunks.map((chunk, i) => ({
            url: `${dataset.baseUrl}/sitemaps/${i + 1}.xml`,
            lastModified: latestModified(chunk),
          })),
        );

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
