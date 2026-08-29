"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";
import ProductCard from "./ProductCard";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface SimilarProductsProps {
  products?: any[];
  wishlistItems?: any[];
  title?: string;
}

export const SimilarProducts = ({
  products,
  wishlistItems = [],
  title,
}: SimilarProductsProps) => {
  const t = useTranslations("product");
  if (!products || products.length === 0) return null;
  const sectionTitle = title ?? t("customersAlsoPurchased");

  const wishlistMap = new Map(
    wishlistItems.map((item: any) => [item.productId, item])
  );

  return (
    <section className="py-8 lg:py-12">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-3xl font-bold text-gray-900">
            {sectionTitle}
          </h2>
          <Button variant="outline" className="w-fit">
            <Link href="/products">{t("viewMore")}</Link>
          </Button>
        </div>
        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          className="relative"
        >
          <CarouselContent className="">
            {products.map((product) => {
              const wishlistItem = wishlistMap.get(product.id);

              return (
                <CarouselItem key={product.id} className="max-w-80">
                  <ProductCard
                    {...product}
                    isInWishlist={!!wishlistItem}
                    wishlistItemId={wishlistItem?.id}
                  />
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 z-10" />
          <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 z-10" />
        </Carousel>
      </div>
    </section>
  );
};
