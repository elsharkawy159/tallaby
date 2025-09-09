"use client";

import { useWishlist } from "@/hooks/use-wishlist";
import { Button } from "@workspace/ui/components/button";
import { Heart } from "lucide-react";
import Link from "next/link";
import ProductCard from "../products/[slug]/_components/ProductCard";

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
    averageRating?: number | null;
    reviewCount?: number;
  };
}

interface WishlistItemsProps {
  items: WishlistItem[];
}

export const WishlistItems = ({ items }: WishlistItemsProps) => {
  const { removeFromWishlist, isRemoving } = useWishlist();

  const handleRemoveFromWishlist = async (itemId: string) => {
    await removeFromWishlist(itemId);
  };

  if (items.length === 0) {
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
      {items.map((item) => {
        // Transform wishlist item data to match ProductCard props
        const productCardProps = {
          id: item.product.id,
          title: item.product.title,
          slug: item.product.slug,
          images: item.product.images,
          price: item.product.price,
          averageRating: item.product.averageRating,
          reviewCount: item.product.reviewCount,
        };

        return (
          <div key={item.id} className="relative">
            <ProductCard {...productCardProps} />

            {/* Remove from wishlist button overlay */}
            <button
              className="absolute top-3 right-3 z-10 rounded-full bg-white/90 hover:bg-white shadow-md p-2 transition-colors text-red-500"
              onClick={() => handleRemoveFromWishlist(item.id)}
              disabled={isRemoving}
              aria-label="Remove from wishlist"
            >
              <Heart className="h-4 w-4 fill-current" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
