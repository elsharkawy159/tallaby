import { useMemo } from "react";
import { ProductImages } from "./ProductImages";
import type { Product } from "./product-page.types";
import type { productVariants } from "@workspace/db";

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

    // If a variant is selected and has an image, prepend it to the images array
    if (selectedVariant?.imageUrl) {
      return [selectedVariant.imageUrl, ...baseImages];
    }

    return baseImages;
  }, [product.images, selectedVariant?.imageUrl]);

  return (
    <div className="w-full lg:sticky lg:top-5 h-full">
      <ProductImages images={images} productName={product.title} />
    </div>
  );
};
