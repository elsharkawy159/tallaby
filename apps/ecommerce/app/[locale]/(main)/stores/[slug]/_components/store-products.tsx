import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight, PackageSearch, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { getProducts } from "@/actions/products";
import type { SellerStoreCategory } from "@/actions/seller";
import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import ProductsSorting from "@/app/[locale]/(main)/products/_components/ProductsSorting";
import { ProductsGridSkeleton } from "@/components/home/products-grid.skeleton";
import type { ProductCardProps } from "@/components/product";
import type { ProductLocale } from "@/lib/product-translations";

export const STORE_PAGE_SIZE = 24;

export type StoreQuery = {
  category?: string;
  search?: string;
  sort?: string;
  page: number;
};

/** Store URL with only the params that differ from the defaults. */
export function storeHref(
  slug: string,
  params: Partial<StoreQuery> & { tab?: string },
) {
  return storeQueryHref(`/stores/${slug}`, params);
}

/** `basePath` plus only the store params that differ from the defaults. */
export function storeQueryHref(
  basePath: string,
  params: Partial<StoreQuery> & { tab?: string },
) {
  const qs = new URLSearchParams();
  if (params.tab) qs.set("tab", params.tab);
  if (params.category) qs.set("category", params.category);
  if (params.search) qs.set("search", params.search);
  if (params.sort) qs.set("sort", params.sort);
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const query = qs.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
}

export const SORT_MAP = {
  "price-low": "price_asc",
  "price-high": "price_desc",
  rating: "rating",
  newest: "newest",
  popularity: "popular",
} as const;

export async function StoreProducts({
  slug,
  sellerId,
  storeName,
  locale,
  categories,
  query,
  hasProducts,
}: {
  slug: string;
  sellerId: string;
  storeName: string;
  /** False hides search and sort, which have nothing to act on. */
  hasProducts: boolean;
  locale: string;
  categories: SellerStoreCategory[];
  query: StoreQuery;
}) {
  const t = await getTranslations("pages.stores");
  const label = (c: SellerStoreCategory) =>
    (locale === "ar" ? c.nameAr || c.name : c.name || c.nameAr) ?? "";

  return (
    <section className="mt-8">
      {hasProducts && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {categories.length > 0 ? (
            <nav
              aria-label={t("filterByCategory")}
              className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0"
            >
              <ul className="flex w-max gap-2">
                {[
                  {
                    key: undefined,
                    text: t("allCategories"),
                    count: undefined,
                  },
                  ...categories.map((c) => ({
                    key: c.key,
                    text: label(c),
                    count: c.productCount,
                  })),
                ].map((chip) => {
                  const active = query.category === chip.key;
                  return (
                    <li key={chip.key ?? "all"}>
                      <Link
                        href={storeHref(slug, {
                          ...query,
                          category: chip.key,
                          page: 1,
                        })}
                        aria-current={active ? "true" : undefined}
                        scroll={false}
                        className={cn(
                          "flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-card hover:border-primary/50",
                        )}
                      >
                        {chip.text}
                        {chip.count != null && (
                          <span
                            className={cn(
                              "tabular-nums",
                              active ? "opacity-80" : "text-muted-foreground",
                            )}
                          >
                            {chip.count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : (
            <div />
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <form
              role="search"
              className="relative flex-1 sm:w-72 sm:flex-none"
            >
              {query.category && (
                <input type="hidden" name="category" value={query.category} />
              )}
              {query.sort && (
                <input type="hidden" name="sort" value={query.sort} />
              )}
              <label htmlFor="store-search" className="sr-only">
                {t("searchStore", { store: storeName })}
              </label>
              <Input
                id="store-search"
                type="search"
                name="search"
                defaultValue={query.search}
                placeholder={t("searchStore", { store: storeName })}
                className="h-9 rounded-full bg-card pe-10"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute end-0.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
              >
                <Search className="h-4 w-4" aria-hidden />
                <span className="sr-only">{t("searchSubmit")}</span>
              </Button>
            </form>
            <Suspense>
              <ProductsSorting />
            </Suspense>
          </div>
        </div>
      )}

      <Suspense key={JSON.stringify(query)} fallback={<ProductsGridSkeleton />}>
        <StoreProductGrid
          slug={slug}
          sellerId={sellerId}
          locale={locale}
          categoryIds={
            categories.find((c) => c.key === query.category)?.categoryIds
          }
          query={query}
        />
      </Suspense>
    </section>
  );
}

async function StoreProductGrid({
  slug,
  sellerId,
  locale,
  categoryIds,
  query,
}: {
  slug: string;
  sellerId: string;
  locale: string;
  categoryIds?: string[];
  query: StoreQuery;
}) {
  const t = await getTranslations("pages.stores");
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
      <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center">
        <PackageSearch
          className="mb-3 h-10 w-10 text-muted-foreground"
          aria-hidden
        />
        <p className="text-muted-foreground">
          {filtered ? t("noMatches") : t("noProducts")}
        </p>
        {filtered && (
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link href={storeHref(slug, { sort: query.sort })}>
              {t("clearFilters")}
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="mt-6 mb-4 text-sm text-muted-foreground" aria-live="polite">
        {t("resultsCount", { count: total })}
        {query.search && <> {t("resultsFor", { query: query.search })}</>}
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id as string}
            {...(product as unknown as ProductCardProps)}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <StorePagination
          basePath={`/stores/${slug}`}
          query={query}
          totalPages={totalPages}
        />
      )}
    </>
  );
}

function pageWindow(page: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  return sorted.flatMap((p, i) =>
    i > 0 && p - sorted[i - 1]! > 1 ? ["gap" as const, p] : [p],
  );
}

export async function StorePagination({
  basePath,
  query,
  totalPages,
}: {
  basePath: string;
  query: StoreQuery;
  totalPages: number;
}) {
  const t = await getTranslations("pages.stores");
  const { page } = query;
  const edge =
    "flex h-10 items-center gap-1 rounded-full border bg-card px-4 text-sm font-medium transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <nav
      aria-label={t("paginationLabel")}
      className="mt-12 flex flex-col items-center gap-3"
    >
      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          <Link
            href={storeQueryHref(basePath, { ...query, page: page - 1 })}
            rel="prev"
            className={edge}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            <span className="hidden sm:inline">{t("previousPage")}</span>
          </Link>
        ) : null}
        <ol className="flex items-center gap-1">
          {pageWindow(page, totalPages).map((p, i) =>
            p === "gap" ? (
              <li
                key={`gap-${i}`}
                className="px-1 text-muted-foreground"
                aria-hidden
              >
                …
              </li>
            ) : (
              <li key={p}>
                <Link
                  href={storeQueryHref(basePath, { ...query, page: p })}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    "flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    p === page
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {p}
                </Link>
              </li>
            ),
          )}
        </ol>
        {page < totalPages ? (
          <Link
            href={storeQueryHref(basePath, { ...query, page: page + 1 })}
            rel="next"
            className={edge}
          >
            <span className="hidden sm:inline">{t("nextPage")}</span>
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {t("pageOf", { page, total: totalPages })}
      </p>
    </nav>
  );
}
