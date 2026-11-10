import { getSellerStores } from "@/lib/stores/current-store.server";
import { storeProductsHref } from "./product-routes.lib";

/**
 * A Products link from a page that is not under a store (home, reports): the
 * sidebar's selected store's Products pages (F-87c), else the old path. The
 * selected store only ever is one of the session seller's own stores, and this
 * is navigation only.
 */
export async function selectedStoreProductsHref(sub = ""): Promise<string> {
  const { selected } = await getSellerStores();
  return storeProductsHref(selected?.id ?? null, sub);
}
