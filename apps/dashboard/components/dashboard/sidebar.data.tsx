import { loadOrderLock, requireSeller } from "@/lib/auth/require-seller.server";
import { getSessionUser } from "@/lib/auth/session.server";
import { isSupportAccount } from "@/lib/auth/support-accounts.lib";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { getSelectedStoreLink } from "@/lib/stores/store-link.server";
import { getStoreShippingMode } from "@workspace/lib/stores/server";
import { getLocale } from "next-intl/server";
import { TOP_UP_MIN_USD_CENTS } from "@workspace/lib/billing";
import { formatUsdShort } from "@/lib/billing/order-lock-copy.lib";
import { Sidebar } from "./Sidebar";
import { storeBuilderEnabled } from "./sidebar.config";
import { getSidebarCounts } from "./sidebar.server";
import { storeHasTallabyPayOn } from "./sidebar-tallaby-pay.server";

export async function SidebarData() {
  // requireSeller and getSellerStores are memoized per request (the layout already gated access).
  // getSessionUser is memoized too (requireSeller already read it), so the email costs no extra call.
  // The lock and the Tallaby Pay read start as soon as their inputs resolve, alongside the rest.
  const sellerRead = requireSeller();
  const storesRead = getSellerStores();
  const [seller, counts, { stores, selected, maxStores }, user, lock, tallabyPayEarnings, storeLink, selfDelivery] = await Promise.all([
    sellerRead,
    getSidebarCounts(),
    storesRead,
    getSessionUser(),
    sellerRead.then((s) => loadOrderLock(s.sellerId)),
    // Earnings shows only for a store with Tallaby Pay on as a payment method (owner, 2026-11-27; the page
    // stays open by URL). Never cached (rule 8); a failed read just hides the link.
    Promise.all([sellerRead, storesRead]).then(([s, { selected: store }]) =>
      store ? storeHasTallabyPayOn(s.sellerId, store.id).catch(() => false) : false,
    ),
    // The eye beside the collapse button (owner, 2026-11-27); per-request memo, the header read it too.
    getSelectedStoreLink().catch(() => null),
    // Riders shows only while the selected store ships its orders itself (owner, 2026-11-27; the page stays
    // open by URL). Scoped to the seller and the store, never cached (rules 5, 8); a failed read hides it.
    Promise.all([sellerRead, storesRead]).then(([s, { selected: store }]) =>
      store ? getStoreShippingMode(s.sellerId, store.id).then((mode) => mode === "self", () => false) : false,
    ),
  ]);
  const ordersLocked = lock.ordersLocked;
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
      storeHref={storeLink?.href ?? null}
      // A seller whose trial days ended without a top-up has every store offline (owner, 2026-11-17).
      siteLive={selected?.siteStatus === "published" && !lock.storeOffline}
      maxStores={maxStores}
      // Only the boolean reaches the client, never the account list.
      supportTools={isSupportAccount(user?.email)}
      features={{ storeBuilder: storeBuilderEnabled(seller.sellerId), tallabyPayEarnings, selfDelivery }}
    />
  );
}
