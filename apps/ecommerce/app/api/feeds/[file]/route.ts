import type { NextRequest } from "next/server";
import {
  buildProductItems,
  FEED_ITEM_LIMIT,
  FEED_XML_FOOTER,
  feedCsvHeader,
  feedCsvRow,
  feedLocale,
  feedXmlHeader,
  feedXmlItem,
  parseFeedFile,
} from "@/lib/product-feed/product-feed.lib";
import { feedProductPages, getRequestFeedStore } from "@/lib/product-feed/product-feed.server";
import { renamedStoreFileResponse } from "@/lib/sitemap/store-sitemap.server";

// The store comes from the request host, so this runs per request; the
// product pages it reads are cached (product-feed.server.ts).
export const dynamic = "force-dynamic";

const notFound = () =>
  new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

/**
 * A store's product feed (ROADMAP.md F-11a), for Meta Commerce, Google
 * Merchant Center and TikTok catalog:
 *
 *   {store host}/api/feeds/products.xml   RSS 2.0 + g: namespace
 *   {store host}/api/feeds/products.csv   the same columns as CSV
 *   ?lang=en | ?lang=ar                   content language (default: the store's first language)
 *
 * The store is the one the HOST serves (subdomain or active custom domain);
 * nothing in the URL names a store or seller. tallaby.com, unknown hosts and
 * offline stores (never published, or switched off) get a 404; a store's
 * old subdomain redirects to its current address.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const format = parseFeedFile(file);
  if (!format) return notFound();

  const resolved = await getRequestFeedStore();
  if (!resolved) return notFound();
  if (!resolved.feed) {
    const renamed = await renamedStoreFileResponse(resolved.subdomain, `/api/feeds/${file}${request.nextUrl.search}`);
    return renamed.status === 308 ? renamed : notFound();
  }

  const { store, info } = resolved.feed;
  const locale = feedLocale(request.nextUrl.searchParams.get("lang"), store.supportedLocales);
  const pages = feedProductPages(store);
  const encoder = new TextEncoder();

  // Streamed page by page, so a large catalog never sits in memory as one string.
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(format === "xml" ? feedXmlHeader(info) : feedCsvHeader()));
        let count = 0;
        outer: for await (const page of pages) {
          for (const product of page) {
            for (const item of buildProductItems(product, locale, info)) {
              if (count >= FEED_ITEM_LIMIT) break outer;
              controller.enqueue(encoder.encode(format === "xml" ? feedXmlItem(item) : feedCsvRow(item)));
              count += 1;
            }
          }
        }
        if (format === "xml") controller.enqueue(encoder.encode(FEED_XML_FOOTER));
        controller.close();
      } catch (error) {
        console.error("[product-feed] failed", { storeId: store.storeId, error });
        controller.error(error);
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": format === "xml" ? "application/xml; charset=utf-8" : "text/csv; charset=utf-8",
      // Platforms fetch a feed a few times a day; the CDN copy is per host and short,
      // so a store switched offline stops serving it within minutes.
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=900",
      "X-Robots-Tag": "noindex",
    },
  });
}
