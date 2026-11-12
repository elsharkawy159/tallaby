import "server-only";
import { agentListStoreCategories, agentSearchProducts } from "@workspace/lib/products/agent/server";
import { requireStoreProductsAccess } from "./store-products-access.server";
import { STORE_PRODUCTS_PAGE_SIZE, type StoreProductStatusFilter } from "./store-products.lib";

/**
 * One page of a store's products for Admin, through the shared store-scoped
 * search (only products in this store; after the catalog split, store_id =
 * the store), plus the store's own categories for the create form.
 */
export async function loadStoreProducts(storeId: string, params: { query: string; status: StoreProductStatusFilter; page: number }) {
  const access = await requireStoreProductsAccess(storeId, { forWrite: false });
  const [list, storeCategories] = await Promise.all([
    agentSearchProducts(access.ctx, {
      storeId: access.store.id,
      query: params.query || undefined,
      status: params.status === "all" ? undefined : params.status,
      limit: STORE_PRODUCTS_PAGE_SIZE,
      cursor: (params.page - 1) * STORE_PRODUCTS_PAGE_SIZE,
    }),
    agentListStoreCategories(access.ctx),
  ]);
  return {
    store: access.store,
    canWrite: access.canWrite,
    sellerCanPublish: access.ctx.sellerStatus === "approved",
    storeCategories: storeCategories.map((c) => ({ id: c.id, name: c.name, nameAr: c.nameAr, products: c.products })),
    ...list,
  };
}

export type StoreProductsPage = Awaited<ReturnType<typeof loadStoreProducts>>;
