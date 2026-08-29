import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { SimilarProducts } from "@/app/(main)/products/[slug]/_components/similar-products";
import { SimilarProductsSkeleton } from "@/app/(main)/products/[slug]/_components/similar-products.skeleton";
import { getCartRecommendations } from "@/actions/recommendations";
import { getWishlistItems } from "@/actions/wishlist";
import type { ProductLocale } from "@/lib/product-translations";

interface CartSimilarProductsProps {
  cartProductIds: string[];
}

async function CartSimilarProductsContent({
  cartProductIds,
}: CartSimilarProductsProps) {
  const locale = (await getLocale()) as ProductLocale;
  const t = await getTranslations("cart");
  const [recommendationsResult, wishlistResult] = await Promise.all([
    getCartRecommendations(cartProductIds, locale),
    getWishlistItems(),
  ]);

  const products = recommendationsResult.success
    ? (recommendationsResult.data ?? [])
    : [];
  const wishlistItems = wishlistResult.success
    ? (wishlistResult.data ?? [])
    : [];

  if (products.length === 0) {
    return null;
  }

  return (
    <SimilarProducts
      products={products}
      wishlistItems={wishlistItems}
      title={t("similarItems")}
    />
  );
}

export function CartSimilarProducts({
  cartProductIds,
}: CartSimilarProductsProps) {
  return (
    <Suspense fallback={<SimilarProductsSkeleton />}>
      <CartSimilarProductsContent cartProductIds={cartProductIds} />
    </Suspense>
  );
}
