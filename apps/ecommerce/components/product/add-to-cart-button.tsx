"use client";

import { Button } from "@workspace/ui/components/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import type { AddToCartButtonProps } from "./product-card.types";
import { useTranslations } from "next-intl";
import { useCart } from "@/providers/cart-provider";

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
  const tProduct = useTranslations("product");
  const isLoading = isProductLoading(productId);

  const handleAddToCart = async () => {
    await addToCart({
      productId,
      quantity,
      variant: variantId ? { id: variantId } : undefined,
    });
  };

  const isOutOfStock = Number(stock) <= 0;
  if (isOutOfStock) return null;

  return (
    <Button
      className={className}
      onClick={handleAddToCart}
      disabled={disabled || isLoading || Number(stock) === 0}
      size={size}
      variant={variant}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        showIcon && <ShoppingCart className="size-4" strokeWidth={3} />
      )}
      {showText && (
        <span className={showIcon ? "ml-1" : ""}>
          {isLoading ? tProduct("adding") : tProduct("addToCart")}
        </span>
      )}
    </Button>
  );
};
