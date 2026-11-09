import { loadOrderLock, requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { getLocale } from "next-intl/server";
import { getMinTopUpText } from "@/lib/billing/min-top-up-egp.server";
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
  const minTopUp = ordersLocked ? await getMinTopUpText(await getLocale()) : null;

  return (
    <Sidebar
      ordersLocked={ordersLocked}
      minTopUp={minTopUp}
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
