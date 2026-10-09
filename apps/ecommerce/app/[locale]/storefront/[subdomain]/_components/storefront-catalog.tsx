import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { PackageSearch, Search } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Link } from "@/i18n/navigation";
import { getProducts } from "@/actions/products";
import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import ProductsSorting from "@/app/[locale]/(main)/products/_components/ProductsSorting";
import {
  SORT_MAP,
  STORE_PAGE_SIZE,
  StorePagination,
  storeQueryHref,
  type StoreQuery,
} from "@/app/[locale]/(main)/stores/[slug]/_components/store-products";
import { ProductsGridSkeleton } from "@/components/home/products-grid.skeleton";
import type { ProductCardProps } from "@/components/product";
import type { ProductLocale } from "@/lib/product-translations";
import type { StorefrontCategory } from "@/lib/storefront.server";
import s from "../storefront.module.css";

export async function StorefrontCatalog({
  sellerId,
  locale,
  categories,
  query,
}: {
  sellerId: string;
  locale: string;
  categories: StorefrontCategory[];
  query: StoreQuery;
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
            <ProductsSorting />
          </Suspense>
        </div>
      </div>

      <Suspense key={JSON.stringify(query)} fallback={<ProductsGridSkeleton />}>
        <CatalogGrid
          sellerId={sellerId}
          locale={locale}
          categoryIds={active?.categoryIds}
          query={query}
        />
      </Suspense>
    </section>
  );
}

async function CatalogGrid({
  sellerId,
  locale,
  categoryIds,
  query,
}: {
  sellerId: string;
  locale: string;
  categoryIds?: string[];
  query: StoreQuery;
}) {
  const tStores = await getTranslations("pages.stores");
  const result = await getProducts({
    sellerId,
    categoryIds,
    searchQuery: query.search,
    sortBy: SORT_MAP[query.sort as keyof typeof SORT_MAP] ?? "popular",
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
            <Link href={storeQueryHref("/", { sort: query.sort })}>{tStores("clearFilters")}</Link>
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id as string} {...(product as unknown as ProductCardProps)} />
        ))}
      </div>
      {totalPages > 1 && <StorePagination basePath="/" query={query} totalPages={totalPages} />}
    </>
  );
}
