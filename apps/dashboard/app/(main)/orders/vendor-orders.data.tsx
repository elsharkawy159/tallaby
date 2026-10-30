import { listSellerBostaStores, listSellerStoresWith } from "@workspace/lib/integrations/server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { loadSellerOrders } from "./orders.query";
import { VendorOrdersTable } from "./orders-chunks";

export async function VendorOrdersData({
  initialOrderId = null,
}: {
  initialOrderId?: string | null;
}) {
  const [{ sellerId }, { stores }] = await Promise.all([requireSeller(), getSellerStores()]);
  const [bostaStores, wassalhaStores] = await Promise.all([
    listSellerBostaStores(sellerId),
    listSellerStoresWith(sellerId, "wassalha"),
  ]);
  const rows = await loadSellerOrders(sellerId, stores, bostaStores, wassalhaStores);

  return (
    <VendorOrdersTable
      key={initialOrderId ?? "all"}
      rows={rows}
      initialOrderId={initialOrderId}
      stores={stores.map(({ id, name }) => ({ id, name }))}
    />
  );
}
