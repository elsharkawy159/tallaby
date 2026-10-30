import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PackageSearch, Search } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Link } from "@/i18n/navigation";
import { getProducts } from "@/actions/products";
import ProductCard from "@/components/product-page/ProductCard";
import ProductsSorting from "@/components/products-list/ProductsSorting";
import {
  STORE_PAGE_SIZE,
  StorePagination,
  storeQueryHref,
  type StoreQuery,
} from "@/components/store-page/store-products";
import { ProductsGridSkeleton } from "@/components/home/products-grid.skeleton";
import type { ProductCardProps } from "@/components/product";
import type { ProductLocale } from "@/lib/product-translations";
import { storeCategoryFilter, type StorefrontCategory } from "@/lib/storefront.server";
import type { StoreCategoryFilter } from "@workspace/lib/store-sites/catalog-data";
import { storefrontSortBy } from "@/lib/store-site/featured-sort.lib";
import s from "../storefront.module.css";

export async function StorefrontCatalog({
  sellerId,
  catalogStoreId,
  locale,
  categories,
  query,
  basePath = "/",
  renderProducts,
}: {
  sellerId: string;
  /** Set when the store shows a selected catalog (D24). */
  catalogStoreId?: string;
  locale: string;
  categories: StorefrontCategory[];
  query: StoreQuery;
  /** The page pagination and "clear filters" link to (the classic home, or /products). */
  basePath?: string;
  /** Draws a page of products in the site's own card (builder sites); the default card otherwise. */
  renderProducts?: (rows: unknown[]) => ReactNode;
}) {
  const t = await getTranslations("storefront");
  const tStores = await getTranslations("pages.stores");
  const active = categories.find((c) => c.key === query.category);
  const heading = active
    ? ((locale === "ar" ? active.nameAr || active.name : active.name || active.nameAr) ?? "")
    : t("productsHeading");

  return (
    <section id="products" className="scroll-mt-20">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className={s.sectionTitle}>{heading}</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form role="search" className="relative sm:w-72">
            {query.category && <input type="hidden" name="category" value={query.category} />}
            {query.sort && <input type="hidden" name="sort" value={query.sort} />}
            <label htmlFor="storefront-search" className="sr-only">
              {t("searchPlaceholder")}
            </label>
            <Input
              id="storefront-search"
              type="search"
              name="search"
              defaultValue={query.search}
              placeholder={t("searchPlaceholder")}
              className="h-10 rounded-full bg-(--sf-shelf) pe-11 border-transparent focus-visible:border-(--sf-brand)"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute end-1 top-1/2 size-8 -translate-y-1/2 rounded-full"
            >
              <Search className="size-4" aria-hidden />
              <span className="sr-only">{tStores("searchSubmit")}</span>
            </Button>
          </form>
          <Suspense>
            <ProductsSorting featured={Boolean(active?.sellerCategoryId)} />
          </Suspense>
        </div>
      </div>

      <Suspense key={JSON.stringify(query)} fallback={<ProductsGridSkeleton />}>
        <CatalogGrid
          sellerId={sellerId}
          catalogStoreId={catalogStoreId}
          locale={locale}
          storeCategory={active ? storeCategoryFilter(active) : undefined}
          query={query}
          basePath={basePath}
          renderProducts={renderProducts}
        />
      </Suspense>
    </section>
  );
}

async function CatalogGrid({
  sellerId,
  catalogStoreId,
  locale,
  storeCategory,
  query,
  basePath,
  renderProducts,
}: {
  sellerId: string;
  catalogStoreId?: string;
  locale: string;
  storeCategory?: StoreCategoryFilter;
  query: StoreQuery;
  basePath: string;
  renderProducts?: (rows: unknown[]) => ReactNode;
}) {
  const tStores = await getTranslations("pages.stores");
  const result = await getProducts({
    sellerId,
    catalogStoreId,
    storeCategory,
    searchQuery: query.search,
    // A seller category opens on its manual order (F-24d, 0128).
    sortBy: storefrontSortBy(query.sort, storeCategory?.sellerCategoryId),
    limit: STORE_PAGE_SIZE,
    offset: (query.page - 1) * STORE_PAGE_SIZE,
    locale: locale as ProductLocale,
  });
  const products = result.success ? (result.data ?? []) : [];
  const total = result.success ? result.totalCount : 0;
  const totalPages = Math.ceil(total / STORE_PAGE_SIZE);
  const filtered = Boolean(query.category || query.search || query.page > 1);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-(--sf-shelf) px-6 py-16 text-center">
        <PackageSearch className="mb-3 size-10 text-(--sf-muted)" aria-hidden />
        <p className="text-(--sf-muted)">
          {filtered ? tStores("noMatches") : tStores("noProducts")}
        </p>
        {filtered && (
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link href={storeQueryHref(basePath, { sort: query.sort })}>{tStores("clearFilters")}</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-(--sf-muted)" aria-live="polite">
        {tStores("resultsCount", { count: total })}
        {query.search && <> {tStores("resultsFor", { query: query.search })}</>}
      </p>
      {renderProducts ? (
        renderProducts(products)
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id as string} {...(product as unknown as ProductCardProps)} />
          ))}
        </div>
      )}
      {totalPages > 1 && <StorePagination basePath={basePath} query={query} totalPages={totalPages} />}
    </>
  );
}
