import { cache } from "react";
import { cookies } from "next/headers";
import { isProActive } from "@workspace/lib/billing";
import { getMaxStores, PLANS } from "@workspace/lib/plans";
import { listStores, type StoreSummary } from "@workspace/lib/stores/server";
import { loadSeller, requireSeller } from "@/lib/auth/require-seller.server";

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
  /** Pro's store limit when moving to Pro would raise this seller's limit, else null. */
  upgradeMaxStores: number | null;
};

export const getSellerStores = cache(async (): Promise<SellerStores> => {
  const seller = await requireSeller();
  // loadSeller is per-request cached: requireSeller already read this row.
  const [stores, account] = await Promise.all([listStores(seller.sellerId), loadSeller(seller.userId)]);
  // The plan that applies now: a lapsed Pro gets Free's limit before the renewal job runs.
  const plan = account && isProActive(account) ? "pro" : "free";
  const wanted = (await cookies()).get(SELECTED_STORE_COOKIE)?.value;
  // An id that is not one of the seller's stores is ignored (stale or forged).
  const selected =
    stores.find((s) => s.id === wanted && s.status !== "archived") ??
    stores.find((s) => s.isPrimary) ??
    stores[0] ??
    null;
  const maxStores = getMaxStores(plan, { maxStoresOverride: seller.maxStoresOverride });
  return {
    stores,
    selected,
    maxStores,
    upgradeMaxStores: plan === "free" && maxStores < PLANS.pro.maxStores ? PLANS.pro.maxStores : null,
  };
});
