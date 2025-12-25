import ProductCard from "@/app/(main)/products/[slug]/_components/ProductCard";
import { Button } from "@workspace/ui/components/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getProducts } from "@/actions/products";
import { ProductCardProps } from "../product";

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
  const products = await getProducts(filters);
  if (!products?.data) {
    return null;
  }

  return (
    <section className="lg:py-8 py-5 container">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="md:text-2xl text-xl font-bold text-gray-900">
            {title}
          </h2>
          <Button asChild className="p-0 gap-1 hidden" variant="link">
            <Link href="/products">
              View More
              <ChevronRight className="size-4" />
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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 h-fu lg:grid-cols-4 xl:grid-cols-5">
        {products.data.map((product) => (
          <ProductCard key={product.id} {...(product as ProductCardProps)} />
        ))}
      </div>
    </section>
  );
};

export default ProductsGrid;
