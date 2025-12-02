"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { ChevronRight, Minus, Plus } from "lucide-react";
import type { Product } from "./product-page.types";
import { useCart } from "@/providers/cart-provider";
import { AddToCartButton, WishlistButton } from "@/components/product";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components";

interface ProductActionsProps {
  product: Product;
  onBuyNow?: (quantity: number) => void;
}

export const ProductActions = ({ product, onBuyNow }: ProductActionsProps) => {
  const { isInCart, getItemQuantity } = useCart();
  const [quantity, setQuantity] = useState(getItemQuantity(product.id) || 1);
  const stockCount = product.quantity ? Number(product.quantity) : 0;
  const hasStock = product.isActive && stockCount > 0;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Quantity</h3>
        </CardTitle>
      </CardHeader>
      {/* Quantity Selector */}
      <CardContent>
        <div className="space-y-2 lg:space-y-3">
          <div className="flex items-center border border-gray-300 rounded-lg w-fit">
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasStock}
              className="h-8 w-8 lg:h-10 lg:w-10 rounded-r-none border-r rounded-l-lg border-gray-300 hover:bg-primary hover:text-white duration-100"
              onClick={() => handleQuantityChange(-1)}
            >
              <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
            </Button>
            <span className="px-4 py-2 lg:px-6 lg:py-2 text-center min-w-[2.5rem] lg:min-w-[4rem] font-medium text-sm lg:text-base">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              disabled={!hasStock}
              className="h-8 w-8 lg:h-10 lg:w-10 rounded-l-none border-l rounded-r-lg border-gray-300 hover:bg-primary hover:text-white duration-100"
              onClick={() => handleQuantityChange(1)}
            >
              <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
            </Button>
          </div>
        </div>

        {!hasStock && (
          <div className="text-center p-2 lg:p-3 bg-red-50 border border-red-200 rounded-lg mt-3 lg:mt-4">
            <p className="text-red-600 font-medium text-sm lg:text-base">
              Currently Out of Stock
            </p>
            <p className="text-red-500 text-xs lg:text-sm">
              We'll notify you when it's back
            </p>
          </div>
        )}
        {/* Action Buttons */}
        <div className="space-y-2 lg:space-y-3 mt-3 lg:mt-4">
          {isInCart(product.id) ? (
            <Button
              asChild
              className="w-full "
            >
              <Link href="/cart">
                Go To Cart <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <AddToCartButton
              productId={product.id}
              quantity={quantity}
              className="w-full "
              size="lg"
              variant="default"
              showIcon={true}
              showText={true}
              stock={stockCount}
            />
          )}

          {/* <Button
            variant="outline"
            size="lg"
            className="w-full "
            onClick={() => onBuyNow?.(quantity)}
            disabled={!product.quantity}
          >
            Buy Now
          </Button> */}

          <WishlistButton
            productId={product.id}
            className="w-full"
            size="lg"
            variant="outline"
            showText={true}
          />
        </div>

      </CardContent>
    </Card>
  );
};
