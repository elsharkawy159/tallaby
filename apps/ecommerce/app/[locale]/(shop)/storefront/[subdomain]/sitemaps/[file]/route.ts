import { chunkEntries, serializeUrlset } from "@/lib/sitemap/sitemap.lib";
import { getStoreSitemapDataset } from "@/lib/sitemap/store-sitemap.server";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

/** {store host}/sitemaps/1.xml …, only once a store outgrows one sitemap file. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; subdomain: string; file: string }> },
) {
  const { subdomain, file } = await params;
  const match = /^([1-9]\d*)\.xml$/.exec(file);
  if (!match) return new Response("Not found", { status: 404 });

  const dataset = await getStoreSitemapDataset(subdomain);
  if (!dataset) return new Response("Not found", { status: 404 });
  const chunks = chunkEntries(dataset.entries);
  const index = Number(match[1]) - 1;
  if (chunks.length === 1 || index >= chunks.length) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(serializeUrlset(chunks[index]!), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
