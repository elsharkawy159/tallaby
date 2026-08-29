"use client";

import { Button } from "@workspace/ui/components/button";
import { Minus, Plus, Trash, Loader2 } from "lucide-react";
import type { QuantitySelectorProps } from "./product-card.types";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";

const sizeStyles = {
  sm: {
    button: "h-7 w-7 text-xs",
    icon: "h-3 w-3",
    text: "px-2 min-w-[2rem] text-sm",
    loader: "h-4 w-4",
  },
  default: {
    button: "h-8 w-8 text-sm",
    icon: "h-3.5 w-3.5",
    text: "px-4 min-w-[2.8rem] text-sm",
    loader: "size-3",
  },
  lg: {
    button: "h-10 w-10 text-base",
    icon: "h-4 w-4",
    text: "px-6 min-w-[3rem] text-base",
    loader: "h-5 w-5",
  },
  xl: {
    button: "h-12 w-12 text-lg",
    icon: "h-5 w-5",
    text: "px-8 min-w-[3.5rem] text-lg",
    loader: "h-6 w-6",
  },
} as const;

export const QuantitySelector = ({
  className,
  size = "default",
  showRemoveButton = true,
  productStock,
  cartItemId,
  initialQuantity = 0,
  maxOrderQuantity,
}: QuantitySelectorProps) => {
  const { getCartItemById, updateQuantity, removeFromCart, isItemLoading } =
    useCart();

  const cartItem = cartItemId ? getCartItemById(cartItemId) : undefined;
  const quantity = cartItem?.quantity ?? initialQuantity;
  const isLoading = cartItemId ? isItemLoading(cartItemId) : false;

  if (!cartItemId || quantity === 0) return null;

  const styles = sizeStyles[size] || sizeStyles.default;

  const maxOrderQty =
    maxOrderQuantity != null
      ? typeof maxOrderQuantity === "string"
        ? Number(maxOrderQuantity)
        : maxOrderQuantity
      : undefined;

  const effectiveMaxOrderQty =
    maxOrderQty != null && !isNaN(maxOrderQty) && maxOrderQty > 0
      ? maxOrderQty
      : undefined;

  const handleQuantityChange = async (newQuantity: number) => {
    if (!cartItemId) return;

    if (newQuantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    await updateQuantity(cartItemId, newQuantity);
  };

  return (
    <div
      className={`flex items-center border border-gray-300 rounded-lg ${className}`}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(`rounded-none `, styles.button)}
        onClick={() => handleQuantityChange(quantity - 1)}
        disabled={isLoading}
        aria-label="Decrease quantity"
      >
        {quantity === 1 && showRemoveButton ? (
          <Trash className={cn(styles.icon, "size-4")} />
        ) : (
          <Minus className={cn(styles.icon, "size-4")} />
        )}
      </Button>

      <span className={`text-center font-medium ${styles.text}`}>
        {isLoading ? (
          <Loader2 className={`${styles.loader} animate-spin mx-auto`} />
        ) : (
          quantity
        )}
      </span>

      <Button
        variant="ghost"
        size="sm"
        className={cn(`rounded-none `, styles.button)}
        onClick={() => handleQuantityChange(quantity + 1)}
        disabled={
          isLoading ||
          (productStock !== undefined && quantity >= Number(productStock)) ||
          (effectiveMaxOrderQty !== undefined &&
            quantity >= effectiveMaxOrderQty)
        }
        aria-label="Increase quantity"
      >
        <Plus className={cn(styles.icon, "size-4")} />
      </Button>
    </div>
  );
};
