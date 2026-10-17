import type { Storefront } from "@/lib/storefront.server";
import { getCachedStorefrontTracking } from "@/lib/storefront-tracking.server";
import { SellerTracking } from "./seller-tracking.client";

/**
 * Loads the tracking apps of the store this host resolved to (PLAN.md P7-03).
 * The store comes from the request host via resolveStorefront (the
 * marketplace host never reaches /storefront), so another store's ids, or the
 * same seller's other store, can never render here.
 */
export async function StorefrontTracking({ store }: { store: Pick<Storefront, "id" | "storeId"> }) {
  const config = await getCachedStorefrontTracking(store.id, store.storeId);
  return <SellerTracking config={config} />;
}
