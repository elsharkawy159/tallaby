import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
 * The overview draws its own heading (Claude Design "Seller Website", 2026-10-28).
 */
export default async function WebsiteOverviewPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadWebsiteStore(storeId);
  const data = await loadWebsiteOverview(store);

  return (
    <section className="mx-auto w-full max-w-[1440px] p-3.5 sm:p-6 lg:px-8 lg:py-7">
      <WebsiteOverview data={data} />
    </section>
  );
}
