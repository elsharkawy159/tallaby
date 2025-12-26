"use client";

import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";
import { QuantitySelector } from "./quantity-selector";
import type { ProductCardProps } from "./product-card.types";
import { cn } from "@/lib/utils";

interface ProductCardActionsProps {
  product: ProductCardProps;
  className?: string;
  variant?: "card" | "page";
  isInCart?: boolean;
  isInWishlist?: boolean;
  wishlistItemId?: string;
}

export const ProductCardActions = ({
  product,
  className,
  variant = "card",
  isInCart: isInCartStatus = false,
  isInWishlist = false,
  wishlistItemId,
}: ProductCardActionsProps) => {
  const productId = product.id || "";

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
                cartItemId={undefined}
                initialQuantity={0}
              />
            </div>
            <WishlistButton
              productId={productId}
              size="lg"
              variant="outline"
              showText={true}
              className="w-full"
              isInWishlist={isInWishlist}
              wishlistItemId={wishlistItemId}
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
              stock={product.quantity || 0}
            />
            <WishlistButton
              productId={productId}
              size="lg"
              variant="outline"
              showText={true}
              className="w-full"
              isInWishlist={isInWishlist}
              wishlistItemId={wishlistItemId}
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
        className={`absolute right-2.5 md:bottom-19 bottom-16 rounded-lg bg-accent ${className}`}
      >
        <QuantitySelector
          productId={productId}
          showRemoveButton={true}
          productStock={product.quantity || 0}
          className="!border-0 !bg-transparent !text-white shadow"
        />
      </div>
    );
  }

  return (
    <AddToCartButton
      productId={productId}
      className={cn(
        `absolute right-2.5 md:bottom-19 bottom-16 rounded-lg shadow`,
        className
      )}
      size="sm"
      variant="default"
      showIcon={true}
      showText={false}
      stock={product.quantity || 0}
    />
  );
};
