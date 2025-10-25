"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@workspace/ui/components/carousel";
// import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import {
  CategoryShowcaseClientProps,
  CategoryWithRequiredFields,
} from "./category-showcase.types";

export const CategoryShowcaseClient = ({
  categories,
  className,
}: CategoryShowcaseClientProps) => {
  // Memoize the filtering and transformation to avoid recalculating on every render
  const categoriesWithProducts = useMemo(() => {
    return categories
      .filter(
        (category): category is CategoryWithRequiredFields =>
          category.productCount > 0 &&
          category.name !== null &&
          category.slug !== null
      )
      .map((category) => ({
        id: category.id,
        name: category.name!,
        slug: category.slug!,
        productCount: category.productCount,
      }))
      .slice(0, 12);
  }, [categories]);

  if (categoriesWithProducts.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "md:py-6 py-4 px-4 md:rounded-t-[50px] rounded-t-4xl bg-background container mx-auto",
        className
      )}
    >
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        // plugins={[
        //   Autoplay({
        //     delay: 3000,
        //   }),
        // ]}
      >
        <CarouselContent>
          {categoriesWithProducts.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group block"
            >
              <CarouselItem className="basis-auto">
                <div className="md:w-[120px] w-18">
                  <div className="relative overflow-hidden rounded-full md:size-[100px] size-[60px] mx-auto mb-2.5 bg-gradient-to-br from-primary/10 to-primary/20 shadow-sm border border-primary/20 group-hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-center h-full">
                      <span className="md:text-2xl text-base font-bold text-primary group-hover:scale-110 transition-transform duration-300">
                        {category.productCount}
                      </span>
                    </div>
                  </div>
                  <h3 className="md:text-sm text-xs font-medium text-center group-hover:text-primary transition-colors">
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
