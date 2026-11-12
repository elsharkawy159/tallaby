"use client";

import { createContext, ReactNode, useState, useCallback, use } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getCartItems,
  addToCart as addToCartAction,
  updateCartItem,
  removeFromCart as removeFromCartAction,
  clearCart as clearCartAction,
} from "@/actions/cart";
import type { CartState } from "@/types/cart";

const CartContext = createContext<CartState | undefined>(undefined);

const CART_ITEM_ADDED_EVENT = "tallaby:cart-item-added";

/** Tell the page an item was just added (the storefront opens its cart sheet). */
export function notifyCartItemAdded() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_ITEM_ADDED_EVENT));
}

// How many listeners show the shopper what they added (a store's cart sheet).
let addedListeners = 0;

/** Runs `handler` after each `notifyCartItemAdded`; returns the unsubscribe. */
export function onCartItemAdded(handler: () => void): () => void {
  window.addEventListener(CART_ITEM_ADDED_EVENT, handler);
  addedListeners += 1;
  return () => {
    window.removeEventListener(CART_ITEM_ADDED_EVENT, handler);
    addedListeners -= 1;
  };
}

/**
 * "Added to cart" toast, unless something on the page already shows the cart
 * after an add (a store's cart sheet opens): the toast would only repeat it
 * (owner, 2026-11-12). tallaby.com's shop has no sheet, so it keeps the toast.
 */
function addedToastText(text: string): string | null {
  return addedListeners > 0 ? null : text;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const tToast = useTranslations("toast");

  // Individual item loading states
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(
    new Set()
  );

  const {
    data: cartData,
    isLoading: loading,
    refetch: refreshCart,
  } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const result = await getCartItems();
      return result.success ? result.data : null;
    },
    // CartProvider is mounted once at the app root (apps/ecommerce/app/providers.tsx),
    // so staleTime: 0 + refetchOnWindowFocus: true meant a getCartItems()
    // server action (auth + DB) fired on every window focus, site-wide,
    // including on pages that never touch the cart. Every mutation already
    // explicitly invalidates + refetches this query (see handleAction
    // below), so a short staleTime is sufficient to stay correct.
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const cartItems = cartData?.items ?? [];
  const itemCount = cartData?.itemCount ?? 0;
  const subtotal = cartData?.subtotal ?? 0;

  // Helper functions for loading states
  const setItemLoading = useCallback((itemId: string, isLoading: boolean) => {
    setLoadingItems((prev) => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  }, []);

  const setProductLoading = useCallback(
    (productId: string, isLoading: boolean) => {
      setLoadingProducts((prev) => {
        const newSet = new Set(prev);
        if (isLoading) {
          newSet.add(productId);
        } else {
          newSet.delete(productId);
        }
        return newSet;
      });
    },
    []
  );

  async function handleAction<T extends (...args: any[]) => Promise<any>>(
    action: T,
    args: Parameters<T>,
    successMsg: string | null,
    errorMsg: string,
    loadingKey?: string,
    setLoading?: (key: string, loading: boolean) => void
  ) {
    if (loadingKey && setLoading) {
      setLoading(loadingKey, true);
    }

    try {
      const result = await action(...args);
      if (result.success) {
        // Invalidate and immediately refetch to ensure fresh data
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
        await refreshCart();
        if (successMsg) toast.success(successMsg);
        return {
          success: true as const,
          data: result.data,
          metaEventId: result.metaEventId as string | undefined,
        };
      }
      toast.error(result.error || errorMsg);
      return { success: false as const, message: result.error };
    } catch (err) {
      console.error(errorMsg, err);
      toast.error(errorMsg);
      return { success: false as const, message: "An error occurred" };
    } finally {
      if (loadingKey && setLoading) {
        setLoading(loadingKey, false);
      }
    }
  }

  const addToCart = (p: {
    productId: string;
    quantity: number;
    variantId?: string;
  }) =>
    handleAction(
      addToCartAction,
      [p.productId, p.quantity, p.variantId],
      addedToastText(tToast("itemAddedToCart")),
      tToast("failedToAddItem"),
      p.productId,
      setProductLoading
    );

  /**
   * Several variants of one product in one go (the product page's pieces:
   * 2 black, 1 red). Added one line after another, one toast and one cart
   * refresh at the end; stops at the first line the server refuses.
   */
  const addLinesToCart = async (p: {
    productId: string;
    lines: { variantId?: string; quantity: number }[];
  }) => {
    setProductLoading(p.productId, true);
    let added = 0;
    let value = 0;
    let metaEventId: string | undefined;
    try {
      for (const line of p.lines) {
        const result = await addToCartAction(p.productId, line.quantity, line.variantId);
        if (!result.success) {
          toast.error(result.error || tToast("failedToAddItem"));
          break;
        }
        added += 1;
        value += Number(result.data?.price ?? 0) * line.quantity;
        metaEventId ??= result.metaEventId as string | undefined;
      }
    } catch (err) {
      console.error(tToast("failedToAddItem"), err);
      toast.error(tToast("failedToAddItem"));
    } finally {
      if (added > 0) {
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
        await refreshCart();
      }
      setProductLoading(p.productId, false);
    }
    const success = added === p.lines.length;
    const addedText = addedToastText(tToast("itemAddedToCart"));
    if (success && addedText) toast.success(addedText);
    return { success, added, value, metaEventId };
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 0) {
      toast.error(tToast("quantityCannotBeNegative"));
      return Promise.resolve({ success: false, message: "Invalid quantity" });
    }
    return handleAction(
      updateCartItem,
      [itemId, quantity],
      null,
      tToast("failedToUpdateCart"),
      itemId,
      setItemLoading
    );
  };

  const removeFromCart = (itemId: string) =>
    handleAction(
      removeFromCartAction,
      [itemId],
      tToast("itemRemoved"),
      tToast("failedToRemoveItem"),
      itemId,
      setItemLoading
    );

  const clearCart = () =>
    handleAction(
      clearCartAction,
      [],
      tToast("cartCleared"),
      tToast("failedToClearCart")
    );

  const value: CartState = {
    cartData: cartData ?? null,
    cartItems,
    itemCount,
    subtotal,
    loading,
    addToCart,
    addLinesToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    // A free gift (0149) doesn't count as buying the product.
    isInCart: (productId: string) =>
      cartItems.some((i) => i.productId === productId && !i.savedForLater && !i.giftRuleId),
    getItemQuantity: (productId: string) =>
      cartItems.find((i) => i.productId === productId && !i.savedForLater && !i.giftRuleId)
        ?.quantity || 0,
    getCartItem: (productId: string) =>
      cartItems.find((i) => i.productId === productId && !i.savedForLater && !i.giftRuleId),
    getCartItemById: (cartItemId: string) =>
      cartItems.find((i) => i.id === cartItemId),
    refreshCart,
    // Loading state functions
    isItemLoading: (itemId: string) => loadingItems.has(itemId),
    isProductLoading: (productId: string) => loadingProducts.has(productId),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = use(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
