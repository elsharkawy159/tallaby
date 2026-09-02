"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getWishlistItems } from "@/actions/wishlist";

export const WISHLIST_ITEMS_QUERY_KEY = ["wishlist-items"] as const;

interface WishlistLookupEntry {
  id: string;
  productId: string;
}

/**
 * Per-viewer wishlist state, resolved on the client.
 *
 * Wishlist membership is the one piece of a product card that differs per
 * user. Reading it during the server render forced an auth + database
 * round-trip into every listing page and — because it reads cookies — made
 * those routes impossible to prerender. Fetching it here instead keeps the
 * product markup itself shared and cacheable, and the single query is
 * deduplicated by React Query across every card on the page (it shares its
 * key with WishlistProvider, so mounting that provider costs no extra
 * request either).
 */
export function useWishlistItems() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: WISHLIST_ITEMS_QUERY_KEY,
    queryFn: async () => {
      const result = await getWishlistItems();
      return result.success
        ? ((result.data ?? []) as unknown as WishlistLookupEntry[])
        : [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    // Guests have no wishlist; a failed lookup shouldn't be retried per card.
    retry: false,
  });

  const items = data ?? [];

  const findByProductId = useCallback(
    (productId: string) => items.find((item) => item.productId === productId),
    [items]
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: WISHLIST_ITEMS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["wishlists"] });
  }, [queryClient]);

  return { items, isLoading, findByProductId, invalidate };
}
