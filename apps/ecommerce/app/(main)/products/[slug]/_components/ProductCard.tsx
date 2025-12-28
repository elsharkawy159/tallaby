"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import {
  WishlistButton,
  ProductCardImage,
  ProductCardInfo,
  ProductCardActions,
} from "@/components/product";
import type { ProductCardProps } from "@/components/product";
import { useLocale } from "next-intl";

interface ProductCardWithStatusProps extends ProductCardProps {
  isInCart?: boolean;
  cartItemId?: string;
  cartItemQuantity?: number;
  isInWishlist?: boolean;
  wishlistItemId?: string;
}

const ProductCard = ({
  isInCart = false,
  cartItemId,
  cartItemQuantity = 0,
  isInWishlist = false,
  wishlistItemId,
  ...product
}: ProductCardWithStatusProps) => {
  const productId = product.id || "";
  const locale = useLocale();

  return (
    <Card
      className="group bg-white shadow-sm border-0 p-0 relative w-full h-full overflow-hidden rounded-lg"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <CardContent className="p-2 md:p-2.5">
        {/* Product Image */}
        <div className="relative">
          <ProductCardImage product={product} />

          {/* Wishlist Button */}
        </div>
        <div className="absolute top-2.5 right-2.5">
          <WishlistButton
            productId={productId}
            size="sm"
            variant="ghost"
            showText={false}
            className="rounded-lg bg-white/90 hover:bg-white shadow"
            isInWishlist={isInWishlist}
            wishlistItemId={wishlistItemId}
          />
        </div>

        {/* Product Info */}
        <ProductCardInfo product={product} />
        {/* <ProductReview product={product} /> */}
        {/* Product Actions */}
        <ProductCardActions
          product={product}
          variant="card"
          isInCart={isInCart}
          cartItemId={cartItemId}
          cartItemQuantity={cartItemQuantity}
          isInWishlist={isInWishlist}
          wishlistItemId={wishlistItemId}
        />
      </CardContent>
    </Card>
  );
};

export default ProductCard;
