"use client";

import { useWishlistStore } from "@/stores/wishlist.store";
import { useMemo } from "react";

export const useWishlistStatus = (productId: string) => {
  const { wishlistItems } = useWishlistStore();

  const isInWishlist = useMemo(() => {
    return wishlistItems.some((item) => item.productId === productId);
  }, [wishlistItems, productId]);

  return { isInWishlist, loading: false };
};
