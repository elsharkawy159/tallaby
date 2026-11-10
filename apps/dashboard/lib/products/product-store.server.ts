import type { SQL } from "drizzle-orm";
import { productInStore, storeHasProduct } from "@workspace/lib/stores/scope/server";
import type { AccessOptions } from "@/lib/auth/access.lib";
import { AccessError, requireStore, type SellerContext, type StoreContext } from "@/lib/auth/require-seller.server";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";

/**
 * Store authorization for dashboard product writes (ROADMAP.md F-87c slice 1;
 * docs/plans/stores-separation-f87c-slices.md; CLAUDE.md rule 5).
 *
 * Every product action takes an explicit `storeId` from its caller. It is
 * checked here against the session's seller (`requireStore`: a foreign,
 * deleted or forged store is `not_found`), and every product id against that
 * store with the shared `productInStore` condition, scope `managed`:
 * - before the catalog split (switch off): the product is the store's
 *   seller's, exactly today's account rule;
 * - after it: `products.store_id` is the store.
 * The `tallaby_store` cookie only picks where links go; it is never read here.
 */

export type ProductStoreContext = {
  seller: SellerContext;
  store: StoreContext;
  catalogSplit: boolean;
  /** `productInStore(store.id, { catalogSplit, scope: 'managed' })`, for a WHERE on `products`. */
  inStore: SQL;
};

/** The store named by the request, owned by the session's seller, with the product condition for it. */
export async function requireProductStore(storeId: unknown, options: AccessOptions = {}): Promise<ProductStoreContext> {
  const { seller, store } = await requireStore(typeof storeId === "string" ? storeId : "", options);
  const catalogSplit = await isSwitchOn("stores_catalog_split");
  return { seller, store, catalogSplit, inStore: productInStore(store.id, { catalogSplit, scope: "managed" }) };
}

/** `requireProductStore` plus one product: a product outside the store is `not_found` (never says which). */
export async function requireStoreProduct(
  storeId: unknown,
  productId: unknown,
  options: AccessOptions = {},
): Promise<ProductStoreContext> {
  const ctx = await requireProductStore(storeId, options);
  const ok =
    typeof productId === "string" &&
    (await storeHasProduct(ctx.store.id, productId, { catalogSplit: ctx.catalogSplit, scope: "managed" }));
  if (!ok) throw new AccessError("not_found");
  return ctx;
}
