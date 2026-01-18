import { generateProductStructuredData } from "@/lib/structured-data";
import type { Product } from "./product-page.types";
import { getLocale } from "next-intl/server";

interface ProductStructuredDataProps {
  product: Product;
}

export async function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const locale = await getLocale();
  const price = (product.price as any) || {};
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
          name: categoryName ?? "",
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
