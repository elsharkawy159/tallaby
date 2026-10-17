import { notFound } from "next/navigation";
import { listStoreIntegrations } from "@workspace/lib/integrations/server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { StoreApps } from "./apps.client";

export default async function StoreAppsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const integrations = await listStoreIntegrations(store.sellerId, store.id);
  if (!integrations) notFound();

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <StoreApps storeId={store.id} initial={integrations} readOnly={store.status !== "active"} />
    </section>
  );
}
