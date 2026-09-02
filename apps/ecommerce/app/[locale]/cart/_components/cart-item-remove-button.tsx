"use client";

import { Button } from "@workspace/ui/components/button";
import { Loader2, X } from "lucide-react";
import { useCart } from "@/providers/cart-provider";

interface CartItemRemoveButtonProps {
  cartItemId: string;
}

export const CartItemRemoveButton = ({
  cartItemId,
}: CartItemRemoveButtonProps) => {
  const { removeFromCart, isItemLoading } = useCart();
  const isLoading = isItemLoading(cartItemId);

  const handleRemove = async () => {
    await removeFromCart(cartItemId);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-6 text-muted-foreground rounded-full hover:bg-red-400 hover:text-white bg-red-100 flex-shrink-0"
      onClick={handleRemove}
      disabled={isLoading}
      aria-label="Remove item from cart"
    >
      {isLoading ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <X className="size-3.5" />
      )}
    </Button>
  );
};
