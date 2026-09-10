import { generateProductStructuredData } from "@/lib/structured-data";
import { parsePriceJson } from "@workspace/lib";
import type { Product } from "./product-page.types";
import type { ProductLocale } from "@/lib/product-translations";

interface ProductStructuredDataProps {
  product: Product;
  locale: ProductLocale;
}

export function ProductStructuredData({
  product,
  locale,
}: ProductStructuredDataProps) {
  const price = parsePriceJson(product.price);
  const stockCount = product.quantity ? Number(product.quantity) : undefined;
  const categoryName =
    product.category
      ? locale === "ar"
        ? product.category.nameAr || product.category.name
        : product.category.name
      : undefined;

  const structuredData = generateProductStructuredData({
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description ?? "",
    price: {
      final: price.final,
      list: price.list ?? price.final,
    },
    images: Array.isArray(product.images) ? (product.images as string[]) : [],
    ...(product.brand
      ? {
          brand: {
            id: product.brand.id,
            name: product.brand.name,
            logoUrl: product.brand.logoUrl ?? undefined,
          },
        }
      : {}),
    ...(product.category
      ? {
          category: {
            id: product.category.id,
            name: categoryName ?? "",
            slug: product.category.slug ?? "",
          },
        }
      : {}),
    averageRating: Number(product.averageRating ?? 0),
    reviewCount: Number(product.reviewCount ?? 0),
    stockCount,
    status: product.status,
  }, locale);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}
