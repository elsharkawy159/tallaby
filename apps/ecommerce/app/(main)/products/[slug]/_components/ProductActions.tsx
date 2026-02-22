"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { ChevronRight } from "lucide-react";
import type { Product } from "./product-page.types";
import { AddToCartButton } from "@/components/product";
import { ProductQuantitySelector } from "./product-quantity-selector";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ProductActionsProps {
  product: Product;
  selectedVariantId?: string | null;
  onBuyNow?: (quantity: number) => void;
  className?: string;
  isInCart?: boolean;
  cartItemQuantity?: number;
}

export const ProductActions = ({
  product,
  selectedVariantId,
  onBuyNow,
  className,
  isInCart: isInCartStatus = false,
  cartItemQuantity = 0,
}: ProductActionsProps) => {
  const t = useTranslations("product");
  const [quantity, setQuantity] = useState(cartItemQuantity || 1);
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
            {t("currentlyOutOfStock")}
          </p>
          <p className="text-red-500 text-xs">{t("notifyWhenBack")}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex-1">
        {isInCartStatus ? (
          <Button asChild className="w-full h-10.5 text-base rounded-lg md:rounded-full bg-primary text-white hover:bg-primary/90" size="lg">
            <Link href="/cart">
              {t("goToCart")}{" "}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        ) : (
          <AddToCartButton
            productId={product.id}
            quantity={quantity}
            variantId={selectedVariantId ?? undefined}
            className="w-full h-10.5 rounded-lg md:rounded-full text-base"
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
