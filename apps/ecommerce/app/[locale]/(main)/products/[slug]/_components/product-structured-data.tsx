import { JsonLd } from "@/components/seo/json-ld";
import {
  generateBreadcrumbStructuredData,
  generateProductStructuredData,
} from "@/lib/structured-data";
import { localizedUrl } from "@/lib/metadata";
import { parsePriceJson } from "@workspace/lib";
import type { Product } from "./product-page.types";
import type { ProductLocale } from "@/lib/product-translations";

interface ProductStructuredDataProps {
  product: Product;
  locale: ProductLocale;
  /** Localized "Home" label for the breadcrumb trail. */
  homeLabel: string;
}

export function ProductStructuredData({
  product,
  locale,
  homeLabel,
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
    sku: product.sku,
    condition: product.condition,
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
    // Checkout only waives delivery for seller-level free delivery (the
    // product-level flag isn't applied), and digital items never ship.
    freeDelivery:
      product.seller?.freeDelivery === true || product.productType === "digital",
  }, locale);

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: homeLabel, url: localizedUrl(locale, "") },
    ...(product.category?.slug && categoryName
      ? [
          {
            name: categoryName,
            url: localizedUrl(locale, `/categories/${product.category.slug}`),
          },
        ]
      : []),
    {
      name: product.title,
      url: localizedUrl(locale, `/products/${product.slug}`),
    },
  ]);

  return (
    <>
      <JsonLd data={structuredData} />
      <JsonLd data={breadcrumbData} />
    </>
  );
}
