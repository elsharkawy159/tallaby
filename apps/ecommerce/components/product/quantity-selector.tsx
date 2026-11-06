"use client";

import { Button } from "@workspace/ui/components/button";
import { Minus, Plus, Trash, Loader2 } from "lucide-react";
import type { QuantitySelectorProps } from "./product-card.types";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { normalizeMinOrderQuantity } from "@workspace/lib/orders/min-order-quantity";
import { cartItemFloor } from "@/lib/cart-min-order.lib";

const sizeStyles = {
  sm: {
    // 40px tap targets on phones; the compact size from 640px up.
    button: "size-10 text-xs sm:size-7",
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
  const t = useTranslations("common");
  const { cartItems, getCartItemById, updateQuantity, removeFromCart, isItemLoading } =
    useCart();

  const cartItem = cartItemId ? getCartItemById(cartItemId) : undefined;
  const quantity = cartItem?.quantity ?? initialQuantity;
  const isLoading = cartItemId ? isItemLoading(cartItemId) : false;

  if (!cartItemId || quantity === 0) return null;

  const styles = sizeStyles[size] || sizeStyles.default;

  // The seller's minimum (0151): down is refused with a message at the line's
  // floor, and removing gets its own button. A single unit keeps its trash icon.
  const floor = cartItem ? cartItemFloor(cartItem, cartItems) : 1;
  const atFloor = floor > 1 && quantity > 1 && quantity <= floor;

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

    if (atFloor && newQuantity < quantity) {
      toast.error(t("minOrderLine", { count: normalizeMinOrderQuantity(cartItem?.product?.minOrderQuantity) }));
      return;
    }

    await updateQuantity(cartItemId, newQuantity);
  };

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center overflow-hidden rounded-lg border border-gray-300",
        className
      )}
    >
      {atFloor && (
        <Button
          variant="ghost"
          size="icon"
          className={cn("shrink-0 rounded-none p-0", styles.button)}
          onClick={() => removeFromCart(cartItemId)}
          disabled={isLoading}
          aria-label={t("minOrderRemove")}
        >
          <Trash className={cn(styles.icon, "size-4 shrink-0")} />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className={cn("shrink-0 rounded-none p-0", styles.button)}
        onClick={() => handleQuantityChange(quantity - 1)}
        disabled={isLoading}
        aria-label={t("decreaseQuantity")}
      >
        {quantity === 1 && showRemoveButton ? (
          <Trash className={cn(styles.icon, "size-4 shrink-0")} />
        ) : (
          <Minus className={cn(styles.icon, "size-4 shrink-0")} />
        )}
      </Button>

      <span
        className={cn(
          "shrink-0 text-center font-medium tabular-nums",
          styles.text
        )}
      >
        {isLoading ? (
          <Loader2 className={`${styles.loader} mx-auto animate-spin`} />
        ) : (
          quantity
        )}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className={cn("shrink-0 rounded-none p-0", styles.button)}
        onClick={() => handleQuantityChange(quantity + 1)}
        disabled={
          isLoading ||
          (productStock !== undefined && quantity >= Number(productStock)) ||
          (effectiveMaxOrderQty !== undefined &&
            quantity >= effectiveMaxOrderQty)
        }
        aria-label={t("increaseQuantity")}
      >
        <Plus className={cn(styles.icon, "size-4 shrink-0")} />
      </Button>
    </div>
  );
};
