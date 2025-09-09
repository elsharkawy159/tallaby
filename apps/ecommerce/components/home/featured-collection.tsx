import Link from "next/link";
import { getProducts } from "@/actions/products";
import ProductCard from "@/app/(main)/products/[slug]/_components/ProductCard";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Star, TrendingUp } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@workspace/ui/components/carousel";

interface FeaturedCollectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  badgeText?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  filters?: {
    categoryId?: string;
    brandId?: string;
    sortBy?: "price_asc" | "price_desc" | "rating" | "newest" | "popular";
    limit?: number;
    isFeatured?: boolean;
  };
  layout?: "carousel" | "grid";
  showViewMore?: boolean;
  className?: string;
}

export default async function FeaturedCollection({
  title,
  subtitle,
  description,
  badgeText,
  badgeVariant = "default",
  filters = {},
  layout = "carousel",
  showViewMore = true,
  className = "",
}: FeaturedCollectionProps) {
  const productsResult = await getProducts({
    sortBy: "popular",
    limit: 8,
    isFeatured: true,
    ...filters,
  });

  const products = productsResult.success ? productsResult.data : [];

  if (!products.length) {
    return null;
  }

  return (
    <section className={`lg:py-8 py-5 container mx-auto ${className}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
          {badgeText && <Badge variant={badgeVariant}>{badgeText}</Badge>}
        </div>

        {showViewMore && (
          <Button asChild variant="outline">
            <Link href="/products?featured=true">View All</Link>
          </Button>
        )}
      </div>

      {subtitle && (
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{subtitle}</h3>
      )}

      {description && (
        <p className="text-lg text-gray-600 mb-8 max-w-3xl">{description}</p>
      )}

      {layout === "carousel" ? (
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
                      product.images as Array<
                        string | { url?: string } | unknown
                      >
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

                  {/* Featured badge overlay */}
                  <div className="absolute top-2 left-2 z-10">
                    <Badge
                      variant="default"
                      className="text-xs font-bold bg-yellow-500 text-white"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Featured
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="relative group">
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

              {/* Featured badge overlay */}
              <div className="absolute top-2 left-2 z-10">
                <Badge
                  variant="default"
                  className="text-xs font-bold bg-yellow-500 text-white"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
