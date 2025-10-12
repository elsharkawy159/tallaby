"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getWishlistItems, removeFromWishlist } from "@/actions/wishlist";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Heart, Trash2, ShoppingCart, Package } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { addToCart } from "@/actions/cart";
import { formatPrice } from "@workspace/lib/src/utils/formatPrice";

interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  addedAt: string;
  notes: string | null;
  quantity: number;
  priority: number;
  product: {
    id: string;
    title: string;
    slug: string;
    price: {
      base: number;
      list: number;
      final: number;
      discountType: string;
      discountValue: number;
    };
    images: string[] | null;
    brand: {
      name: string;
      slug: string;
    } | null;
    seller: {
      displayName: string;
      slug: string;
    } | null;
  };
}

function WishlistLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());

  const fetchWishlistItems = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const result = await getWishlistItems();

      if (result.success && result.data) {
        setWishlistItems(result.data as WishlistItem[]);
      }
    } catch (error) {
      console.error("Error fetching wishlist items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlistItems();
  }, [user]);

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItems((prev) => new Set(prev).add(itemId));
    try {
      const result = await removeFromWishlist(itemId);

      if (result.success) {
        toast.success("Item removed from wishlist");
        await fetchWishlistItems();
      } else {
        toast.error(result.error || "Failed to remove item");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setRemovingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    setAddingToCart((prev) => new Set(prev).add(item.id));
    try {
      const result = await addToCart(item.productId, item.quantity);

      if (result.success) {
        toast.success("Added to cart");
        // Optionally remove from wishlist after adding to cart
        // await handleRemoveItem(item.id)
      } else {
        toast.error(result.error || "Failed to add to cart");
      }
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  if (isLoading) {
    return <WishlistLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Wishlist</CardTitle>
              <CardDescription>
                Items you&apos;ve saved for later
              </CardDescription>
            </div>
            {wishlistItems.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {wishlistItems.length} item(s)
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Wishlist Items */}
      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                <Link href={`/products/${item.product.slug}`}>
                  {item.product.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={removingItems.has(item.id)}
                >
                  {removingItems.has(item.id) ? (
                    <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  )}
                </Button>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="block"
                  >
                    <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                      {item.product.title}
                    </h3>
                  </Link>

                  {item.product.brand && (
                    <p className="text-sm text-muted-foreground">
                      {item.product.brand.name}
                    </p>
                  )}

                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">
                      {formatPrice(item.product.price.final, "EGP")}
                    </span>
                    {item.product.price.final < item.product.price.list && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(item.product.price.list, "EGP")}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(item)}
                      disabled={addingToCart.has(item.id)}
                    >
                      {addingToCart.has(item.id) ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removingItems.has(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <Heart className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Your wishlist is empty
                </h3>
                <p className="text-muted-foreground">
                  Save items you like to your wishlist
                </p>
              </div>
              <Button asChild>
                <Link href="/products">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Start Shopping
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
