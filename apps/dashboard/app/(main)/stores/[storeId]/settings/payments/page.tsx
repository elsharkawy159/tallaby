import { parseStoreCurrency } from "@workspace/lib";
import { getBillingState } from "@workspace/lib/billing/server";
import { parseStorePayments } from "@workspace/lib/payments/store-methods";
import { getStoreGatewayOverview } from "@workspace/lib/payments/store-gateways/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StorePaymentsSettings } from "./payments.client";

export default async function StorePaymentsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const payments = parseStorePayments((store.settings as Record<string, unknown> | null)?.payments);
  // loadStorePage already handled access; this only reads the session seller.
  const { seller } = await requireStore(store.id);
  const { usdLive } = await getBillingState();
  const gateways = (await getStoreGatewayOverview(seller.sellerId, store.id)) ?? { connected: null, webhooksReady: false };

  return <StorePaymentsSettings money={parseStoreCurrency(store.settings)} usdLive={usdLive} storeId={store.id} initial={payments} gateways={gateways} readOnly={store.status !== "active"} />;
}
