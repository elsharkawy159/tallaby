"use client";

import { useTransition } from "react";
import { Button } from "@workspace/ui/components/button";
import { ShoppingCart } from "lucide-react";
import { addToCart } from "@/actions/cart";
import { trackAddToCart } from "@/actions/analytics";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
import { redirect } from "next/navigation";

interface AddToCartButtonProps {
  productId: string;
  quantity: number;
  variantId?: string;
  disabled?: boolean;
  className?: string;
}

export function AddToCartButton({
  productId,
  quantity,
  variantId,
  disabled,
  className,
}: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { addToCart: addToCartHook, isAdding } = useCartStore();

  const handleAdd = () => {
    if (disabled) {
      return;
    }

    startTransition(async () => {
      try {
        // Use the hook for better state management
        const res = await addToCartHook({ productId, quantity, variantId });
        await trackAddToCart({ productId, quantity, variantId, price: 0 });

        if (res?.success) {
          setTimeout(() => {
            redirect("/cart");
          }, 400);
        }
      } catch (error) {
        toast.error("An error occurred while adding to cart");
      }
    });
  };

  return (
    <Button
      className={className}
      onClick={handleAdd}
      disabled={disabled || isPending || isAdding}
    >
      <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
      {isPending || isAdding ? "Adding..." : "Add to Cart"}
    </Button>
  );
}
