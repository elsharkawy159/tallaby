import { loadStorePage } from "@/lib/stores/store-page.server";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { DomainSeoTabs } from "./domain-seo-tabs.client";

/** Website › Domain & SEO (PLAN.md §7.3, P4-14): Domain · SEO · Sitemap & robots. */
export default async function DomainSeoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <DomainSeoTabs storeId={store.id} />
      {children}
    </section>
  );
}
