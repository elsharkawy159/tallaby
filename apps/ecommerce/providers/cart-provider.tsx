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
    successMsg: string,
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
        toast.success(successMsg);
        return { success: true };
      }
      toast.error(result.error || errorMsg);
      return { success: false, message: result.error };
    } catch (err) {
      console.error(errorMsg, err);
      toast.error(errorMsg);
      return { success: false, message: "An error occurred" };
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
      tToast("itemAddedToCart"),
      tToast("failedToAddItem"),
      p.productId,
      setProductLoading
    );

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 0) {
      toast.error(tToast("quantityCannotBeNegative"));
      return Promise.resolve({ success: false, message: "Invalid quantity" });
    }
    return handleAction(
      updateCartItem,
      [itemId, quantity],
      tToast("cartUpdated"),
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
    updateQuantity,
    removeFromCart,
    clearCart,
    isInCart: (productId: string) =>
      cartItems.some((i) => i.productId === productId && !i.savedForLater),
    getItemQuantity: (productId: string) =>
      cartItems.find((i) => i.productId === productId && !i.savedForLater)
        ?.quantity || 0,
    getCartItem: (productId: string) =>
      cartItems.find((i) => i.productId === productId && !i.savedForLater),
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
