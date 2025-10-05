"use client";

import { createContext, ReactNode, useState, useCallback, use } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getWishlists,
  getWishlistItems,
  addToWishlist as addToWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
  moveToCart as moveToCartAction,
  createWishlist as createWishlistAction,
  updateWishlist as updateWishlistAction,
  deleteWishlist as deleteWishlistAction,
  checkIfInWishlist,
} from "@/actions/wishlist";
import type { WishlistState, Wishlist, WishlistItem } from "@/types/wishlist";

const WishlistContext = createContext<WishlistState | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Individual item loading states
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(
    new Set()
  );
  const [loadingWishlists, setLoadingWishlists] = useState<Set<string>>(
    new Set()
  );

  const {
    data: wishlistsData,
    isLoading: loadingWishlistsList,
    refetch: refreshWishlists,
  } = useQuery({
    queryKey: ["wishlists"],
    queryFn: async () => {
      const result = await getWishlists();
      return result.success ? result.data : [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const {
    data: wishlistItemsData,
    isLoading: loadingItemsList,
    refetch: refreshWishlistItems,
  } = useQuery({
    queryKey: ["wishlist-items"],
    queryFn: async () => {
      const result = await getWishlistItems();
      return result.success ? result.data : [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const wishlists = wishlistsData ?? [];
  const defaultWishlist = wishlists.find((w) => w.isDefault) ?? null;
  const wishlistItems = (wishlistItemsData ?? []) as unknown as WishlistItem[];
  const itemCount = wishlistItems.length;
  const loading = loadingWishlistsList || loadingItemsList;

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

  const setWishlistLoading = useCallback(
    (wishlistId: string, isLoading: boolean) => {
      setLoadingWishlists((prev) => {
        const newSet = new Set(prev);
        if (isLoading) {
          newSet.add(wishlistId);
        } else {
          newSet.delete(wishlistId);
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
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["wishlists"] });
        queryClient.invalidateQueries({ queryKey: ["wishlist-items"] });
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

  const addToWishlist = (params: {
    productId: string;
    variantId?: string;
    wishlistId?: string;
    notes?: string;
    quantity?: number;
    priority?: number;
  }) =>
    handleAction(
      addToWishlistAction,
      [params],
      "Added to wishlist",
      "Failed to add to wishlist",
      params.productId,
      setProductLoading
    );

  const removeFromWishlist = (itemId: string) =>
    handleAction(
      removeFromWishlistAction,
      [itemId],
      "Removed from wishlist",
      "Failed to remove from wishlist",
      itemId,
      setItemLoading
    );

  const moveToCart = (itemId: string) =>
    handleAction(
      moveToCartAction,
      [itemId],
      "Moved to cart",
      "Failed to move to cart",
      itemId,
      setItemLoading
    );

  const createWishlist = (params: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) =>
    handleAction(
      createWishlistAction,
      [params],
      "Wishlist created",
      "Failed to create wishlist"
    );

  const updateWishlist = (
    wishlistId: string,
    params: {
      name?: string;
      description?: string;
      isPublic?: boolean;
    }
  ) =>
    handleAction(
      updateWishlistAction,
      [wishlistId, params],
      "Wishlist updated",
      "Failed to update wishlist",
      wishlistId,
      setWishlistLoading
    );

  const deleteWishlist = (wishlistId: string) =>
    handleAction(
      deleteWishlistAction,
      [wishlistId],
      "Wishlist deleted",
      "Failed to delete wishlist",
      wishlistId,
      setWishlistLoading
    );

  const isInWishlist = (productId: string, wishlistId?: string) => {
    const targetWishlistId = wishlistId || defaultWishlist?.id;
    if (!targetWishlistId) return false;

    return wishlistItems.some(
      (item) =>
        item.productId === productId && item.wishlistId === targetWishlistId
    );
  };

  const refreshWishlist = useCallback(() => {
    refreshWishlists();
    refreshWishlistItems();
  }, [refreshWishlists, refreshWishlistItems]);

  const value: WishlistState = {
    wishlists,
    defaultWishlist,
    wishlistItems,
    itemCount,
    loading,
    addToWishlist,
    removeFromWishlist,
    moveToCart,
    createWishlist,
    updateWishlist,
    deleteWishlist,
    isInWishlist,
    refreshWishlist,
    // Loading state functions
    isItemLoading: (itemId: string) => loadingItems.has(itemId),
    isProductLoading: (productId: string) => loadingProducts.has(productId),
    isWishlistLoading: (wishlistId: string) => loadingWishlists.has(wishlistId),
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistState {
  const ctx = use(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
