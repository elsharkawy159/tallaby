"use client";

import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";
import { QuantitySelector } from "./quantity-selector";
import type { ProductCardProps } from "./product-card.types";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";

interface ProductCardActionsProps {
  product: ProductCardProps;
  className?: string;
  variant?: "card" | "page";
  isInWishlist?: boolean;
  wishlistItemId?: string;
}

export const ProductCardActions = ({
  product,
  className,
  variant = "card",
  isInWishlist = false,
  wishlistItemId,
}: ProductCardActionsProps) => {
  const productId = product.id || "";
  const { getCartItem } = useCart();
  const cartItem = productId ? getCartItem(productId) : undefined;
  const isInCartStatus = !!cartItem;
  const cartItemId = cartItem?.id;
  const cartItemQuantity = cartItem?.quantity ?? 0;

  const maxOrderQty =
    product.maxOrderQuantity != null
      ? typeof product.maxOrderQuantity === "string"
        ? Number(product.maxOrderQuantity)
        : product.maxOrderQuantity
      : null;

  const safeMaxOrderQty =
    maxOrderQty != null && !isNaN(maxOrderQty) && maxOrderQty > 0
      ? maxOrderQty
      : null;

  if (variant === "page") {
    return (
      <div className={`space-y-3 ${className}`}>
        {isInCartStatus ? (
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                Quantity
              </h3>
              <QuantitySelector
                size="lg"
                showRemoveButton={true}
                cartItemId={cartItemId}
                initialQuantity={cartItemQuantity}
                productStock={product.quantity || 0}
                maxOrderQuantity={safeMaxOrderQty}
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

  if (isInCartStatus || cartItemQuantity > 0) {
    return (
      <div
        className={`absolute right-2.5 md:bottom-19 bottom-16 rounded-lg bg-accent ${className}`}
      >
        <QuantitySelector
          showRemoveButton={true}
          productStock={product.quantity || 0}
          cartItemId={cartItemId}
          initialQuantity={cartItemQuantity}
          maxOrderQuantity={safeMaxOrderQty}
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
