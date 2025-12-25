import { ProductImages } from "./ProductImages";
import type { Product } from "./product-page.types";

interface ProductHeroProps {
  product: Product;
}

export const ProductHero = ({ product }: ProductHeroProps) => {
  const images = Array.isArray(product.images)
    ? (product.images as string[])
    : product.images
      ? [product.images as string]
      : [];

  return (
    <div className="w-full lg:sticky lg:top-5 h-full">
      <ProductImages images={images} productName={product.title} />
    </div>
  );
};
