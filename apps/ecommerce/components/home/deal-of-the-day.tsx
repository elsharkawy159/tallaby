import Link from "next/link";
import { getProducts } from "@/actions/products";
import { getLocale } from "next-intl/server";
import ProductCard from "@/app/(main)/products/[slug]/_components/ProductCard";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Clock, Zap } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@workspace/ui/components/carousel";

interface DealOfTheDayProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  showCountdown?: boolean;
  className?: string;
}

export default async function DealOfTheDay({
  title = "Deal of the Day",
  subtitle = "Limited time offers you don't want to miss",
  limit = 6,
  showCountdown = true,
  className = "",
}: DealOfTheDayProps) {
  const locale = (await getLocale()) as "en" | "ar"
  const productsResult = await getProducts({
    sortBy: "popular",
    limit,
    locale,
  })

  const products = productsResult.success ? productsResult.data : [];

  if (!products?.length) {
    return null;
  }

  return (
    <section className={`lg:py-8 py-5 container mx-auto ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
          <Badge variant="destructive" className="animate-pulse">
            HOT DEAL
          </Badge>
        </div>

        {showCountdown && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Ends in: 23:45:12</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl">
          {subtitle}
        </p>
      )}

      <Carousel
        opts={{
          align: "start",
          dragFree: false,
        }}
        className="w-full"
      >
        <CarouselContent className="p-1.5">
          {products.map((product) => (
            <CarouselItem key={product.id} className="basis-auto">
              <div className="relative group">
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

                {/* Deal badge overlay */}
                <div className="absolute top-2 left-2 z-10">
                  <Badge variant="destructive" className="text-xs font-bold">
                    -30%
                  </Badge>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="flex justify-center mt-6 gap-2">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </Carousel>

      <div className="text-center mt-8">
        <Button asChild variant="outline" size="lg">
          <Link href="/deals">View All Deals</Link>
        </Button>
      </div>
    </section>
  );
}
