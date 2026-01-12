import ProductCard from "@/app/(main)/products/[slug]/_components/ProductCard";
import { Button } from "@workspace/ui/components/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getProducts } from "@/actions/products";
import { getCartItems } from "@/actions/cart";
import { getWishlistItems } from "@/actions/wishlist";
import { ProductCardProps } from "../product";
import { getTranslations } from "next-intl/server";

interface ProductFilters {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  condition?: string;
  sellerId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  searchQuery?: string;
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest" | "popular";
  limit?: number;
  offset?: number;
}

interface ProductsGridProps {
  title: string;
  filters?: ProductFilters;
  description?: string;
}

const ProductsGrid = async ({
  title,
  description,
  filters = {},
}: ProductsGridProps) => {
  const t = await getTranslations("product");
  const products = await getProducts(filters);
  if (!products?.data) {
    return null;
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

  console.log(products.data);
  return (
    <section className="lg:py-8 py-5 container">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="md:text-2xl text-xl font-bold text-gray-900">
            {title}
          </h2>
          <Button asChild className="p-0 gap-1" variant="link">
            <Link href="/products">
              {t("viewMore")}
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
        {description && (
          <p className="md:text-lg text-xs text-gray-600 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid md:gap-4 gap-2 grid-cols-2 md:grid-cols-3 h-full lg:grid-cols-4 xl:grid-cols-5">
        {products.data.map((product) => {
          const cartItem = cartItemsMap.get(product.id);
          const wishlistItem = wishlistMap.get(product.id);

          return (
            <ProductCard
              key={product.id}
              {...(product as ProductCardProps)}
              isInCart={!!cartItem}
              cartItemId={cartItem?.id}
              cartItemQuantity={cartItem?.quantity || 0}
              isInWishlist={!!wishlistItem}
              wishlistItemId={wishlistItem?.id}
            />
          );
        })}
      </div>
    </section>
  );
};

export default ProductsGrid;
