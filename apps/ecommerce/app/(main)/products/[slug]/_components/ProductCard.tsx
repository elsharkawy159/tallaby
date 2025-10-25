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

const ProductCard = (product: ProductCardProps) => {
  const productId = product.id || "";
  const locale = useLocale();

  return (
    <Card className="group bg-white shadow-sm h-fit border-0 p-0 relative w-full md:max-w-[285px] max-w-43 mx-auto overflow-hidden rounded-lg"
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
            />
          </div>

        {/* Product Info */}
        <ProductCardInfo product={product} />
        {/* <ProductReview product={product} /> */}
        {/* Product Actions */}
        <ProductCardActions product={product} variant="card" />
      </CardContent>
    </Card>
  );
};

export default ProductCard;
