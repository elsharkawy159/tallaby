import { serializeRobots, storeRobots } from "@/lib/sitemap/robots.lib";
import { getStoreCrawlInfo, renamedStoreFileResponse } from "@/lib/sitemap/store-sitemap.server";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

/**
 * {store host}/robots.txt (P5-04), reached only through the proxy.ts rewrite
 * on a store host; /storefront/* paths 404 on tallaby.com.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; subdomain: string }> },
) {
  const { subdomain } = await params;
  const info = await getStoreCrawlInfo(subdomain);
  if (!info) return renamedStoreFileResponse(subdomain, "/robots.txt");

  return new Response(serializeRobots(storeRobots(info.baseUrl, { indexable: info.indexable })), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
