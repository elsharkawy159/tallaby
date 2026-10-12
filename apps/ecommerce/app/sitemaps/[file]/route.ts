import { getSitemapDataset } from "@/lib/sitemap/sitemap.server";
import { chunkEntries, serializeUrlset } from "@/lib/sitemap/sitemap.lib";

export const revalidate = 3600;
export const dynamicParams = true;

// Chunk files only exist once the catalog outgrows one sitemap; render them
// on demand and cache via ISR rather than at build time.
export async function generateStaticParams() {
  return [];
}

/** /sitemaps/1.xml … listed by the index at /sitemap.xml. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const match = /^([1-9]\d*)\.xml$/.exec(file);
  if (!match) return new Response("Not found", { status: 404 });

  const { entries } = await getSitemapDataset();
  const chunks = chunkEntries(entries);
  const index = Number(match[1]) - 1;
  // With a single chunk /sitemap.xml is the urlset itself; a /sitemaps/1.xml
  // copy would just be a duplicate sitemap.
  if (chunks.length === 1 || index >= chunks.length) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(serializeUrlset(chunks[index]!), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
