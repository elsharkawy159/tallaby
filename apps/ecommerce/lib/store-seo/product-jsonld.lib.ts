import { discountExpiryDate, productPricing } from "@/components/product-page/product-page.lib";
import type { Product } from "@/components/product-page/product-page.types";
import { getDefaultProductVariant } from "@/lib/product-variants";
import type { ProductLocale } from "@/lib/product-translations";
import type { ProductJsonLdInput } from "@/lib/structured-data";

/**
 * The storefront product as the product JSON-LD reads it (lib/structured-data.ts).
 * Pure: the page passes the store's shipping details and category in.
 */

/**
 * Whether the product can be bought: active, and untracked stock (0138), or
 * stock left on any variant (with variants) or on the product itself.
 */
export function productInStock(product: Pick<Product, "status" | "trackStock" | "quantity" | "productVariants">): boolean {
  if (product.status !== "active") return false;
  if (product.trackStock === false) return true;
  const variants = product.productVariants ?? [];
  if (variants.length) return variants.some((v) => Number(v.stock ?? 0) > 0);
  return Number(product.quantity ?? 0) > 0;
}

/** The price shown on load (default variant, else the product), as the page metadata uses. */
export function productOfferPrice(product: Product): NonNullable<ProductJsonLdInput["price"]> {
  const pricing = productPricing(product, getDefaultProductVariant(product.productVariants));
  const ends = pricing.listPrice != null ? discountExpiryDate(pricing.discountEndsAt) : null;
  return {
    final: pricing.price,
    list: pricing.listPrice,
    ...(ends ? { validUntil: ends.toISOString().slice(0, 10) } : {}),
  };
}

export function productJsonLdInput(
  product: Product,
  locale: ProductLocale,
  { categoryName, shippingDetails }: { categoryName?: string | null; shippingDetails?: readonly object[] } = {},
): ProductJsonLdInput {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    sku: product.sku,
    condition: product.condition,
    description: product.description ?? "",
    price: productOfferPrice(product),
    images: Array.isArray(product.images) ? (product.images as string[]) : [],
    brand: product.brand?.name ? { name: product.brand.name } : null,
    categoryName:
      categoryName ??
      (product.category ? (locale === "ar" ? product.category.nameAr || product.category.name : product.category.name) : null),
    inStock: productInStock(product),
    // Approved reviews (getProductBySlug); seller-added ones are dropped by the builder.
    reviews: (product.reviews ?? []).map((r) => ({
      rating: Number(r.rating),
      source: r.source,
      authorName: r.user?.fullName ?? null,
      isAnonymous: r.isAnonymous,
      title: r.title,
      body: r.comment,
      createdAt: r.createdAt,
    })),
    shippingDetails,
  };
}

/**
 * Home › Category › Product on the store's own host. The category step is the
 * store category (its catalog filter `/products?category=<key>`), only when
 * the product sits in one.
 */
export function productBreadcrumb(input: {
  home: string;
  homeLabel: string;
  productUrl: string;
  productTitle: string;
  category?: { key: string; name: string } | null;
  /** The category's main category when it is a sub-category (F-95). */
  parentCategory?: { key: string; name: string } | null;
}): { name: string; url: string }[] {
  const { home, homeLabel, productUrl, productTitle, category, parentCategory } = input;
  return [
    { name: homeLabel, url: home },
    ...(category?.name && parentCategory?.name
      ? [{ name: parentCategory.name, url: `${home}/products?category=${encodeURIComponent(parentCategory.key)}` }]
      : []),
    ...(category?.name ? [{ name: category.name, url: `${home}/products?category=${encodeURIComponent(category.key)}` }] : []),
    { name: productTitle, url: productUrl },
  ];
}
