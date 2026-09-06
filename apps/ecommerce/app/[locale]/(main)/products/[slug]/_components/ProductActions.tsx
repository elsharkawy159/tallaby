"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { ChevronRight } from "lucide-react";
import type { Product } from "./product-page.types";
import { AddToCartButton } from "@/components/product";
import { ProductQuantitySelector } from "./product-quantity-selector";
import { Link } from "@/i18n/navigation";
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
  const hasStock = product.status === "active" && stockCount > 0;

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <ProductQuantitySelector
        initialQuantity={quantity}
        min={1}
        max={stockCount > 0 ? stockCount : undefined}
        disabled={!hasStock}
        onQuantityChange={handleQuantityChange}
        className="shrink-0"
      />

      {!hasStock && (
        <div className="flex-1 rounded-lg border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-sm font-medium text-red-600">
            {t("currentlyOutOfStock")}
          </p>
          <p className="text-xs text-red-500">{t("notifyWhenBack")}</p>
        </div>
      )}

      {hasStock && (
        <div className="min-w-0 flex-1">
          {isInCartStatus ? (
            <Button
              asChild
              className="h-10.5 w-full rounded-lg bg-primary text-base text-white hover:bg-primary/90 md:rounded-full"
              size="lg"
            >
              <Link href="/cart">
                {t("goToCart")}{" "}
                <ChevronRight className="h-4 w-4 shrink-0 rtl:rotate-180" />
              </Link>
            </Button>
          ) : (
            <AddToCartButton
              productId={product.id}
              quantity={quantity}
              variantId={selectedVariantId ?? undefined}
              className="h-10.5 w-full rounded-lg text-base md:rounded-full"
              variant="default"
              showIcon={true}
              showText={true}
              stock={stockCount}
            />
          )}
        </div>
      )}
    </div>
  );
};
