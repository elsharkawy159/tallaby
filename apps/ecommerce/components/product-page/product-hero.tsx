import { useMemo } from "react";
import { ProductImages } from "./ProductImages";
import type { Product } from "./product-page.types";
import type { productVariants } from "@workspace/db";
import { getVariantImageUrls } from "@/lib/variant-images";

type ProductVariant = typeof productVariants.$inferSelect;

interface ProductHeroProps {
  product: Product;
  selectedVariantId?: string | null;
  selectedVariant?: ProductVariant | null;
}

export const ProductHero = ({
  product,
  selectedVariantId,
  selectedVariant,
}: ProductHeroProps) => {
  const images = useMemo(() => {
    const baseImages = Array.isArray(product.images)
      ? (product.images as string[])
      : product.images
        ? [product.images as string]
        : [];

    const variantImages = getVariantImageUrls(selectedVariant);

    if (variantImages.length > 0) {
      return variantImages;
    }

    return baseImages;
  }, [product.images, selectedVariant]);

  const bulletPoints = useMemo(() => {
    if (!Array.isArray(product.bulletPoints)) return [];
    return product.bulletPoints.filter(
      (point): point is string => typeof point === "string" && point.trim().length > 0
    );
  }, [product.bulletPoints]);

  return (
    // Mobile: pinned edge to edge (cancelling the container gutter) so the
    // details sheet can slide over it. Desktop: sticky beside the buy box.
    <div className="sticky top-0 z-0 -mx-4 self-start lg:top-24 lg:mx-0 lg:w-full">

      <ProductImages
        images={images}
        productName={product.title}
        productId={product.id}
        description={product.description}
        bulletPoints={bulletPoints}
      />
    </div>
  );
};
