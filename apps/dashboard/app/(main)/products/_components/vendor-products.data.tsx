import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { requireSeller } from "@/lib/auth/require-seller.server";
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

export async function VendorProductsData({
  searchParams,
}: {
  searchParams: Partial<Record<keyof ProductsListFilters, string | string[] | undefined>>;
}) {
  const [seller, locale, cookieStore] = await Promise.all([requireSeller(), getLocale(), cookies()]);
  const filters = parseProductsFilters(searchParams, cookieStore.get(PRODUCTS_PAGE_SIZE_COOKIE)?.value);

  const [list, counts, categories] = await Promise.all([
    listSellerProductsPage(seller.sellerId, filters, locale),
    countSellerProductsByTab(seller.sellerId),
    listSellerProductCategories(seller.sellerId, locale),
  ]);

  // Not awaited: GA4 views stream into the table cells (F-15b); never rejects.
  const viewStats = loadProductViewStats(list.products.map((p) => p.id));
  const storeLinks = await loadProductStoreLinks(list.products.map((p) => ({ id: p.id, slug: p.slug ?? null })));
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
