"use client";

import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";
import { QuantitySelector } from "./quantity-selector";
import { useCart } from "@/providers/cart-provider";
import type { ProductCardProps } from "./product-card.types";

interface ProductCardActionsProps {
  product: ProductCardProps;
  className?: string;
  variant?: "card" | "page";
}

export const ProductCardActions = ({
  product,
  className,
  variant = "card",
}: ProductCardActionsProps) => {
  const { isInCart } = useCart();
  const productId = product.id || "";
  const isInCartStatus = isInCart(productId);

  if (variant === "page") {
    // For product page - show quantity selector if in cart, otherwise add to cart button
    return (
      <div className={`space-y-3 ${className}`}>
        {isInCartStatus ? (
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                Quantity
              </h3>
              <QuantitySelector
                productId={productId}
                size="lg"
                showRemoveButton={true}
              />
            </div>
            <WishlistButton
              productId={productId}
              size="lg"
              variant="outline"
              showText={true}
              className="w-full"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <AddToCartButton
              productId={productId}
              size="lg"
              variant="default"
              showIcon={true}
              showText={true}
              className="w-full"
            />
            <WishlistButton
              productId={productId}
              size="lg"
              variant="outline"
              showText={true}
              className="w-full"
            />
          </div>
        )}
      </div>
    );
  }

  // For product card - show compact version
  if (isInCartStatus) {
    return (
      <div
        className={`flex bg-accent h-8 w-[146.23px] items-center pr-5 text-white text-base absolute bottom-0 right-0 font-bold py-2.5 rounded-none [clip-path:polygon(17%_0,100%_0,100%_100%,0_100%,20_20%)] pl-10 ${className}`}
      >
        <QuantitySelector
          productId={productId}
          size="sm"
          showRemoveButton={true}
          className="!border-0 !bg-transparent !text-white"
        />
      </div>
    );
  }

  return (
    <AddToCartButton
      productId={productId}
      className={`absolute text-sm bottom-0 right-0 min-w-[146.23px] font-bold py-2.5 rounded-none [clip-path:polygon(17%_0,100%_0,100%_100%,0_100%,20_20%)] pl-10 ${className}`}
      size="sm"
      variant="default"
      showIcon={false}
      showText={true}
    />
  );
};
