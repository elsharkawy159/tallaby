"use client";

import { Suspense, useCallback, useRef, useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { ProductHero } from "./product-hero";
import { ProductDetails } from "./product-details";
import { VariantDeepLink } from "./variant-deep-link.client";
import type { Product } from "./product-page.types";
import { getDefaultProductVariantId } from "@/lib/product-variants";
import { findVariantIdByToken, getVariantColor } from "@/lib/variant-colors";
import type { ProductLocale } from "@/lib/product-translations";
import { useCart } from "@/providers/cart-provider";

interface ProductDisplayProps {
  product: Product;
}

export const ProductDisplay = ({ product }: ProductDisplayProps) => {
  const { cartItems } = useCart();
  const locale = useLocale() as ProductLocale;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    getDefaultProductVariantId(product.productVariants)
  );

  // Once the shopper picks a variant themselves, the URL follows them — the
  // deep link must stop steering, or a slug shared by several variants
  // (Red / S and Red / M) would snap the choice back to the first match.
  const userPickedRef = useRef(false);

  // `?variant=red` from a product-card swatch — resolved after hydration so the
  // page keeps its static shell.
  const applyVariantToken = useCallback(
    (token: string) => {
      if (userPickedRef.current) return;

      const matched = findVariantIdByToken(
        product.productVariants,
        locale,
        token
      );
      if (matched) setSelectedVariantId(matched);
    },
    [product.productVariants, locale]
  );

  // Mirror the selection into `?variant=` via the native History API, which
  // Next syncs with useSearchParams without a server round trip — so the page
  // stays prerendered and the URL stays shareable.
  const handleVariantChange = useCallback(
    (variantId: string | null) => {
      userPickedRef.current = true;
      setSelectedVariantId(variantId);

      if (typeof window === "undefined") return;

      const variant = variantId
        ? product.productVariants?.find((v) => v.id === variantId)
        : null;
      // Colors give a readable token; anything else falls back to the id,
      // which findVariantIdByToken also resolves.
      const token = variant
        ? (getVariantColor(variant, locale)?.slug ?? variant.id)
        : null;

      const params = new URLSearchParams(window.location.search);
      if (token) params.set("variant", token);
      else params.delete("variant");

      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
      );
    },
    [product.productVariants, locale]
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
      <Suspense fallback={null}>
        <VariantDeepLink onToken={applyVariantToken} />
      </Suspense>
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
        onVariantChange={handleVariantChange}
      />
    </div>
  );
};
