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
}

const ProductSection = async ({ title, filters = {} }: ProductSectionProps) => {
  const products = await getProducts(filters);

  return (
    <section className="lg:py-8 py-5 container mx-auto">
      <Carousel
        opts={{
          align: "start",
          dragFree: false,
        }}
        className="flex flex-row items-center mb-8 gap-5"
      >
        {/* Left Text Block */}
        <div className="w-[230px] shrink-0">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            Trending Now: What Everyone's Talking About
          </p>
          <Button asChild className="!px-8 gap-1" variant="secondary">
            <Link href="/products">
              View More
              <ChevronRight className="size-6" />
            </Link>
          </Button>
          <div className="flex gap-5 items-center mt-12 ml-8">
            <CarouselPrevious className="relative left-0" />
            <CarouselNext className="relative right-0" />
          </div>
        </div>

        {/* Carousel Section */}
        <CarouselContent className="p-1.5">
          {products?.data?.map((product) => (
            <CarouselItem key={product.id} className="basis-auto">
              <ProductCard
                id={product.id}
                title={product.title}
                slug={product.slug}
                images={
                  product.images as Array<string | { url?: string } | unknown>
                }
                price={
                  product.price as
                    | number
                    | {
                        base?: number | null;
                        list?: number | null;
                        final?: number | null;
                        discountType?: string | null;
                        discountValue?: number | null;
                      }
                    | null
                }
                averageRating={product.averageRating ?? undefined}
                reviewCount={product.reviewCount ?? undefined}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default ProductSection;
