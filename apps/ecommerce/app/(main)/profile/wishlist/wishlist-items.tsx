import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/app/(main)/products/[slug]/_components/ProductCard";
import type { ProductCardProps } from "@/components/product";

interface TransformedProduct extends ProductCardProps {
  wishlistItemId: string;
}

interface WishlistItemsProps {
  products: TransformedProduct[];
}

export function WishlistItems({ products }: WishlistItemsProps) {
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
            {products.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {products.length} item(s)
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Wishlist Items */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              isInWishlist={true}
              wishlistItemId={product.wishlistItemId}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
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
          </div>
        </Card>
      )}
    </div>
  );
}
