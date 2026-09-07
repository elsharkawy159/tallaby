import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { SimilarProducts } from "@/app/[locale]/(main)/products/[slug]/_components/similar-products";
import { SimilarProductsSkeleton } from "@/app/[locale]/(main)/products/[slug]/_components/similar-products.skeleton";
import { getCartRecommendations } from "@/actions/recommendations";
import type { ProductLocale } from "@/lib/product-translations";

interface CartSimilarProductsProps {
  cartProductIds: string[];
}

async function CartSimilarProductsContent({
  cartProductIds,
}: CartSimilarProductsProps) {
  const locale = (await getLocale()) as ProductLocale;
  const t = await getTranslations("cart");
  const recommendationsResult = await getCartRecommendations(
    cartProductIds,
    locale
  );

  const products = recommendationsResult.success
    ? (recommendationsResult.data ?? [])
    : [];

  if (products.length === 0) {
    return null;
  }

  return (
    <SimilarProducts products={products} title={t("similarItems")} />
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
