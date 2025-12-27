import { getProducts } from "@/actions/products";
import ProductCard from "@/app/(main)/products/[slug]/_components/ProductCard";
import type { ProductCardProps } from "@/components/product";
import Pagination from "./Pagination";
import { getCartItems } from "@/actions/cart";
import { getWishlistItems } from "@/actions/wishlist";

interface ProductsListProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

const ProductsList = async ({ searchParams }: ProductsListProps) => {
  // Parse search parameters
  const filters = {
    searchQuery: (searchParams.search as string) || undefined,
    categoryName: Array.isArray(searchParams.categories)
      ? searchParams.categories[0]
      : (searchParams.categories as string) || undefined,
    brandName: Array.isArray(searchParams.brands)
      ? searchParams.brands[0]
      : (searchParams.brands as string) || undefined,
    minPrice: searchParams.priceMin ? Number(searchParams.priceMin) : undefined,
    maxPrice: searchParams.priceMax ? Number(searchParams.priceMax) : undefined,
    sortBy:
      (searchParams.sort as
        | "price_asc"
        | "price_desc"
        | "rating"
        | "newest"
        | "popular") || "popular",
    limit: searchParams.pageSize ? Number(searchParams.pageSize) : 40,
    offset: searchParams.page
      ? (Number(searchParams.page) - 1) * (Number(searchParams.pageSize) || 40)
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

    // Fetch cart and wishlist items
    const cartResult = await getCartItems();
    const cartData = cartResult.success ? cartResult.data : null;
    const cartItems = cartData?.items ?? [];
  
    const wishlistResult = await getWishlistItems();
    const wishlistItems = wishlistResult.success
      ? (wishlistResult.data ?? [])
      : [];
  
    // Create maps for quick lookup
    const cartItemsMap = new Map(
      cartItems
        .filter((item: any) => !item.savedForLater)
        .map((item: any) => [item.productId, item])
    );
  
    const wishlistMap = new Map(
      wishlistItems.map((item: any) => [item.productId, item])
    );
  
  const { data: products, totalCount } = result;
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 40;
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
                key={product.id}
                {...(product as ProductCardProps)}
                isInCart={cartItemsMap.has(product.id)}
                cartItemId={cartItemsMap.get(product.id)?.id}
                cartItemQuantity={cartItemsMap.get(product.id)?.quantity}
                isInWishlist={wishlistMap.has(product.id)}
                wishlistItemId={wishlistMap.get(product.id)?.id}
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
