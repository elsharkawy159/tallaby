import { getWassalhaOverview } from "@workspace/lib/integrations/server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { WassalhaApp } from "./wassalha.client";

/** Store › Apps › Wassalha (Egypt Post): the account printed on the export sheet (F-12c). */
export default async function StoreWassalhaPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const overview = await getWassalhaOverview(store.sellerId, store.id);

  return (
    <section className="mx-auto w-full max-w-[760px] px-3.5 pt-[22px] pb-20 sm:px-6 sm:pt-8 sm:pb-24">
      <WassalhaApp storeId={store.id} storeName={store.name} initial={overview} readOnly={store.status !== "active"} />
    </section>
  );
}
