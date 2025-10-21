import { generateProductStructuredData } from "@/lib/structured-data";
import type { Product } from "./product-page.types";

interface ProductStructuredDataProps {
  product: Product;
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const structuredData = generateProductStructuredData({
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: product.price,
    images: product.images,
    brand: product.brand,
    category: product.category,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    stockCount: product.stockCount,
    isActive: product.isActive,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}
