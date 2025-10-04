import { getProducts } from "@/actions/products";
import ProductCard from "@/app/(main)/products/[slug]/_components/ProductCard";
import type { ProductCardProps } from "@/components/product";
import Pagination from "./Pagination";

interface ProductsListProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

const ProductsList = async ({ searchParams }: ProductsListProps) => {
  // Parse search parameters
  const filters = {
    searchQuery: (searchParams.search as string) || undefined,
    categoryId: Array.isArray(searchParams.categories)
      ? searchParams.categories[0]
      : searchParams.categories || undefined,
    brandId: Array.isArray(searchParams.brands)
      ? searchParams.brands[0]
      : searchParams.brands || undefined,
    minPrice: searchParams.priceMin ? Number(searchParams.priceMin) : undefined,
    maxPrice: searchParams.priceMax ? Number(searchParams.priceMax) : undefined,
    sortBy:
      (searchParams.sort as
        | "price_asc"
        | "price_desc"
        | "rating"
        | "newest"
        | "popular") || "popular",
    limit: searchParams.pageSize ? Number(searchParams.pageSize) : 20,
    offset: searchParams.page
      ? (Number(searchParams.page) - 1) * (Number(searchParams.pageSize) || 20)
      : 0,
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

  const result = await getProducts(filters);

  if (!result.success) {
    return (
      <section className="space-y-6 w-full">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {result.error || "Failed to load products"}
          </p>
        </div>
      </section>
    );
  }

  const { data: products, totalCount } = result;
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 20;
  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  // Handle multiple categories/brands filtering
  let filteredProducts = products || [];

  if (
    Array.isArray(searchParams.categories) &&
    searchParams.categories.length > 1
  ) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.categoryId &&
        searchParams.categories!.includes(product.categoryId)
    );
  }

  if (Array.isArray(searchParams.brands) && searchParams.brands.length > 1) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.brandId && searchParams.brands!.includes(product.brandId)
    );
  }

  return (
    <section className="space-y-6 w-full">
      {filteredProducts?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No products found matching your criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts?.map((product) => (
              <ProductCard
                key={product.id}
                {...(product as ProductCardProps)}
              />
            ))}
          </div>
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={filteredProducts.length}
            totalPages={Math.ceil(filteredProducts.length / pageSize)}
          />
        </>
      )}
    </section>
  );
};

export default ProductsList;
