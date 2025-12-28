"use client";

import { Button } from "@workspace/ui/components/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import type { AddToCartButtonProps } from "./product-card.types";
import { useState, useTransition } from "react";
import { addToCart as addToCartAction } from "@/actions/cart";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      const result = await addToCartAction(productId, quantity);
      if (result.success) {
        router.refresh();
        toast.success("Item added to cart");
      } else {
        toast.error(result.error || "Failed to add item");
      }
    } catch (error) {
      toast.error("Failed to add item");
    } finally {
      setIsLoading(false);
    }
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
        showIcon && <ShoppingCart className="size-4" />
      )}
      {showText && (
        <span className={showIcon ? "ml-2" : ""}>
          {isLoading ? "Adding..." : "Add to Cart"}
        </span>
      )}
    </Button>
  );
};
