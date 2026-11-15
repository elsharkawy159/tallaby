import { getTranslations } from "next-intl/server";
import { logServerError } from "@workspace/db/log";
import { PageContainer, PageHeader } from "@/components/seller-ui";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { parseStoreViewsRange, type StoreViewsReport } from "@/lib/analytics/store-views.lib";
import { getStoreViews, isStoreViewsConfigured } from "@/lib/analytics/store-views.server";
import { StoreViews } from "./analytics.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Store › Analytics: views of the store's website from Tallaby's GA4 (PLAN.md SA-01). */
export default async function StoreAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const [{ storeId }, query] = await Promise.all([params, searchParams]);
  const store = await loadStorePage(storeId);
  const range = parseStoreViewsRange(query.range);
  const t = await getTranslations("storeAnalytics");

  let report: StoreViewsReport | null = null;
  let state: "ready" | "notConfigured" | "error" = "ready";
  if (!isStoreViewsConfigured()) {
    state = "notConfigured";
  } else {
    try {
      report = await getStoreViews(store.sellerId, store.id, range);
    } catch (error) {
      logServerError("integration", "store views load failed", { storeId: store.id, range }, error);
      state = "error";
    }
  }

  return (
    <PageContainer>
      <PageHeader className="sui-rise" title={t("title")} description={t("description", { store: store.name })} />
      <StoreViews storeId={store.id} range={range} report={report} state={state} offline={store.siteStatus !== "published"} />
    </PageContainer>
  );
}
