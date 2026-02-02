"use client";

import { useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@workspace/ui/components/carousel";
// import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import {
  CategoryShowcaseClientProps,
  CategoryWithRequiredFields,
} from "./category-showcase.types";
import { useLocale } from "next-intl";

const CATEGORY_BUCKET = "categories";
const PRODUCTS_BUCKET = "products";

export const CategoryShowcaseClient = ({
  categories,
  className,
}: CategoryShowcaseClientProps) => {
  const locale = useLocale();
  // Memoize the filtering and transformation to avoid recalculating on every render
  const categoriesWithProducts = useMemo(() => {
    return categories
      .filter(
        (category): category is CategoryWithRequiredFields =>
          category.productCount > 0 &&
          category.name !== null &&
          category.slug !== null,
      )
      .map((category) => ({
        id: category.id,
        name:
          locale === "ar" ? category.nameAr || category.name! : category.name!,
        slug: category.slug!,
        imageUrl: category.imageUrl ?? null,
        fallbackImageUrl: category.fallbackImageUrl ?? null,
        productCount: category.productCount,
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
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          direction: locale === "ar" ? "rtl" : "ltr",
        }}
        // plugins={[
        //   Autoplay({
        //     delay: 3000,
        //   }),
        // ]}
        className="container"
      >
        <CarouselContent>
          {categoriesWithProducts.map((category) => (
            <Link
              key={category.id}
              href={`/products?categories=${category.name}`}
              className="group block"
            >
              <CarouselItem className="basis-auto">
                <div className="md:w-[108px] w-14">
                  <div className="relative overflow-hidden rounded-full md:size-[100px] size-[60px] mx-auto mb-2.5 bg-white shadow-sm group-hover:shadow-md transition-all duration-300">
                    {category.imageUrl ? (
                      <Image
                        src={getPublicUrl(category.imageUrl, CATEGORY_BUCKET)}
                        alt={category.name}
                        fill
                        sizes="100px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300 p-2"
                      />
                    ) : category.fallbackImageUrl ? (
                      <Image
                        src={getPublicUrl(
                          category.fallbackImageUrl,
                          PRODUCTS_BUCKET,
                        )}
                        alt={category.name}
                        fill
                        sizes="100px"
                        className="object-contain group-hover:scale-105 transition-transform duration-300 p-3"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="md:text-2xl text-base font-bold text-primary group-hover:scale-105 transition-transform duration-300">
                          {category.productCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="md:text-sm text-xs font-medium text-center group-hover:text-primary transition-colors line-clamp-1">
                    {category.name}
                  </h3>
                </div>
              </CarouselItem>
            </Link>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};
