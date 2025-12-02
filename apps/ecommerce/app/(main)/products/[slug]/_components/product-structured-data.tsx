import { generateProductStructuredData } from "@/lib/structured-data";
import type { Product } from "./product-page.types";

interface ProductStructuredDataProps {
  product: Product;
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const price = (product.price as any) || {};
  const stockCount = product.quantity ? Number(product.quantity) : undefined;

  const structuredData = generateProductStructuredData({
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description ?? "",
    price: {
      final: Number(price.final ?? price.current ?? price.list ?? 0),
      list: Number(price.list ?? price.current ?? price.final ?? 0),
    },
    images: Array.isArray(product.images) ? (product.images as string[]) : [],
    brand: product.brand
      ? {
          id: product.brand.id,
          name: product.brand.name,
          logoUrl: product.brand.logoUrl ?? undefined,
        }
      : undefined,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name ?? "",
          slug: product.category.slug ?? "",
        }
      : undefined,
    averageRating: Number(product.averageRating ?? 0),
    reviewCount: Number(product.reviewCount ?? 0),
    stockCount,
    isActive: Boolean(product.isActive),
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
