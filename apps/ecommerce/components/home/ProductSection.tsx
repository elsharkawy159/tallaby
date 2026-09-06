import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import { Button } from "@workspace/ui/components/button";
import { ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@workspace/ui/components/carousel";
import { Link } from "@/i18n/navigation";
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
  isFeatured?: boolean;
  isTrending?: boolean;
  isSeasonal?: boolean;
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
  const locale = (await getLocale()) as "en" | "ar";
  const products = await getProducts({ ...filters, locale });
  if (!products?.data || products.data.length === 0) {
    return null;
  }

  const productCards = products.data.map((product) => (
    <ProductCard
      key={product.id as string}
      {...(product as ProductCardProps)}
    />
  ));

  return (
    <section className="lg:py-8 py-5 items-container mx-auto">
      {/* Mobile: 2-column grid */}
      <div className="md:hidden">
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <Button asChild className="p-0 gap-1 hidden" variant="link">
              <Link href="/products">
                View More
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
          {description && (
            <p className="text-xs text-gray-600 mb-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">{productCards}</div>
      </div>

      {/* Desktop: carousel */}
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          direction: locale === "ar" ? "rtl" : "ltr",
        }}
        className="hidden md:flex flex-row items-center md:mb-8 gap-5"
      >
        <div className="w-[230px] shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <Button asChild className="p-0 gap-1 hidden" variant="link">
              <Link href="/products">
                View More
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
          {description && (
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {description}
            </p>
          )}

          <div className="flex gap-5 items-center mt-12 ms-8">
            <CarouselPrevious className="relative left-0" />
            <CarouselNext className="relative right-0" />
          </div>
        </div>

        <CarouselContent className="p-1.5">
          {products.data.map((product) => (
            <CarouselItem
              key={product.id as string}
              className="basis-auto ps-4 max-w-[312px]"
            >
              <ProductCard
                key={product.id as string}
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
