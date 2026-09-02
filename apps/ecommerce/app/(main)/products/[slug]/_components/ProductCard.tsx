"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import {
  ProductCardMedia,
  ProductCardInfo,
} from "@/components/product";
import type { ProductCardProps } from "@/components/product";
import { useLocale } from "next-intl";

interface ProductCardWithStatusProps extends ProductCardProps {
  isInWishlist?: boolean;
  wishlistItemId?: string;
}

const ProductCard = ({
  isInWishlist = false,
  wishlistItemId,
  ...product
}: ProductCardWithStatusProps) => {
  const locale = useLocale();

  return (
    <Card
      className="group relative h-full w-full overflow-hidden rounded-lg border-0 bg-white p-0 shadow-sm"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <CardContent className="flex h-full flex-col p-2 md:p-2.5">
        <ProductCardMedia
          product={product}
          isInWishlist={isInWishlist}
          wishlistItemId={wishlistItemId}
        />

        <ProductCardInfo product={product} className="mt-auto pt-1.5 md:pt-2.5" />
      </CardContent>
    </Card>
  );
};

export default ProductCard;
