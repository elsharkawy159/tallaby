import { cache } from "react";
import { cookies } from "next/headers";
import { getMaxStores } from "@workspace/lib/plans";
import { listStores, type StoreSummary } from "@workspace/lib/stores/server";
import { requireSeller } from "@/lib/auth/require-seller.server";

/**
 * The store the sidebar's store-scoped links open (PLAN.md §3 item 5, §7.1).
 * NAVIGATION ONLY: the cookie is a preference, never the target of a write.
 * Every store-scoped action takes an explicit storeId and runs requireStore().
 */
export const SELECTED_STORE_COOKIE = "tallaby_store";

export type SellerStores = {
  stores: StoreSummary[];
  selected: StoreSummary | null;
  maxStores: number;
};

export const getSellerStores = cache(async (): Promise<SellerStores> => {
  const seller = await requireSeller();
  const stores = await listStores(seller.sellerId);
  const wanted = (await cookies()).get(SELECTED_STORE_COOKIE)?.value;
  // An id that is not one of the seller's stores is ignored (stale or forged).
  const selected =
    stores.find((s) => s.id === wanted && s.status !== "archived") ??
    stores.find((s) => s.isPrimary) ??
    stores[0] ??
    null;
  return {
    stores,
    selected,
    maxStores: getMaxStores(seller.plan, { maxStoresOverride: seller.maxStoresOverride }),
  };
});
