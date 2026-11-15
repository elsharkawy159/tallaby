import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { loadProductStorePage } from "@/lib/products/product-store.server";
import { loadProductStoreLinks } from "./product-store-links.data";
import { ProductViewsProvider } from "./product-views.client";
import { loadProductViewStats } from "./product-views.data";
import {
  countSellerProductsByTab,
  listSellerProductCategories,
  listSellerProductsPage,
} from "./products-list.query";
import { PRODUCTS_PAGE_SIZE_COOKIE, parseProductsFilters, type ProductsListFilters } from "./products-view.lib";
import { VendorProductsSection, type VendorProduct } from "./vendor-products.section";

/**
 * The products list of one store (ROADMAP.md F-87c slice 2): `storeId` is the
 * URL segment, checked against the session (a foreign or forged store is a
 * 404), and every read takes its `productInStore(…, managed)` condition.
 * `storeId: null` is only the old `/products` page of a seller with no store
 * yet, which lists the account catalog as it always did.
 */
export async function VendorProductsData({
  storeId,
  searchParams,
}: {
  storeId: string | null;
  searchParams: Partial<Record<keyof ProductsListFilters, string | string[] | undefined>>;
}) {
  const [scope, locale, cookieStore] = await Promise.all([
    storeId === null
      ? requireSeller().then((seller) => ({ sellerId: seller.sellerId, inStore: undefined, storeId: null }))
      : loadProductStorePage(storeId).then((ctx) => ({ sellerId: ctx.seller.sellerId, inStore: ctx.inStore, storeId: ctx.store.id })),
    getLocale(),
    cookies(),
  ]);
  const filters = parseProductsFilters(searchParams, cookieStore.get(PRODUCTS_PAGE_SIZE_COOKIE)?.value);

  const [list, counts, categories] = await Promise.all([
    listSellerProductsPage(scope.sellerId, scope.inStore, filters, locale),
    countSellerProductsByTab(scope.sellerId, scope.inStore),
    listSellerProductCategories(scope.sellerId, scope.inStore, locale),
  ]);

  // Not awaited: GA4 views stream into the table cells (F-15b); never rejects.
  const viewStats = loadProductViewStats(scope.storeId, list.products.map((p) => p.id));
  const storeLinks = await loadProductStoreLinks(
    list.products.map((p) => ({ id: p.id, slug: p.slug ?? null })),
    scope.storeId,
  );
  const rows: VendorProduct[] = list.products.map((p) => ({ ...p, storeUrl: storeLinks.get(p.id) ?? null }));

  return (
    <ProductViewsProvider stats={viewStats}>
      <VendorProductsSection
        products={rows}
        total={list.total}
        counts={counts}
        categories={categories}
        filters={{ ...filters, page: list.page }}
        pages={list.pages}
      />
    </ProductViewsProvider>
  );
}
