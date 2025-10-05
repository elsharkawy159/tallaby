"use client";

import { Button } from "@workspace/ui/components/button";
import { Heart, Loader2 } from "lucide-react";
import { useWishlist } from "@/providers/wishlist-provider";
import { toast } from "sonner";
import type { WishlistButtonProps } from "./product-card.types";
import { cn } from "@/lib/utils";

// 🔑 Centralized size styles
const sizeStyles = {
  sm: {
    icon: "h-3! w-3! md:h-4 md:w-4",
    loader: "h-3! w-3! md:h-4 md:w-4",
    text: "text-xs md:text-md",
    gap: "ml-1 md:ml-2",
  },
  default: {
    icon: "h-4! w-4! md:h-5 md:w-5",
    loader: "h-4! w-4! md:h-5 md:w-5",
    text: "text-md md:text-base",
    gap: "ml-2 md:ml-3",
  },
  lg: {
    icon: "h-5! w-5! md:h-6 md:w-6",
    loader: "h-5! w-5! md:h-6 md:w-6",
    text: "text-base md:text-lg",
    gap: "ml-3 md:ml-4",
  },
  xl: {
    icon: "h-6! w-6! md:h-7 md:w-7",
    loader: "h-6! w-6! md:h-7 md:w-7",
    text: "text-lg md:text-xl",
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
}: WishlistButtonProps) => {
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    isProductLoading,
    wishlistItems,
  } = useWishlist();

  const isWishlisted = isInWishlist(productId);
  const wishlistItem = wishlistItems.find(
    (item) => item.productId === productId
  );

  const toggleWishlist = async () => {
    if (disabled || !productId) return;

    try {
      if (isWishlisted && wishlistItem) {
        await removeFromWishlist(wishlistItem.id);
      } else {
        await addToWishlist({ productId });
      }
      onSuccess?.();
    } catch (error) {
      console.error("Wishlist toggle error:", error);
      toast.error("An error occurred with wishlist");
    }
  };

  const isLoading = isProductLoading(productId);
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
        <span className={`${styles.gap} ${styles.text}`}>
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
