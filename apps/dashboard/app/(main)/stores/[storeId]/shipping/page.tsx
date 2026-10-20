import { getStoreShipping } from "@workspace/lib/stores/server";
import { notFound } from "next/navigation";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { StoreShippingSettings } from "./shipping.client";

export default async function StoreShippingPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const shipping = await getStoreShipping(store.sellerId, store.id);
  if (!shipping) notFound();

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <StoreShippingSettings storeId={store.id} initial={shipping} readOnly={store.status !== "active"} />
    </section>
  );
}
