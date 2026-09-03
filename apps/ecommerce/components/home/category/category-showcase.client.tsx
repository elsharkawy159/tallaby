"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn, PRODUCT_IMAGE_FALLBACK } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { CategoryShowcaseClientProps } from "./category-showcase.types";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";

const CATEGORY_BUCKET = "categories";
const PRODUCTS_BUCKET = "products";

function CategoryImage({
  name,
  imageUrl,
  fallbackImageUrl,
  productCount,
}: {
  name: string;
  imageUrl: string | null;
  fallbackImageUrl: string | null;
  productCount: number;
}) {
  const primarySrc = imageUrl
    ? getPublicUrl(imageUrl, CATEGORY_BUCKET)
    : fallbackImageUrl
      ? getPublicUrl(fallbackImageUrl, PRODUCTS_BUCKET)
      : null;

  if (!primarySrc) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="md:text-2xl text-base font-bold text-primary group-hover:scale-105 transition-transform duration-300">
          {productCount}
        </span>
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={primarySrc}
      fallbackSrc={PRODUCT_IMAGE_FALLBACK}
      alt={name}
      fill
      sizes="100px"
      className={
        imageUrl
          ? "object-cover group-hover:scale-105 transition-transform duration-300 p-2"
          : "object-contain group-hover:scale-105 transition-transform duration-300 p-3"
      }
    />
  );
}

export const CategoryShowcaseClient = ({
  categories,
  className,
}: CategoryShowcaseClientProps) => {
  const locale = useLocale();
  const categoriesWithProducts = useMemo(() => {
    return categories
      .map((category) => ({
        id: category.id,
        name:
          locale === "ar" ? category.nameAr || category.name! : category.name!,
        slug: category.slug!,
        imageUrl: category.imageUrl ?? null,
        fallbackImageUrl: category.fallbackImageUrl ?? null,
        productCount: Number(category.productCount),
      }))
      .slice(0, 12);
  }, [categories, locale]);

  if (categoriesWithProducts.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "md:py-6 py-4 md:rounded-t-[50px] overflow-hidden rounded-t-4xl bg-background container px-0 mx-auto",
        className,
      )}
    >
      <CategoryCarousel categories={categoriesWithProducts} locale={locale} />
    </section>
  );
};

function CategoryCarousel({
  categories,
  locale,
}: {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    fallbackImageUrl: string | null;
    productCount: number;
  }>;
  locale: string;
}) {
  return (
    <Carousel
      key={`${locale}-${categories.map((category) => category.id).join("-")}`}
      opts={{
        align: "start",
        dragFree: true,
        direction: locale === "ar" ? "rtl" : "ltr",
      }}
      className="container"
    >
      <CarouselContent>
        {categories.map((category) => (
          <CarouselItem key={category.id} className="basis-auto">
            <Link
              href={`/products?categories=${category.name}`}
              className="group block"
            >
              <div className="md:w-[108px] w-21">
                <div className="relative overflow-hidden rounded-full md:size-[100px] size-22 mx-auto mb-2.5 bg-muted/40 shadow-sm group-hover:shadow-md transition-all duration-300">
                  <CategoryImage
                    name={category.name}
                    imageUrl={category.imageUrl}
                    fallbackImageUrl={category.fallbackImageUrl}
                    productCount={category.productCount}
                  />
                </div>
                <h3 className="md:text-sm text-xs font-medium text-center group-hover:text-primary transition-colors line-clamp-2">
                  {category.name}
                </h3>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
