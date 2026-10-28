"use client";

import { Button } from "@workspace/ui/components/button";
import { ShoppingBag, ShoppingCart, Loader2, Zap } from "lucide-react";
import type { AddToCartButtonProps } from "./product-card.types";
import { useTranslations } from "next-intl";
import { notifyCartItemAdded, useCart } from "@/providers/cart-provider";
import { trackCommerceEvent } from "@/lib/storefront-events.client";
import { toMetaContentIds } from "@/lib/meta/meta.product";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { useRouter } from "@/i18n/navigation";

const sizeStyles = {
  sm: {
    icon: "size-3.5 shrink-0 md:size-4",
    loader: "size-3.5 shrink-0 md:size-4",
  },
  default: {
    icon: "size-4 shrink-0 md:size-5",
    loader: "size-4 shrink-0 md:size-5",
  },
  lg: {
    icon: "size-4 shrink-0 md:size-6",
    loader: "size-5 shrink-0 md:size-6",
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
  buyNow = false,
  label,
  icon = "cart",
}: AddToCartButtonProps) => {
  const { addToCart, isProductLoading } = useCart();
  const router = useRouter();
  const tProduct = useTranslations("product");
  const isLoading = isProductLoading(productId);

  const handleAddToCart = async () => {
    const result = await addToCart({
      productId,
      quantity,
      variantId,
    });

    if (result.success) {
      const unitPrice = Number(result.data?.price ?? 0);
      const value = unitPrice * quantity;

      trackCommerceEvent(
        "AddToCart",
        {
          content_ids: toMetaContentIds([productId]),
          content_type: "product",
          value,
          currency: DEFAULT_CURRENCY,
        },
        result.metaEventId ? { eventId: result.metaEventId } : undefined
      );

      if (buyNow) router.push("/cart/checkout");
      else notifyCartItemAdded();
    }
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
        showIcon &&
        (buyNow ? (
          <Zap className={styles.icon} />
        ) : icon === "bag" ? (
          <ShoppingBag className={styles.icon} />
        ) : (
          <ShoppingCart className={styles.icon} />
        ))
      )}
      {showText && (
        <span>
          {isLoading
            ? tProduct("adding")
            : (label || tProduct(buyNow ? "buyNow" : "addToCart"))}
        </span>
      )}
    </Button>
  );
};
