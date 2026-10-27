import { getTranslations } from "next-intl/server";
import { logServerError } from "@workspace/db/log";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { parseStoreViewsRange, type StoreViewsReport } from "@/lib/analytics/store-views.lib";
import { getStoreViews, isStoreViewsConfigured } from "@/lib/analytics/store-views.server";
import { StoreViews } from "./analytics.client";

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
    <section className="mx-auto w-full max-w-[1120px] px-3.5 pt-[22px] pb-20 sm:px-6 sm:pt-8 sm:pb-24">
      <header className="mb-5">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description", { store: store.name })}</p>
      </header>
      <StoreViews
        storeId={store.id}
        range={range}
        report={report}
        state={state}
        offline={store.siteStatus !== "published"}
      />
    </section>
  );
}
