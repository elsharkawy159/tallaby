"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ProductCardImage } from "./product-card-image";
import { ProductCardSwatches } from "./product-card-swatches";
import { ProductCardActions } from "./product-card-actions";
import { WishlistButton } from "./wishlist-button";
import type { ProductCardProps } from "./product-card.types";
import { getProductColorSwatches } from "@/lib/variant-colors";
import { cn } from "@/lib/utils";

interface ProductCardMediaProps {
  product: ProductCardProps;
  isInWishlist?: boolean;
  wishlistItemId?: string;
  className?: string;
}

export const ProductCardMedia = ({
  product,
  isInWishlist = false,
  wishlistItemId,
  className,
}: ProductCardMediaProps) => {
  const productId = product.id || "";
  const locale = useLocale() as "en" | "ar";
  const [hoverImage, setHoverImage] = useState<string | null>(null);
  const { swatches, overflow } = useMemo(
    () => getProductColorSwatches(product.productVariants, locale),
    [product.productVariants, locale]
  );

  return (
    <div className={cn("relative", className)}>
      <ProductCardImage product={product} hoverImage={hoverImage} />

      <WishlistButton
        productId={productId}
        size="sm"
        variant="ghost"
        showText={false}
        className="absolute top-1.5 end-1.5 z-20 size-8 shrink-0 rounded-lg bg-white/90 p-0 shadow-sm hover:bg-white md:top-2 md:end-2"
        isInWishlist={isInWishlist}
        wishlistItemId={wishlistItemId}
      />

      <div className="pointer-events-none absolute inset-x-1.5 bottom-1.5 z-10 flex items-end gap-1.5 md:inset-x-2 md:bottom-2 md:gap-2">
        {swatches.length > 0 && (
          <ProductCardSwatches
            swatches={swatches}
            overflow={overflow}
            onHover={setHoverImage}
            className="pointer-events-auto min-w-0 max-w-[65%] sm:max-w-[70%]"
          />
        )}

        <ProductCardActions
          product={product}
          variant="card"
          isInWishlist={isInWishlist}
          wishlistItemId={wishlistItemId}
          className="pointer-events-auto ms-auto shrink-0"
        />
      </div>
    </div>
  );
};
