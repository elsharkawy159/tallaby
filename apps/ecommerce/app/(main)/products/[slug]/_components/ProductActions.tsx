"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Heart, ShoppingCart, Minus, Plus } from "lucide-react";
import type { Product } from "../product-page.types";

interface ProductActionsProps {
  product: Product;
  onAddToCart?: (quantity: number) => void;
  onBuyNow?: (quantity: number) => void;
}

export const ProductActions = ({
  product,
  onAddToCart,
  onBuyNow,
}: ProductActionsProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
        <div className="flex items-center border border-gray-300 rounded-lg w-fit">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-none border-r border-gray-300 hover:bg-gray-50"
            onClick={() => handleQuantityChange(-1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="px-6 py-2 text-center min-w-[3rem] font-medium">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-none border-l border-gray-300 hover:bg-gray-50"
            onClick={() => handleQuantityChange(1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90"
          onClick={() => onAddToCart?.(quantity)}
          disabled={!product.inStock}
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Add to Cart
        </Button>

        <Button
          variant="outline"
          className="w-full h-12 text-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white"
          onClick={() => onBuyNow?.(quantity)}
          disabled={!product.inStock}
        >
          Buy Now
        </Button>

        <Button
          variant="ghost"
          className="w-full h-12 text-lg font-semibold border-2 border-gray-300 hover:border-primary hover:text-primary"
          onClick={handleWishlist}
        >
          <Heart
            className={`h-5 w-5 mr-2 ${isWishlisted ? "fill-current text-red-500" : ""}`}
          />
          {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
        </Button>
      </div>

      {/* Stock Status */}
      {!product.inStock && (
        <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">Currently Out of Stock</p>
          <p className="text-red-500 text-sm">
            We'll notify you when it's back
          </p>
        </div>
      )}
    </div>
  );
};
