"use client";

import { Button } from "@workspace/ui/components/button";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { WishlistButtonProps } from "./product-card.types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  addToWishlist as addToWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
  getWishlistItems,
} from "@/actions/wishlist";
import { useRouter } from "next/navigation";

// 🔑 Centralized size styles
const sizeStyles = {
  sm: {
    icon: "h-3! w-3! md:h-4 md:w-4",
    loader: "h-3! w-3! md:h-4 md:w-4",
    gap: "ml-1 md:ml-2",
  },
  default: {
    icon: "h-4! w-4! md:h-5 md:w-5",
    loader: "h-4! w-4! md:h-5 md:w-5",
    gap: "ml-2 md:ml-3",
  },
  lg: {
    icon: "h-4! w-4! md:h-6 md:w-6",
    loader: "h-5! w-5! md:h-6 md:w-6",
    gap: "ml-3 md:ml-4",
  },
  xl: {
    icon: "h-6! w-6! md:h-7 md:w-7",
    loader: "h-6! w-6! md:h-7 md:w-7",
    gap: "ml-3 md:ml-4",
  },
} as const;

export const WishlistButton = ({
  productId,
  disabled = false,
  className,
  size = "default",
  variant = "ghost",
  showText = true,
  onSuccess,
  isInWishlist: initialIsInWishlist = false,
  wishlistItemId,
}: WishlistButtonProps & {
  isInWishlist?: boolean;
  wishlistItemId?: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(initialIsInWishlist);
  const router = useRouter();

  const toggleWishlist = async () => {
    if (disabled || !productId || isLoading) return;

    setIsLoading(true);
    try {
      if (isWishlisted && wishlistItemId) {
        const result = await removeFromWishlistAction(wishlistItemId);
        if (result.success) {
          setIsWishlisted(false);
          router.refresh();
          toast.success("Removed from wishlist");
        } else {
          toast.error(result.error || "Failed to remove from wishlist");
        }
      } else {
        const result = await addToWishlistAction({ productId });
        if (result.success) {
          setIsWishlisted(true);
          router.refresh();
          toast.success("Added to wishlist");
        } else {
          toast.error(result.error || "Failed to add to wishlist");
        }
      }
      onSuccess?.();
    } catch (error) {
      console.error("Wishlist toggle error:", error);
      toast.error("An error occurred with wishlist");
    } finally {
      setIsLoading(false);
    }
  };
  const styles = sizeStyles[size] || sizeStyles.default;

  return (
    <Button
      className={className}
      onClick={toggleWishlist}
      disabled={disabled || isLoading}
      size={size}
      variant={variant}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isLoading ? (
        <Loader2 className={`${styles.loader} animate-spin`} />
      ) : (
        <Heart
          className={`${styles.icon} ${
            isWishlisted ? "fill-current text-red-500" : ""
          }`}
        />
      )}
      {showText && (
        <span className={`${styles.gap}`}>
          {isLoading
            ? "Loading..."
            : isWishlisted
              ? "Wishlisted"
              : "Add to Wishlist"}
        </span>
      )}
    </Button>
  );
};
