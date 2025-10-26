import ProductCard from "@/app/(main)/products/[slug]/_components/ProductCard";
import { Button } from "@workspace/ui/components/button";
import { ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@workspace/ui/components/carousel";
import Link from "next/link";
import { getProducts } from "@/actions/products";
import { ProductCardProps } from "../product";
import { getLocale } from "next-intl/server";

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

interface ProductSectionProps {
  title: string;
  filters?: ProductFilters;
  description?: string;
}

const ProductSection = async ({
  title,
  description,
  filters = {},
}: ProductSectionProps) => {
  const products = await getProducts(filters);
  const locale = await getLocale();
  if (!products?.data) {
    return null;
  }

  return (
    <section className="lg:py-8 py-5 items-container mx-auto">
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          direction: locale === "ar" ? "rtl" : "ltr",
        }}
        className="md:flex flex-row items-center mb-8 gap-5"
      >
        {/* Left Text Block */}
        <div className="md:w-[230px] w-full shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="md:text-2xl text-xl font-bold text-gray-900 md:mb-2">
              {title}
            </h2>
            <Button asChild className="p-0 gap-1 md:hidden flex" variant="link">
              <Link href="/products">
                View More
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
          {description && (
            <p className="md:text-lg text-xs text-gray-600 md:mb-6 mb-1 leading-relaxed">
              {description}
            </p>
          )}

          <div className="md:flex gap-5 items-center mt-12 ms-8 hidden">
            <CarouselPrevious className="relative left-0" />
            <CarouselNext className="relative right-0" />
          </div>
        </div>

        {/* Carousel Section */}
        <CarouselContent className="p-1.5">
          {products.data.map((product) => (
            <CarouselItem key={product.id} className="basis-auto md:ps-4 ps-3">
              <ProductCard
                key={product.id}
                {...(product as ProductCardProps)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default ProductSection;
