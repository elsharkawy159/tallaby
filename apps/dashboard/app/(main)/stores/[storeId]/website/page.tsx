import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { WebsiteOverview } from "./website-overview.client";
import { loadWebsiteOverview, loadWebsiteStore } from "./website.data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("websiteOverview");
  return { title: t("title") };
}

/**
 * Website › Overview (PLAN.md P4-12): live address, publish state, Edit ·
 * Preview · Publish, revision history and links to the other Website pages.
 * Every button calls the store-scoped editor actions, which re-check the store.
 */
export default async function WebsiteOverviewPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadWebsiteStore(storeId);
  const data = await loadWebsiteOverview(store);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <WebsiteOverview data={data} />
    </section>
  );
}
