"use client";

import { Heart, Loader2, Star, Trash } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import Link from "next/link";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useWishlist } from "@/hooks/use-wishlist";
import { useState } from "react";

export interface ProductCardProps {
  id?: string;
  title?: string;
  name?: string; // legacy/demo shape support
  slug?: string;
  images?: Array<string | { url?: string } | unknown>;
  // legacy shape support
  base_price?: number;
  sale_price?: number | null;
  average_rating?: number | null;
  review_count?: number;
  // new API shape
  averageRating?: number | null;
  reviewCount?: number;
  price?:
    | number
    | {
        base?: number | null;
        list?: number | null;
        final?: number | null;
        discountType?: string | null;
        discountValue?: number | null;
      }
    | null;
}

const fallbackImage = "/png product.png";

function resolvePrimaryImage(images?: ProductCardProps["images"]) {
  if (!images || images.length === 0) return fallbackImage;
  const first = images[0] as any;
  const key = typeof first === "string" ? first : first?.url;
  if (!key || typeof key !== "string") return fallbackImage;
  return getPublicUrl(key, "products");
}

function resolvePrice(product: ProductCardProps) {
  // new API shape: price as object
  if (product && typeof product.price === "object" && product.price !== null) {
    const p = product.price as NonNullable<ProductCardProps["price"]> & any;
    const value = p.final ?? p.base ?? p.list;
    if (typeof value === "number") return value;
  }
  // demo shape: price as number
  if (typeof product?.price === "number") return product.price as number;
  // legacy shape: base/sale
  if (typeof product?.sale_price === "number")
    return product.sale_price as number;
  if (typeof product?.base_price === "number")
    return product.base_price as number;
  return 0;
}

const ProductCard = (product: ProductCardProps) => {
  const slug = product.slug || "unknown-product";
  const title = product.title || product.name || "Untitled Product";
  const productImage = resolvePrimaryImage(product.images);
  const productId = product.id || "";

  const rating =
    (typeof product.average_rating === "number"
      ? product.average_rating
      : null) ??
    (typeof product.averageRating === "number"
      ? product.averageRating
      : null) ??
    0;
  const reviews = product.review_count ?? product.reviewCount ?? 0;
  const price = resolvePrice(product);

  // Hooks
  const {
    addToCart,
    isInCart,
    getItemQuantity,
    updateQuantity,
    isUpdating,
    removeFromCart,
    cartItems,
  } = useCartStore();
  const { toggleWishlist, isAdding: isWishlistAdding } = useWishlist();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = async () => {
    if (!productId) return;

    const result = await addToCart({
      productId,
      quantity: 1,
    });

    if (result.success) {
      // Optional: Show success feedback
    }
  };

  const handleWishlistToggle = async () => {
    if (!productId) return;

    const result = await toggleWishlist(productId);

    if (result?.success) {
      setIsWishlisted(!isWishlisted);
    }
  };

  const isInCartStatus = isInCart(productId);
  const cartQuantity = getItemQuantity(productId);

  const handleQuantityChange = async (newQuantity: number) => {
    if (!productId || newQuantity < 0) return;

    if (newQuantity === 0) {
      // Remove from cart if quantity becomes 0
      const cartItem = cartItems.find(
        (item) => item.productId === productId && !item.savedForLater
      );
      if (cartItem) {
        await removeFromCart(cartItem.id);
      }
    } else {
      // Update quantity
      const cartItem = cartItems.find(
        (item) => item.productId === productId && !item.savedForLater
      );
      if (cartItem) {
        await updateQuantity(cartItem.id, newQuantity);
      }
    }
  };

  return (
    <Card className="group bg-white shadow-sm h-full border-0 p-0 relative w-[285px] overflow-hidden rounded-[8px_8px_0_8px]">
      <CardContent className="p-2">
        {/* Product Image */}
        <div className="relative rounded-md overflow-hidden">
          <Link href={`/products/${slug}`}>
            <Image
              src={productImage}
              alt={title || "Product image"}
              width={270}
              height={310}
              className="w-full aspect-[2.6/3] h-full object-contain bg-white"
            />
          </Link>

          {/* Wishlist Button */}
          <button
            className="absolute cursor-pointer top-3 right-3 rounded-full bg-white/90 hover:bg-white shadow-md p-2 transition-colors"
            aria-label={
              isWishlisted ? "Remove from wishlist" : "Add to wishlist"
            }
            onClick={handleWishlistToggle}
            disabled={isWishlistAdding}
          >
            {isWishlistAdding ? (
              <Loader2 className="size-5 transition-colors" />
            ) : (
              <Heart
                className={`size-5 transition-colors ${
                  isWishlisted
                    ? "text-red-500 fill-current"
                    : "text-gray-600 hover:text-red-500"
                }`}
              />
            )}
          </button>

          {/* Image Carousel Dots */}
          {/* <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {[1, 2, 3].map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === 0 ? "bg-primary" : "bg-white/60"
                }`}
              />
            ))}
          </div> */}
        </div>

        {/* Product Info */}
        <div className="space-y-2 mt-2.5">
          <div className="flex items-center gap-4.5 justify-between mb-2">
            <h3 className="text-base font-medium line-clamp-2">{title}</h3>
            <span className="text-lg font-semibold">{price}</span>
          </div>

          {/* Rating */}
          <div className="flex text-sm items-center gap-1">
            <span className="font-medium">{rating}</span>
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-gray-500">({reviews})</span>
          </div>

          {/* Add to Cart Button or Quantity Counter */}
          {isInCartStatus ? (
            <div className="flex bg-accent h-9.5 min-w-[146px] items-center pr-5 text-white text-base absolute bottom-0 right-0 font-bold py-2.5 rounded-none [clip-path:polygon(17%_0,100%_0,100%_100%,0_100%,20_20%)] pl-10">
              <span
                onClick={() => handleQuantityChange(cartQuantity - 1)}
                className="size-7 shrink-0 p-0 cursor-pointer rounded-full border-2 text-xl border-white flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                {cartQuantity === 1 ? <Trash className="size-4" /> : "-"}
              </span>
              <span className="min-w-[2rem] text-center font-medium">
                {isUpdating ? (
                  <Loader2 className="size-4 animate-spin mx-auto transition-colors" />
                ) : (
                  cartQuantity
                )}
              </span>
              <span
                onClick={() => handleQuantityChange(cartQuantity + 1)}
                className="size-7 shrink-0 p-0 cursor-pointer rounded-full border-2 text-xl border-white flex items-center justify-center"
                aria-label="Increase quantity"
              >
                +
              </span>
            </div>
          ) : (
            <Button
              className="absolute text-sm bottom-0 right-0 font-bold py-2.5 rounded-none [clip-path:polygon(17%_0,100%_0,100%_100%,0_100%,20_20%)] pl-10"
              onClick={handleAddToCart}
              // disabled={isAdding}
            >
              {/* {isAdding ? "Adding..." : "Add to cart"} */}
              Add to cart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
