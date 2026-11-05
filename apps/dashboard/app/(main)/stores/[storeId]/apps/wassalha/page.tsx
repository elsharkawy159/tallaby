import { getWassalhaOverview } from "@workspace/lib/integrations/server";
import { PageContainer } from "@/components/seller-ui";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { WassalhaApp } from "./wassalha.client";

/** Store › Apps › Wassalha (Egypt Post): the account printed on the export sheet (F-12c). */
export default async function StoreWassalhaPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const overview = await getWassalhaOverview(store.sellerId, store.id);

  return (
    <PageContainer className="max-w-[816px]">
      <WassalhaApp storeId={store.id} storeName={store.name} initial={overview} readOnly={store.status !== "active"} />
    </PageContainer>
  );
}
