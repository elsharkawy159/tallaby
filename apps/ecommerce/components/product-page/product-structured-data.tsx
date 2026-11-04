import { JsonLd } from "@/components/seo/json-ld";
import {
  generateBreadcrumbStructuredData,
  generateProductStructuredData,
} from "@/lib/structured-data";
import { parsePriceJson } from "@workspace/lib";
import type { Product } from "./product-page.types";
import type { ProductLocale } from "@/lib/product-translations";

interface ProductStructuredDataProps {
  product: Product;
  locale: ProductLocale;
  /** Localized "Home" label for the breadcrumb trail. */
  homeLabel: string;
  /** The store this page belongs to: every URL and the seller name come from it. */
  store: { url: string; name: string; currency?: string };
}

export function ProductStructuredData({
  product,
  locale,
  homeLabel,
  store,
}: ProductStructuredDataProps) {
  const home = `${store.url}${locale === "ar" ? "" : `/${locale}`}`;
  const price = parsePriceJson(product.price);
  const stockCount = product.trackStock !== false && product.quantity ? Number(product.quantity) : undefined;
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
    unlimitedStock: product.trackStock === false,
    status: product.status,
  }, { home, sellerName: store.name, currency: store.currency });

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: homeLabel, url: home },
    { name: product.title, url: `${home}/products/${product.slug}` },
  ]);

  return (
    <>
      <JsonLd data={structuredData} />
      <JsonLd data={breadcrumbData} />
    </>
  );
}
