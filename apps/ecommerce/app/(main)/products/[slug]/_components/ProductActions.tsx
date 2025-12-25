"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { ChevronRight } from "lucide-react";
import type { Product } from "./product-page.types";
import { useCart } from "@/providers/cart-provider";
import { AddToCartButton } from "@/components/product";
import { ProductQuantitySelector } from "./product-quantity-selector";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProductActionsProps {
  product: Product;
  onBuyNow?: (quantity: number) => void;
  className?: string;
}

export const ProductActions = ({ product, onBuyNow, className }: ProductActionsProps) => {
  const { isInCart, getItemQuantity } = useCart();
  const [quantity, setQuantity] = useState(getItemQuantity(product.id) || 1);
  const stockCount = product.quantity ? Number(product.quantity) : 0;
  const hasStock = product.isActive && stockCount > 0;

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  return (
    <div className={cn(className)}>
      {/* Quantity Selector */}
      <ProductQuantitySelector
        initialQuantity={quantity}
        min={1}
        max={stockCount > 0 ? stockCount : undefined}
        disabled={!hasStock}
        onQuantityChange={handleQuantityChange}
      />

      {!hasStock && (
        <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium text-sm">
            Currently Out of Stock
          </p>
          <p className="text-red-500 text-xs">
            We&apos;ll notify you when it&apos;s back
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex-1">
        {isInCart(product.id) ? (
          <Button asChild className="w-full h-12 text-base" size="lg">
            <Link href="/cart">
              Go To Cart <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        ) : (
          <AddToCartButton
            productId={product.id}
            quantity={quantity}
            className="w-full h-12 text-base"
            size="lg"
            variant="default"
            showIcon={true}
            showText={true}
            stock={stockCount}
          />
        )}

        {/* <WishlistButton
          productId={product.id}
          className="w-full h-12 text-base"
          size="lg"
          variant="outline"
          showText={true}
        /> */}
      </div>
    </div>
  );
};
