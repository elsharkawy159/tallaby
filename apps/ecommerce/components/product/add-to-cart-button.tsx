"use client";

import { Button } from "@workspace/ui/components/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import type { AddToCartButtonProps } from "./product-card.types";
import { useTranslations } from "next-intl";
import { useCart } from "@/providers/cart-provider";

const sizeStyles = {
  sm: {
    icon: "h-3 w-3 md:h-4 md:w-4",
    loader: "h-3 w-3 md:h-4 md:w-4",
    gap: "ml-1 md:ml-2",
  },
  default: {
    icon: "h-4 w-4 md:h-5 md:w-5",
    loader: "h-4 w-4 md:h-5 md:w-5",
    gap: "ml-2 md:ml-3",
  },
  lg: {
    icon: "h-4 w-4 md:h-6 md:w-6",
    loader: "h-5 w-5 md:h-6 md:w-6",
    gap: "ml-3 md:ml-4",
  },
} as const;

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
      variantId,
    });
  };

  const isOutOfStock = Number(stock) <= 0;
  if (isOutOfStock) return null;

  const styles = sizeStyles[size] || sizeStyles.default;

  return (
    <Button
      className={className}
      onClick={handleAddToCart}
      disabled={disabled || isLoading || Number(stock) === 0}
      size={size}
      variant={variant}
    >
      {isLoading ? (
        <Loader2 className={`${styles.loader} animate-spin`} />
      ) : (
        showIcon && <ShoppingCart className={styles.icon} />
      )}
      {showText && (
        <span className={showIcon ? styles.gap : ""}>
          {isLoading ? tProduct("adding") : tProduct("addToCart")}
        </span>
      )}
    </Button>
  );
};
