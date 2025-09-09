"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getCartItems,
  addToCart as addToCartAction,
  updateCartItem,
  removeFromCart as removeFromCartAction,
  clearCart as clearCartAction,
  mergeAnonymousCart,
} from "@/actions/cart";
import { getUser } from "@/actions/auth";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: string | number;
  variant?: any;
  savedForLater: boolean | null;
  product: {
    id: string;
    title: string;
    slug: string;
    images: any; // Allow any type for images
    brand?: {
      name: string;
    };
    seller?: {
      displayName: string;
      slug: string;
    };
  };
}

interface CartSummary {
  cart: any;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export const useCart = () => {
  const [cartData, setCartData] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getCartItems();

      if (result.success && result.data) {
        setCartData(result.data as CartSummary);
      } else {
        setCartData(null);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
      setCartData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(
    async (data: {
      productId: string;
      quantity?: number;
      variantId?: string;
      variant?: any;
    }) => {
      try {
        setIsAdding(true);
        const result = await addToCartAction(data);

        if (result.success) {
          await fetchCartItems();
          toast.success("Added to cart");
          return { success: true };
        } else {
          toast.error(result.error || "Failed to add to cart");
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast.error("Failed to add to cart");
        return { success: false, error: "Failed to add to cart" };
      } finally {
        setIsAdding(false);
      }
    },
    [fetchCartItems]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        setIsUpdating(true);
        const result = await updateCartItem(itemId, quantity);

        if (result.success) {
          await fetchCartItems();
          return { success: true };
        } else {
          toast.error(result.error || "Failed to update quantity");
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error("Error updating quantity:", error);
        toast.error("Failed to update quantity");
        return { success: false, error: "Failed to update quantity" };
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchCartItems]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      try {
        setIsRemoving(true);
        const result = await removeFromCartAction(itemId);

        if (result.success) {
          await fetchCartItems();
          toast.success(result.message || "Removed from cart");
          return { success: true };
        } else {
          toast.error(result.error || "Failed to remove from cart");
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error("Error removing from cart:", error);
        toast.error("Failed to remove from cart");
        return { success: false, error: "Failed to remove from cart" };
      } finally {
        setIsRemoving(false);
      }
    },
    [fetchCartItems]
  );

  const clearCart = useCallback(async () => {
    try {
      const result = await clearCartAction();

      if (result.success) {
        await fetchCartItems();
        toast.success(result.message || "Cart cleared");
        return { success: true };
      } else {
        toast.error(result.error || "Failed to clear cart");
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart");
      return { success: false, error: "Failed to clear cart" };
    }
  }, [fetchCartItems]);

  const isInCart = useCallback(
    (productId: string) => {
      if (!cartData?.items) return false;
      return cartData.items.some(
        (item) => item.productId === productId && !item.savedForLater
      );
    },
    [cartData]
  );

  const getItemQuantity = useCallback(
    (productId: string) => {
      if (!cartData?.items) return 0;
      const item = cartData.items.find(
        (item) => item.productId === productId && !item.savedForLater
      );
      return item?.quantity || 0;
    },
    [cartData]
  );

  // Handle guest to authenticated user transition
  const handleUserLogin = useCallback(async () => {
    try {
      const user = await getUser();
      if (user) {
        // Merge anonymous cart if exists
        const sessionId = localStorage.getItem("session_id");
        if (sessionId) {
          await mergeAnonymousCart(sessionId);
          localStorage.removeItem("session_id");
        }
        await fetchCartItems();
      }
    } catch (error) {
      console.error("Error handling user login:", error);
    }
  }, [fetchCartItems]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  // Listen for auth state changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth-token" && e.newValue) {
        handleUserLogin();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [handleUserLogin]);

  const cartItems = cartData?.items || [];
  const subtotal = cartData?.subtotal || 0;
  const itemCount = cartData?.itemCount || 0;

  return {
    // Data
    cartItems,
    subtotal,
    itemCount,
    loading,

    // Loading states
    isAdding,
    isUpdating,
    isRemoving,

    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refetch: fetchCartItems,

    // Utilities
    isInCart,
    getItemQuantity,
  };
};
