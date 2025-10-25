import Link from "next/link";
import { getProducts } from "@/actions/products";
import { getCategoryBySlug } from "@/actions/categories";
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

interface BestSellersInCategoryProps {
  categorySlug: string;
  title?: string;
  limit?: number;
  showViewMore?: boolean;
  className?: string;
}

export default async function BestSellersInCategory({
  categorySlug,
  title,
  limit = 8,
  showViewMore = true,
  className = "",
}: BestSellersInCategoryProps) {
  // Get category info
  const categoryResult = await getCategoryBySlug(categorySlug);
  const category = categoryResult.success ? categoryResult.data : null;

  if (!category) {
    return null;
  }

  // Get best sellers in this category
  const productsResult = await getProducts({
    categoryName: category.name || undefined,
    sortBy: "popular",
    limit,
  });

  const products = productsResult.success ? productsResult.data : [];

  if (!products || !products.length) {
    return null;
  }

  const displayTitle = title || `Best Sellers in ${category.name}`;

  return (
    <section className={`lg:py-8 py-5 container mx-auto ${className}`}>
      <Carousel
        opts={{
          align: "start",
          dragFree: false,
        }}
        className="flex flex-row items-center mb-8 gap-5"
      >
        {/* Left Text Block */}
        <div className="w-[280px] shrink-0">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {displayTitle}
          </h2>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            Discover the most popular products in {category.name}
          </p>
          {showViewMore && (
            <Button asChild className="!px-8 gap-1" variant="secondary">
              <Link href={`/products?category=${category.slug}&sort=popular`}>
                View More
                <ChevronRight className="size-6" />
              </Link>
            </Button>
          )}
          <div className="flex gap-5 items-center mt-12 ml-8">
            <CarouselPrevious className="relative left-0" />
            <CarouselNext className="relative right-0" />
          </div>
        </div>

        {/* Carousel Section */}
        <CarouselContent className="p-1.5">
          {products.map((product) => (
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
}
