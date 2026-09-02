"use client";

import { useWishlistItems } from "@/lib/wishlist/use-wishlist-items";

export const WishlistCount = ({ className }: { className?: string }) => {
  // Shares its query with every WishlistButton on the page, so the header
  // badge costs no extra request.
  const { items } = useWishlistItems();
  const itemCount = items.length;

  if (itemCount === 0) return null;

  return (
    <span
      className={
        className ??
        "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-4.5 flex items-center justify-center"
      }
    >
      {itemCount}
    </span>
  );
};
