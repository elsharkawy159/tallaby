"use client";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Heart, Share, ShoppingCart, Minus, Plus } from "lucide-react";
import Link from "next/link";

interface ProductActionsProps {
  onAddToCart?: (quantity: number) => void;
  onBuyNow?: (quantity: number) => void;
}

export const ProductActions = ({
  onAddToCart,
  onBuyNow,
}: ProductActionsProps) => {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  return (
      <div className="space-y-3">
        <div className="flex space-x-4">
          <Button
            className="flex-1"
            size="lg"
            onClick={() => onAddToCart?.(quantity)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Add to Cart
          </Button>
        </div>
        <Link href="/cart" className="block">
          <Button
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={() => onBuyNow?.(quantity)}
          >
            Buy Now
          </Button>
        </Link>
      </div>
  );
};
