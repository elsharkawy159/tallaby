import { getPriceList, parsePriceJson } from "@workspace/lib";
import type { ProductLocale } from "@/lib/product-translations";
import { getDiscountPercent } from "@/lib/utils";
import { findVariantIdByToken } from "@/lib/variant-colors";
import type { CartItem } from "@/types/cart";
import type { Product } from "./product-page.types";

/**
 * Product page logic shared by the marketplace page (`ProductDetails`) and
 * the store product page's parts (`ProductPageProvider`, the storefront
 * hooks): the selected variant's price and stock, its cart status, and the
 * variant selection itself.
 */

export type ProductVariant = NonNullable<Product["productVariants"]>[number];

export type ProductPricing = {
  price: number;
  listPrice: number | null;
  stock: number;
  discountEndsAt: string | null;
};

/** Price, list price, stock and offer end of the selected variant, else the base product. */
export function productPricing(product: Product, selectedVariant: ProductVariant | null): ProductPricing {
  if (selectedVariant) {
    const parsed = parsePriceJson(selectedVariant.price);
    const variantPrice = parsed.final;
    const variantStock = Number(selectedVariant.stock ?? 0);
    const variantList = parsed.list;
    const productList = getPriceList(product.price);
    const hasOwnDiscount = variantList != null && variantList > variantPrice;
    const listCandidate = hasOwnDiscount
      ? variantList
      : productList != null && productList > variantPrice
        ? productList
        : null;
    const isDefaultVariant = selectedVariant.isDefault === true;
    const productDiscountEndsAt =
      (product.price as any)?.discountEndsAt ?? null;

    return {
      price: variantPrice,
      listPrice: listCandidate,
      stock: variantStock,
      // The default variant mirrors the main product's discount, so its
      // expiry lives in `product.price`; other variants carry their own.
      // A variant with no own discount that is shown against the product's
      // list price is showing the product's discount, so it gets that expiry.
      discountEndsAt: isDefaultVariant
        ? productDiscountEndsAt
        : ((selectedVariant as any)?.discountEndsAt ??
          (!hasOwnDiscount && listCandidate != null
            ? productDiscountEndsAt
            : null)),
    };
  }

  const parsed = parsePriceJson(product.price);
  const baseStock = product.quantity ? Number(product.quantity) : 0;

  return {
    price: parsed.final,
    listPrice:
      parsed.list != null && parsed.list > parsed.final ? parsed.list : null,
    stock: baseStock,
    discountEndsAt: (product.price as any)?.discountEndsAt ?? null,
  };
}

/** The offer's end as a date, while it is still ahead. */
export function discountExpiryDate(discountEndsAt: string | null): Date | null {
  if (!discountEndsAt) return null;
  const parsed = new Date(discountEndsAt);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
    return null;
  }
  return parsed;
}

/** The discount badge's percent for a pricing. */
export function pricingDiscountPercent(product: Product, selectedVariant: ProductVariant | null, pricing: ProductPricing): number | null {
  return getDiscountPercent(pricing.listPrice, pricing.price, selectedVariant?.price ?? product.price);
}

/** Free delivery on this product: physical, and free on the product or from its seller. */
export function productHasFreeDelivery(product: Product): boolean {
  const isPhysicalProduct = product.productType !== "digital";
  return isPhysicalProduct && (product.freeDelivery === true || product.seller?.freeDelivery === true);
}

/** Whether the selected variant (or the base product, with no variant) is in the cart, and how many. */
export function cartStatusFor(
  cartItems: readonly Pick<CartItem, "productId" | "quantity" | "savedForLater" | "variant">[],
  productId: string,
  selectedVariantId: string | null,
): { isInCart: boolean; quantity: number } {
  const productCartItems = cartItems.filter(
    (item) => item.productId === productId && !item.savedForLater
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
}

/**
 * The selected variant of one product page, shared by every part that
 * shows it (price, stock, gallery, picker, buy box) wherever they sit.
 */
export function createVariantStore(initialVariantId: string | null) {
  let variantId = initialVariantId;
  // Once the shopper picks a variant themselves, the URL follows them — the
  // deep link must stop steering, or a slug shared by several variants
  // (Red / S and Red / M) would snap the choice back to the first match.
  let userPicked = false;
  const listeners = new Set<() => void>();
  const set = (next: string | null) => {
    if (next === variantId) return;
    variantId = next;
    for (const listener of listeners) listener();
  };

  return {
    getSnapshot: () => variantId,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** `?variant=red` from a product-card swatch, resolved after hydration. */
    applyToken(token: string, variants: Product["productVariants"], locale: ProductLocale) {
      if (userPicked) return;
      const matched = findVariantIdByToken(variants, locale, token);
      if (matched) set(matched);
    },
    /** The shopper's own choice. */
    pick(next: string | null) {
      userPicked = true;
      set(next);
    },
  };
}

export type VariantStore = ReturnType<typeof createVariantStore>;
