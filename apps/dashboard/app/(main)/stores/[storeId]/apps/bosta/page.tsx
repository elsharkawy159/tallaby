import { getBostaOverview } from "@workspace/lib/integrations/server";
import { PageContainer } from "@/components/seller-ui";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { BostaApp } from "./bosta.client";

/** Store › Apps › Bosta: the connect wizard, or the settings once connected (BS-06). */
export default async function StoreBostaPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const overview = await getBostaOverview(store.sellerId, store.id);

  return (
    <PageContainer className="max-w-[816px]">
      <BostaApp storeId={store.id} storeName={store.name} initial={overview} readOnly={store.status !== "active"} />
    </PageContainer>
  );
}
