import { loadStorePage } from "@/lib/stores/store-page.server";
import { loadCrawlStatus } from "../domain-seo.data";
import { CrawlStatusView } from "./crawl-status.client";

export default async function StoreSitemapPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const status = await loadCrawlStatus(store);
  return <CrawlStatusView storeId={store.id} status={status} />;
}
