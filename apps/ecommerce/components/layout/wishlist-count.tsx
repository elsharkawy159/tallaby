"use client";

import { useEffect, useState } from "react";
import { getWishlistItems } from "@/actions/wishlist";

export const WishlistCount = ({ className }: { className?: string }) => {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    getWishlistItems().then((wishlistResult) => {
      const count = wishlistResult.success
        ? (wishlistResult.data?.length ?? 0)
        : 0;
      setItemCount(count);
    });
  }, []);

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
