import { getCartScope } from "@/lib/storefront.server";
import { loadStorefrontTracking } from "@/lib/storefront-tracking.server";
import { SellerTracking } from "@/app/[locale]/storefront/[subdomain]/_components/seller-tracking.client";

/**
 * The store's own tracking apps on pages a store host shares with the
 * marketplace (checkout, order confirmation), so their InitiateCheckout and
 * Purchase reach that store's trackers (PLAN.md P7-04). The store comes from
 * the request host only; on the marketplace this renders nothing.
 */
export async function HostStoreTracking() {
  const scope = await getCartScope();
  if (!scope) return null;
  const config = await loadStorefrontTracking(scope.sellerId, scope.storeId);
  return config ? <SellerTracking config={config} /> : null;
}
