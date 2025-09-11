"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Heart, Minus, Plus, ChevronRight } from "lucide-react";
import type { Product } from "../product-page.types";
import { useCartStore } from "@/stores/cart-store";
import { useWishlist } from "@/hooks/use-wishlist";
import Link from "next/link";

interface ProductActionsProps {
  product: Product;
  onAddToCart?: (quantity: number) => void;
  onBuyNow?: (quantity: number) => void;
  isInCart?: boolean;
}

export const ProductActions = ({
  product,
  onAddToCart,
  onBuyNow,
  isInCart: propIsInCart,
}: ProductActionsProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Hooks
  const { addToCart, isInCart, isAdding } = useCartStore();
  const { toggleWishlist, isAdding: isWishlistAdding } = useWishlist();

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleWishlist = async () => {
    const result = await toggleWishlist(product.id);
    if (result?.success) {
      setIsWishlisted(!isWishlisted);
    }
  };

  const handleAddToCart = async () => {
    const result = await addToCart({
      productId: product.id,
      quantity,
    });

    if (result.success && onAddToCart) {
      onAddToCart(quantity);
    }
  };

  const isInCartStatus = propIsInCart ?? isInCart(product.id);

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Quantity Selector */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2 lg:mb-3 text-sm lg:text-base">
          Quantity
        </h3>
        <div className="flex items-center border border-gray-300 rounded-lg w-fit">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 lg:h-10 lg:w-10 rounded-none border-r border-gray-300 hover:bg-gray-50"
            onClick={() => handleQuantityChange(-1)}
          >
            <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
          </Button>
          <span className="px-4 py-2 lg:px-6 lg:py-2 text-center min-w-[2.5rem] lg:min-w-[3rem] font-medium text-sm lg:text-base">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 lg:h-10 lg:w-10 rounded-none border-l border-gray-300 hover:bg-gray-50"
            onClick={() => handleQuantityChange(1)}
          >
            <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 lg:space-y-3">
        {isInCartStatus ? (
          <Button
            asChild
            className="w-full h-10 lg:h-12 text-sm lg:text-lg font-semibold bg-primary hover:bg-primary/90"
          >
            <Link href="/cart">
              Go To Cart <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button
            className="w-full h-10 lg:h-12 text-sm lg:text-lg font-semibold bg-primary hover:bg-primary/90"
            onClick={handleAddToCart}
            disabled={!product.quantity || isAdding}
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full h-10 lg:h-12 text-sm lg:text-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white"
          onClick={() => onBuyNow?.(quantity)}
          disabled={!product.quantity}
        >
          Buy Now
        </Button>

        <Button
          variant="ghost"
          className="w-full h-10 lg:h-12 text-sm lg:text-lg font-semibold border-2 border-gray-300 hover:border-primary hover:text-primary"
          onClick={handleWishlist}
          disabled={isWishlistAdding}
        >
          <Heart
            className={`h-4 w-4 lg:h-5 lg:w-5 mr-2 ${
              isWishlisted ? "fill-current text-red-500" : ""
            }`}
          />
          {isWishlistAdding
            ? "Adding..."
            : isWishlisted
              ? "Wishlisted"
              : "Add to Wishlist"}
        </Button>
      </div>

      {/* Stock Status */}
      {!product.quantity && (
        <div className="text-center p-2 lg:p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium text-sm lg:text-base">
            Currently Out of Stock
          </p>
          <p className="text-red-500 text-xs lg:text-sm">
            We'll notify you when it's back
          </p>
        </div>
      )}
    </div>
  );
};
