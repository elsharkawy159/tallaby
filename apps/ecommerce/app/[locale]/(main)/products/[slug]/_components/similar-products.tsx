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
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toProductCardProps } from "@/lib/utils";

interface SimilarProductsProps {
  products?: Array<Record<string, unknown>>;
  wishlistItems?: Array<{ productId: string; id: string }>;
  title?: string;
}

export const SimilarProducts = ({
  products,
  wishlistItems = [],
  title,
}: SimilarProductsProps) => {
  const t = useTranslations("product");
  const locale = useLocale();
  const isRtl = locale === "ar";

  if (!products || products.length === 0) return null;
  const sectionTitle = title ?? t("relatedProducts");

  const wishlistMap = new Map(
    wishlistItems.map((item) => [item.productId, item])
  );

  return (
    <section className="py-8 lg:py-12" dir={isRtl ? "rtl" : "ltr"}>
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
            direction: isRtl ? "rtl" : "ltr",
          }}
          className="relative"
        >
          <CarouselContent>
            {products.map((product) => {
              const cardProduct = toProductCardProps(product);
              const wishlistItem = cardProduct.id
                ? wishlistMap.get(cardProduct.id)
                : undefined;

              return (
                <CarouselItem
                  key={cardProduct.id}
                  className="basis-auto max-w-80 ps-2 md:ps-4"
                >
                  <ProductCard
                    {...cardProduct}
                    isInWishlist={!!wishlistItem}
                    wishlistItemId={wishlistItem?.id}
                  />
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="absolute start-0 top-1/2 -translate-y-1/2 z-10" />
          <CarouselNext className="absolute end-0 top-1/2 -translate-y-1/2 z-10" />
        </Carousel>
      </div>
    </section>
  );
};
