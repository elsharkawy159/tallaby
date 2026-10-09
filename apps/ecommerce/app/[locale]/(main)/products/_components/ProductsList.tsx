import { getProducts } from "@/actions/products";
import { getLocale } from "next-intl/server";
import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import type { ProductCardProps } from "@/components/product";
import Pagination from "./Pagination";

interface ProductsListProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// Must match the default in useUrlParams, which omits pageSize from the URL
// when it equals this value.
const DEFAULT_PAGE_SIZE = 20;

// useUrlParams writes multi-select filters as one comma-joined value
// (?categories=A,B), so split it back into the individual names.
function parseList(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : value ?? "";
  return raw.split(",").map((v) => v.trim()).filter(Boolean);
}

function parseNumber(value: string | string[] | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) ? n : undefined;
}

const ProductsList = async ({ searchParams }: ProductsListProps) => {
  const pageSize = parseNumber(searchParams.pageSize) || DEFAULT_PAGE_SIZE;
  const currentPage = Math.max(1, parseNumber(searchParams.page) || 1);

  // Parse search parameters
  const filters = {
    searchQuery: (searchParams.search as string) || undefined,
    categoryNames: parseList(searchParams.categories),
    brandNames: parseList(searchParams.brands),
    minPrice: parseNumber(searchParams.priceMin),
    maxPrice: parseNumber(searchParams.priceMax),
    // `?sale=1` — discounted products only (the home page's deals link).
    onSale: searchParams.sale === "1" || undefined,
    sortBy:
      (searchParams.sort as
        | "price_asc"
        | "price_desc"
        | "rating"
        | "newest"
        | "popular") || "popular",
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  };

  // Map sort parameter to database sort
  let sortBy: "price_asc" | "price_desc" | "rating" | "newest" | "popular" =
    "popular";

  switch (searchParams.sort) {
    case "price-low":
      sortBy = "price_asc";
      break;
    case "price-high":
      sortBy = "price_desc";
      break;
    case "rating":
      sortBy = "rating";
      break;
    case "newest":
      sortBy = "newest";
      break;
    case "popularity":
    default:
      sortBy = "popular";
  }

  filters.sortBy = sortBy;

  const locale = (await getLocale()) as "en" | "ar"
  const result = await getProducts({ ...filters, locale })

  if (!result.success) {
    return (
      <section className="space-y-6 w-full">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {"Failed to load products"}
          </p>
        </div>
      </section>
    );
  }

  const { data: products, totalCount } = result;
  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  return (
    <section className="space-y-6 w-full">
      {products?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No products found matching your criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 lg:gap-5 2xl:gap-6 sm:grid-cols-2 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products?.map((product) => (
              <ProductCard
                key={String(product.id)}
                {...(product as ProductCardProps)}
              />
            ))}
          </div>
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={totalCount || 0}
            totalPages={totalPages}
          />
        </>
      )}
    </section>
  );
};

export default ProductsList;
