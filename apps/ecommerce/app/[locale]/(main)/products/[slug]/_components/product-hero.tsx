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

  return (
    <div className="w-full lg:sticky lg:top-5 h-full">
      <ProductImages images={images} productName={product.title} />
    </div>
  );
};
