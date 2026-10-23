"use client";

import {
  createContext,
  Suspense,
  use,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import { getDefaultProductVariantId } from "@/lib/product-variants";
import { getVariantColor } from "@/lib/variant-colors";
import type { ProductLocale } from "@/lib/product-translations";
import { useCart } from "@/providers/cart-provider";
import { VariantDeepLink } from "./variant-deep-link.client";
import { cartStatusFor, createVariantStore, type ProductVariant } from "./product-page.lib";
import type { Product } from "./product-page.types";

type ProductPageState = {
  product: Product;
  /** The selected variant's id (null: the base product). */
  variantId: string | null;
  variant: ProductVariant | null;
  /** The shopper picks a variant; `?variant=` follows. */
  selectVariant: (variantId: string | null) => void;
  /** The selected variant (or the base product) is in the cart. */
  inCart: boolean;
  /** Its quantity in the cart (0 when it is not). */
  cartQuantity: number;
  /** Resolves a `?variant=` token (see `ProductPageDeepLink`). */
  applyVariantToken: (token: string) => void;
};

const ProductPageContext = createContext<ProductPageState | null>(null);

/**
 * The selected variant of a product page and its cart status, shared by
 * every part of the page (the marketplace `ProductDisplay`, and the store
 * product page's gallery, price, stock, picker and buy box wherever the
 * seller put them). Lifted from `ProductDisplay` unchanged.
 */
export function ProductPageProvider({ product, children }: { product: Product; children: ReactNode }) {
  const { cartItems } = useCart();
  const locale = useLocale() as ProductLocale;
  const [store] = useState(() => createVariantStore(getDefaultProductVariantId(product.productVariants)));
  const selectedVariantId = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  // `?variant=red` from a product-card swatch — resolved after hydration so the
  // page keeps its static shell.
  const applyVariantToken = useCallback(
    (token: string) => store.applyToken(token, product.productVariants, locale),
    [store, product.productVariants, locale]
  );

  // Mirror the selection into `?variant=` via the native History API, which
  // Next syncs with useSearchParams without a server round trip — so the page
  // stays prerendered and the URL stays shareable.
  const selectVariant = useCallback(
    (variantId: string | null) => {
      store.pick(variantId);

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
    [store, product.productVariants, locale]
  );

  const variant = useMemo(() => {
    if (!selectedVariantId || !product.productVariants) return null;
    return (
      product.productVariants.find((v) => v.id === selectedVariantId) ?? null
    );
  }, [selectedVariantId, product.productVariants]);

  // Check if the selected variant (or base product if no variant) is in cart
  const cartStatus = useMemo(
    () => cartStatusFor(cartItems, product.id, selectedVariantId),
    [cartItems, product.id, selectedVariantId]
  );

  const value = useMemo<ProductPageState>(
    () => ({
      product,
      variantId: selectedVariantId,
      variant,
      selectVariant,
      inCart: cartStatus.isInCart,
      cartQuantity: cartStatus.quantity,
      applyVariantToken,
    }),
    [product, selectedVariantId, variant, selectVariant, cartStatus, applyVariantToken]
  );

  return <ProductPageContext value={value}>{children}</ProductPageContext>;
}

export function useProductPage(): ProductPageState {
  const state = use(ProductPageContext);
  if (!state) throw new Error("useProductPage must be used inside ProductPageProvider");
  return state;
}

/**
 * Applies `?variant=` to the page's selection. Rendered once per page, in
 * its own <Suspense> boundary (see `VariantDeepLink`).
 */
export function ProductPageDeepLink() {
  const { applyVariantToken } = useProductPage();
  return (
    <Suspense fallback={null}>
      <VariantDeepLink onToken={applyVariantToken} />
    </Suspense>
  );
}
