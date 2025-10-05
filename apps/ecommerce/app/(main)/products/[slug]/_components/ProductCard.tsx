"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import {
  WishlistButton,
  ProductCardImage,
  ProductCardInfo,
  ProductCardActions,
} from "@/components/product";
import type { ProductCardProps } from "@/components/product";

const ProductCard = (product: ProductCardProps) => {
  const productId = product.id || "";

  return (
    <Card className="group bg-white shadow-sm h-full border-0 p-0 relative w-full md:max-w-[285px] max-w-[180px] mx-auto overflow-hidden rounded-[8px_8px_0_8px]">
      <CardContent className="p-2 md:p-2.5">
        {/* Product Image */}
        <div className="relative">
          <ProductCardImage product={product} />

          {/* Wishlist Button */}
          <div className="absolute top-3 right-3">
            <WishlistButton
              productId={productId}
              size="sm"
              variant="ghost"
              showText={false}
              className="rounded-full bg-white/90 hover:bg-white shadow-md"
            />
          </div>
        </div>

        {/* Product Info */}
        <ProductCardInfo product={product} />

        {/* Product Actions */}
        <ProductCardActions product={product} variant="card" />
      </CardContent>
    </Card>
  );
};

export default ProductCard;
