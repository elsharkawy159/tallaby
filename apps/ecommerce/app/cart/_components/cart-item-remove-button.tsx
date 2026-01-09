"use client";

import { Button } from "@workspace/ui/components/button";
import { Trash2, Loader2, X } from "lucide-react";
import { removeFromCart } from "@/actions/cart";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CartItemRemoveButtonProps {
  cartItemId: string;
}

export const CartItemRemoveButton = ({
  cartItemId,
}: CartItemRemoveButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      const result = await removeFromCart(cartItemId);
      if (result.success) {
        router.refresh();
        toast.success("Item removed");
      } else {
        toast.error(result.error || "Failed to remove item");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setIsLoading(false);
    }
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
