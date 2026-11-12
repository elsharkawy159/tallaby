import { getLocale } from "next-intl/server";
import { asc, db, sellerProductCategories } from "@workspace/db";
import { listStoreAppInstalls } from "@workspace/lib/billing/apps";
import { SIZE_CHART_APP, listStoreSizeCharts } from "@workspace/lib/size-charts/server";
import { taxonomyInStore } from "@workspace/lib/stores/scope/server";
import { PageContainer } from "@/components/seller-ui";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { SizeChartApp } from "./size-chart.client";

/**
 * Store › Apps › Size chart (ROADMAP.md F-92): install the app, build charts
 * from Tallaby's templates, and apply each to products or store categories.
 * The storefront shows "Find my size" on those products' pages.
 */
export default async function StoreSizeChartPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const scope = { sellerId: store.sellerId, storeId: store.id };
  const [locale, installs, catalogSplit] = await Promise.all([getLocale(), listStoreAppInstalls(store.sellerId, store.id), isSwitchOn("stores_catalog_split")]);
  const [charts, categories] = await Promise.all([
    listStoreSizeCharts(scope, locale),
    db
      .select({ id: sellerProductCategories.id, name: sellerProductCategories.name, nameAr: sellerProductCategories.nameAr })
      .from(sellerProductCategories)
      .where(taxonomyInStore(sellerProductCategories, { ...scope, catalogSplit }))
      .orderBy(asc(sellerProductCategories.position), asc(sellerProductCategories.name))
      .limit(300),
  ]);

  return (
    <PageContainer className="max-w-[960px]">
      <SizeChartApp
        storeId={store.id}
        storeName={store.name}
        installed={installs.some((install) => install.appKey === SIZE_CHART_APP)}
        readOnly={store.status !== "active"}
        charts={charts}
        categories={categories.map((c) => ({ id: c.id, name: (locale === "ar" ? c.nameAr || c.name : c.name || c.nameAr) ?? "" }))}
      />
    </PageContainer>
  );
}
