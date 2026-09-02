"use client";

import { useState, useMemo } from "react";
import { ProductHero } from "./product-hero";
import { ProductDetails } from "./product-details";
import type { Product } from "./product-page.types";
import { getDefaultProductVariantId } from "@/lib/product-variants";
import { useCart } from "@/providers/cart-provider";

interface ProductDisplayProps {
  product: Product;
}

export const ProductDisplay = ({ product }: ProductDisplayProps) => {
  const { cartItems } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    getDefaultProductVariantId(product.productVariants)
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
      const variantCartItem = productCartItems.find(
        (item) => (item.variant as { id?: string } | null)?.id === selectedVariantId
      );
      // Fallback for items added before variantId was passed to the server action
      const legacyCartItem = productCartItems.find((item) => !item.variant);
      const cartItem = variantCartItem ?? legacyCartItem;

      return {
        isInCart: !!cartItem,
        quantity: cartItem?.quantity ?? 0,
      };
    }

    const baseProductCartItem = productCartItems.find((item) => !item.variant);
    return {
      isInCart: !!baseProductCartItem,
      quantity: baseProductCartItem?.quantity ?? 0,
    };
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
