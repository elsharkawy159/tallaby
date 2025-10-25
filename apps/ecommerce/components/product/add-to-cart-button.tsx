"use client";

import { Button } from "@workspace/ui/components/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useCart } from "@/providers/cart-provider";
import type { AddToCartButtonProps } from "./product-card.types";

export const AddToCartButton = ({
  productId,
  quantity = 1,
  variantId,
  disabled = false,
  className,
  size = "default",
  variant = "default",
  showIcon = true,
  showText = true,
  stock = 1,
}: AddToCartButtonProps) => {
  const { addToCart, isProductLoading } = useCart();

  const isLoading = isProductLoading(productId);

  return (
    <Button
      className={className}
      onClick={() => addToCart({ productId, quantity, variant: variantId })}
      disabled={disabled || isLoading || Number(stock) === 0}
      size={size}
      variant={variant}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        showIcon && <ShoppingCart className="h-4 w-4" />
      )}
      {showText && (
        <span className={showIcon ? "ml-2" : ""}>
          {isLoading ? "Adding..." : "Add to Cart"}
        </span>
      )}
    </Button>
  );
};
