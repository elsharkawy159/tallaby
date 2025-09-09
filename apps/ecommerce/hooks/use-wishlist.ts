"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getWishlistItems,
  addToWishlist as addToWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
  checkIfInWishlist as checkIfInWishlistAction,
  moveToCart as moveToCartAction,
} from "@/actions/wishlist";
import { getUser } from "@/actions/auth";

interface WishlistItem {
  id: string;
  productId: string;
  quantity: number | null;
  notes?: string | null;
  priority?: number | null;
  product: {
    id: string;
    title: string;
    slug: string;
    price: {
      base?: number;
      list: number;
      final: number;
    };
    images: Array<{
      url: string;
      alt_text?: string;
    }>;
    brand?: {
      name: string;
    };
    seller?: {
      displayName: string;
      slug: string;
    };
  };
}

interface Wishlist {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  items: WishlistItem[];
}

export const useWishlist = () => {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [defaultWishlist, setDefaultWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const fetchWishlists = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getWishlistItems();

      if (result.success && result.data) {
        // Transform the data to match our interface
        const transformedWishlists = result.data.map((item: any) => ({
          id: item.wishlistId,
          name: "My Wishlist", // Default name since we don't have wishlist details
          description: "",
          isPublic: false,
          items: [item],
        }));

        setWishlists(transformedWishlists);
        // Find default wishlist (first one or marked as default)
        const defaultWish = transformedWishlists[0] || null;
        setDefaultWishlist(defaultWish);
      } else {
        setWishlists([]);
        setDefaultWishlist(null);
      }
    } catch (error) {
      console.error("Error fetching wishlists:", error);
      setWishlists([]);
      setDefaultWishlist(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWishlist = useCallback(
    async (data: {
      productId: string;
      variantId?: string;
      wishlistId?: string;
      notes?: string;
      quantity?: number;
      priority?: number;
    }) => {
      try {
        setIsAdding(true);
        const result = await addToWishlistAction(data);

        if (result.success) {
          await fetchWishlists();
          toast.success("Added to wishlist");
          return { success: true };
        } else {
          toast.error(result.error || "Failed to add to wishlist");
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error("Error adding to wishlist:", error);
        toast.error("Failed to add to wishlist");
        return { success: false, error: "Failed to add to wishlist" };
      } finally {
        setIsAdding(false);
      }
    },
    [fetchWishlists]
  );

  const removeFromWishlist = useCallback(
    async (itemId: string) => {
      try {
        setIsRemoving(true);
        const result = await removeFromWishlistAction(itemId);

        if (result.success) {
          await fetchWishlists();
          toast.success("Removed from wishlist");
          return { success: true };
        } else {
          toast.error("Failed to remove from wishlist");
          return { success: false, error: "Failed to remove from wishlist" };
        }
      } catch (error) {
        console.error("Error removing from wishlist:", error);
        toast.error("Failed to remove from wishlist");
        return { success: false, error: "Failed to remove from wishlist" };
      } finally {
        setIsRemoving(false);
      }
    },
    [fetchWishlists]
  );

  const moveToCart = useCallback(
    async (itemId: string) => {
      try {
        setIsMoving(true);
        const result = await moveToCartAction(itemId);

        if (result.success) {
          await fetchWishlists();
          toast.success("Moved to cart");
          return { success: true };
        } else {
          toast.error("Failed to move to cart");
          return { success: false, error: "Failed to move to cart" };
        }
      } catch (error) {
        console.error("Error moving to cart:", error);
        toast.error("Failed to move to cart");
        return { success: false, error: "Failed to move to cart" };
      } finally {
        setIsMoving(false);
      }
    },
    [fetchWishlists]
  );

  const isInWishlist = useCallback(async (productId: string) => {
    try {
      const result = await checkIfInWishlistAction(productId);
      return result.success && result.data;
    } catch (error) {
      console.error("Error checking wishlist status:", error);
      return false;
    }
  }, []);

  const toggleWishlist = useCallback(
    async (productId: string, variantId?: string) => {
      try {
        const isInWish = await isInWishlist(productId);

        if (isInWish) {
          // Find the item to remove
          const item = defaultWishlist?.items.find(
            (item) => item.productId === productId
          );
          if (item) {
            return await removeFromWishlist(item.id);
          }
        } else {
          return await addToWishlist({ productId, variantId });
        }
      } catch (error) {
        console.error("Error toggling wishlist:", error);
        return { success: false, error: "Failed to toggle wishlist" };
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist, defaultWishlist]
  );

  // Handle guest to authenticated user transition
  const handleUserLogin = useCallback(async () => {
    try {
      const user = await getUser();
      if (user) {
        await fetchWishlists();
      }
    } catch (error) {
      console.error("Error handling user login:", error);
    }
  }, [fetchWishlists]);

  useEffect(() => {
    fetchWishlists();
  }, [fetchWishlists]);

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

  const wishlistItems = defaultWishlist?.items || [];
  const itemCount = wishlistItems.length;

  return {
    // Data
    wishlists,
    defaultWishlist,
    wishlistItems,
    itemCount,
    loading,

    // Loading states
    isAdding,
    isRemoving,
    isMoving,

    // Actions
    addToWishlist,
    removeFromWishlist,
    moveToCart,
    toggleWishlist,
    refetch: fetchWishlists,

    // Utilities
    isInWishlist,
  };
};
