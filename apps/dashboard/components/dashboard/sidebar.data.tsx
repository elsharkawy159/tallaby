import { loadOrderLock, requireSeller } from "@/lib/auth/require-seller.server";
import { getSessionUser } from "@/lib/auth/session.server";
import { isSupportAccount } from "@/lib/auth/support-accounts.lib";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { getLocale } from "next-intl/server";
import { TOP_UP_MIN_USD_CENTS } from "@workspace/lib/billing";
import { formatUsdShort } from "@/lib/billing/order-lock-copy.lib";
import { Sidebar } from "./Sidebar";
import { storeBuilderEnabled } from "./sidebar.config";
import { getSidebarCounts } from "./sidebar.server";
import { storeHasTallabyPay } from "@workspace/lib/tallaby-pay/server";

export async function SidebarData() {
  // requireSeller and getSellerStores are memoized per request (the layout already gated access).
  // getSessionUser is memoized too (requireSeller already read it), so the email costs no extra call.
  const [seller, counts, { stores, selected, maxStores }, user] = await Promise.all([
    requireSeller(),
    getSidebarCounts(),
    getSellerStores(),
    getSessionUser(),
  ]);

  const [ordersLocked, tallabyPayEarnings] = await Promise.all([
    loadOrderLock(seller.sellerId).then((lock) => lock.ordersLocked),
    // Earnings shows only for a store with Tallaby Pay on or an earnings wallet (F-100f). Never cached (rule 8);
    // a failed read (e.g. before migration 0175) just hides the link.
    selected ? storeHasTallabyPay(seller.sellerId, selected.id).catch(() => false) : false,
  ]);
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
      // Only the boolean reaches the client, never the account list.
      supportTools={isSupportAccount(user?.email)}
      features={{ storeBuilder: storeBuilderEnabled(seller.sellerId), tallabyPayEarnings }}
    />
  );
}
