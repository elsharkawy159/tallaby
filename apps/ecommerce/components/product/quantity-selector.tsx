"use client";

import { Button } from "@workspace/ui/components/button";
import { Minus, Plus, Trash, Loader2 } from "lucide-react";
import type { QuantitySelectorProps } from "./product-card.types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { updateCartItem, removeFromCart as removeFromCartAction } from "@/actions/cart";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
    text: "px-4 min-w-[2.5rem] text-sm",
    loader: "size-3.5",
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

interface QuantitySelectorWithCartProps extends QuantitySelectorProps {
  cartItemId?: string;
  initialQuantity?: number;
}

export const QuantitySelector = ({
  productId,
  className,
  size = "default",
  showRemoveButton = true,
  productStock,
  cartItemId,
  initialQuantity = 0,
}: QuantitySelectorWithCartProps) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (quantity === 0 && initialQuantity === 0) return null;

  const styles = sizeStyles[size] || sizeStyles.default;

  const handleQuantityChange = async (newQuantity: number) => {
    if (!cartItemId) return;

    setIsLoading(true);
    try {
      if (newQuantity <= 0) {
        const result = await removeFromCartAction(cartItemId);
        if (result.success) {
          setQuantity(0);
          router.refresh();
          toast.success("Item removed");
        } else {
          toast.error(result.error || "Failed to remove item");
        }
      } else {
        const result = await updateCartItem(cartItemId, newQuantity);
        if (result.success) {
          setQuantity(newQuantity);
          router.refresh();
          toast.success("Cart updated");
        } else {
          toast.error(result.error || "Failed to update cart");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`flex items-center border border-gray-300 rounded-lg ${className}`}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(`rounded-none hover:text-gray-50`, styles.button)}
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
        className={cn(`rounded-none hover:text-gray-50`, styles.button)}
        onClick={() => handleQuantityChange(quantity + 1)}
        disabled={
          isLoading ||
          (productStock !== undefined && quantity >= Number(productStock))
        }
        aria-label="Increase quantity"
      >
        <Plus className={cn(styles.icon, "size-4")} />
      </Button>
    </div>
  );
};
