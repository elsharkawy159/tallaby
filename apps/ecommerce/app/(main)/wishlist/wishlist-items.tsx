"use client";

import { Button } from "@workspace/ui/components/button";
import { Heart } from "lucide-react";
import Link from "next/link";
import ProductCard from "../products/[slug]/_components/ProductCard";
import { useWishlist } from "@/providers/wishlist-provider";
import type { WishlistItem } from "@/types/wishlist";

export const WishlistItems = () => {
  const { wishlistItems } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-600 mb-2">
          Your wishlist is empty
        </h2>
        <p className="text-gray-500 mb-8">
          Save items you love to your wishlist
        </p>
        <Link href="/products">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {wishlistItems.map((item: WishlistItem) => {
        // Transform wishlist item data to match ProductCard props
        const productCardProps = {
          id: item.product.id,
          title: item.product.title,
          slug: item.product.slug,
          images: item.product.images,
          price:
            typeof item.product.price === "number"
              ? item.product.price
              : typeof item.product.price === "object"
                ? item.product.price
                : { final: parseFloat((item.product.price as string) || "0") },
          averageRating: item.product.averageRating,
          reviewCount: item.product.reviewCount,
        };

        return <ProductCard key={item.id} {...productCardProps} />;
      })}
    </div>
  );
};
