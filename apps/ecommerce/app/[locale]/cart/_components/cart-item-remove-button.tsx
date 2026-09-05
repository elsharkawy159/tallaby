"use client";

import { Button } from "@workspace/ui/components/button";
import { Loader2, X } from "lucide-react";
import { useCart } from "@/providers/cart-provider";
import { useTranslations } from "next-intl";

interface CartItemRemoveButtonProps {
  cartItemId: string;
}

export const CartItemRemoveButton = ({
  cartItemId,
}: CartItemRemoveButtonProps) => {
  const t = useTranslations("cart");
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
      aria-label={t("removeItem")}
    >
      {isLoading ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <X className="size-3.5" />
      )}
    </Button>
  );
};
