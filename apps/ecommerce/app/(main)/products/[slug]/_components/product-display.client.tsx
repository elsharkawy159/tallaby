"use client";

import { useState, useMemo } from "react";
import { ProductHero } from "./product-hero";
import { ProductDetails } from "./product-details";
import type { Product } from "./product-page.types";

interface ProductDisplayProps {
  product: Product;
  cartItems: Array<{
    id: string;
    productId: string;
    quantity: number;
    variant?: any;
    savedForLater?: boolean | null;
  }>;
}

export const ProductDisplay = ({ product, cartItems }: ProductDisplayProps) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.productVariants && product.productVariants.length > 0
      ? (product.productVariants[0]?.id ?? null)
      : null
  );

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId || !product.productVariants) return null;
    return (
      product.productVariants.find((v) => v.id === selectedVariantId) ?? null
    );
  }, [selectedVariantId, product.productVariants]);

  // Check if the selected variant (or base product if no variant) is in cart
  const variantCartStatus = useMemo(() => {
    const productCartItems = cartItems.filter(
      (item) => item.productId === product.id && !item.savedForLater
    );

    if (selectedVariantId) {
      // Check if this specific variant is in cart
      const variantCartItem = productCartItems.find(
        (item) => (item.variant as any)?.id === selectedVariantId
      );
      return {
        isInCart: !!variantCartItem,
        quantity: variantCartItem?.quantity ?? 0,
      };
    } else {
      // Check if base product (no variant) is in cart
      const baseProductCartItem = productCartItems.find(
        (item) => !item.variant
      );
      return {
        isInCart: !!baseProductCartItem,
        quantity: baseProductCartItem?.quantity ?? 0,
      };
    }
  }, [cartItems, product.id, selectedVariantId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 md:gap-8 gap-5">
      <ProductHero
        product={product}
        selectedVariantId={selectedVariantId}
        selectedVariant={selectedVariant}
      />
      <ProductDetails
        product={product}
        isInCart={variantCartStatus.isInCart}
        cartItemQuantity={variantCartStatus.quantity}
        selectedVariantId={selectedVariantId}
        onVariantChange={setSelectedVariantId}
      />
    </div>
  );
};
