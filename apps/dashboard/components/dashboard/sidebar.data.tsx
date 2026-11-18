import { loadOrderLock, requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { getLocale } from "next-intl/server";
import { TOP_UP_MIN_USD_CENTS } from "@workspace/lib/billing";
import { formatUsdShort } from "@/lib/billing/order-lock-copy.lib";
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
  // In dollars ("$5"), like the orders-lock banner (owner, 2026-11-18).
  const minTopUp = ordersLocked
    ? formatUsdShort(TOP_UP_MIN_USD_CENTS, await getLocale())
    : null;

  return (
    <Sidebar
      ordersLocked={ordersLocked}
      minTopUp={minTopUp}
      counts={counts}
      stores={stores.map(
        ({ id, name, subdomain, isPrimary, status, logoUrl, siteStatus }) => ({
          id,
          name,
          subdomain,
          isPrimary,
          status,
          logoUrl,
          siteStatus,
        }),
      )}
      selectedStoreId={selected?.id ?? null}
      maxStores={maxStores}
      features={{ storeBuilder: storeBuilderEnabled(seller.sellerId) }}
    />
  );
}
