import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { loadWebsitePages, loadWebsiteStore } from "../website.data";
import { WebsitePages } from "./pages.client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("websitePages");
  return { title: t("title") };
}

/** Website › Pages (PLAN.md P4-17). */
export default async function WebsitePagesPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadWebsiteStore(storeId);
  const pages = await loadWebsitePages(store);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <WebsitePages storeId={store.id} initial={pages} readOnly={store.status !== "active"} />
    </section>
  );
}
