import { getBostaOverview } from "@workspace/lib/integrations/server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { BostaApp } from "./bosta.client";

/** Store › Apps › Bosta: the connect wizard, or the settings once connected (BS-06). */
export default async function StoreBostaPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const overview = await getBostaOverview(store.sellerId, store.id);

  return (
    <section className="mx-auto w-full max-w-[760px] px-3.5 pt-[22px] pb-20 sm:px-6 sm:pt-8 sm:pb-24">
      <BostaApp storeId={store.id} storeName={store.name} initial={overview} readOnly={store.status !== "active"} />
    </section>
  );
}
