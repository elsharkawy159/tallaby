import { loadOrderLock, requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { getMinTopUpEgp } from "@/lib/billing/min-top-up-egp.server";
import { Sidebar } from "./Sidebar";
import { storeBuilderEnabled } from "./sidebar.config";
import { getSidebarCounts } from "./sidebar.server";

export async function SidebarData() {
  // requireSeller and getSellerStores are memoized per request (the layout already gated access).
  const [seller, counts, { stores, selected, maxStores }] = await Promise.all([
    requireSeller(),
    getSidebarCounts(),
    getSellerStores(),
  ]);

  const ordersLocked = (await loadOrderLock(seller.sellerId)).ordersLocked;
  const minTopUpEgp = ordersLocked ? await getMinTopUpEgp() : null;

  return (
    <Sidebar
      ordersLocked={ordersLocked}
      minTopUpEgp={minTopUpEgp}
      counts={counts}
      stores={stores.map(({ id, name, subdomain, isPrimary, status, logoUrl, siteStatus }) => ({
        id,
        name,
        subdomain,
        isPrimary,
        status,
        logoUrl,
        siteStatus,
      }))}
      selectedStoreId={selected?.id ?? null}
      maxStores={maxStores}
      features={{ storeBuilder: storeBuilderEnabled(seller.sellerId) }}
    />
  );
}
