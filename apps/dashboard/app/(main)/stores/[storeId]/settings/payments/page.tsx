import { parseStorePayments } from "@workspace/lib/payments/store-methods";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StorePaymentsSettings } from "./payments.client";

export default async function StorePaymentsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const payments = parseStorePayments((store.settings as Record<string, unknown> | null)?.payments);

  return <StorePaymentsSettings storeId={store.id} storeName={store.name} initial={payments} readOnly={store.status !== "active"} />;
}
