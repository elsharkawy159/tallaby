"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { ChevronRight, Minus, Plus } from "lucide-react";
import type { Product } from "../product-page.types";
import { useCart } from "@/providers/cart-provider";
import { AddToCartButton, WishlistButton } from "@/components/product";
import Link from "next/link";

interface ProductActionsProps {
  product: Product;
  onBuyNow?: (quantity: number) => void;
}

export const ProductActions = ({ product, onBuyNow }: ProductActionsProps) => {
  const { isInCart, getItemQuantity } = useCart();
  const [quantity, setQuantity] = useState(getItemQuantity(product.id) || 1);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

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
        {isInCart(product.id) ? (
          <Button
            asChild
            className="w-full h-10 lg:h-12 text-sm lg:text-lg font-semibold bg-primary hover:bg-primary/90"
          >
            <Link href="/cart">
              Go To Cart <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <AddToCartButton
            productId={product.id}
            quantity={quantity}
            className="w-full h-10 lg:h-12 text-sm lg:text-lg font-semibold"
            size="lg"
            variant="default"
            showIcon={true}
            showText={true}
          />
        )}

        <Button
          variant="outline"
          className="w-full h-10 lg:h-12 text-sm lg:text-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white"
          onClick={() => onBuyNow?.(quantity)}
          disabled={!product.quantity}
        >
          Buy Now
        </Button>

        <WishlistButton
          productId={product.id}
          className="w-full h-10 lg:h-12 text-sm lg:text-lg font-semibold border-2 border-gray-300 hover:border-primary hover:text-primary"
          size="lg"
          variant="ghost"
          showText={true}
        />
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
