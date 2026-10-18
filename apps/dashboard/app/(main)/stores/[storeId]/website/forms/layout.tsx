import { notFound } from "next/navigation";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { FormsTabs } from "./forms-tabs.client";

/** Website › Forms (PLAN.md §8.4, P4-10): forms list / editor and the submissions inbox. */
export default async function StoreFormsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  // Same rollout gate as the website editor (forms are placed with it).
  if (!storeBuilderEnabled(store.sellerId)) notFound();

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <FormsTabs storeId={store.id} />
      {children}
    </section>
  );
}
