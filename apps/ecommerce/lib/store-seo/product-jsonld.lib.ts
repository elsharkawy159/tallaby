import { discountExpiryDate, productPricing, variantHasStock, type ProductVariant } from "@/components/product-page/product-page.lib";
import type { Product } from "@/components/product-page/product-page.types";
import { variantAttributes } from "@/lib/product-feed/product-feed.lib";
import { getDefaultProductVariant } from "@/lib/product-variants";
import type { ProductLocale } from "@/lib/product-translations";
import type { ProductJsonLdInput, ProductJsonLdVariant } from "@/lib/structured-data";
import { getVariantImageUrls } from "@/lib/variant-images";

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
  return variantOfferPrice(product, getDefaultProductVariant(product.productVariants));
}

/** The price shown with `variant` picked (`productPricing`; null: the product's own), with its discount's end. */
function variantOfferPrice(product: Product, variant: ProductVariant | null): NonNullable<ProductJsonLdInput["price"]> {
  const pricing = productPricing(product, variant);
  const ends = pricing.listPrice != null ? discountExpiryDate(pricing.discountEndsAt) : null;
  return {
    final: pricing.price,
    list: pricing.listPrice,
    ...(ends ? { validUntil: ends.toISOString().slice(0, 10) } : {}),
  };
}

/**
 * The variants for a ProductGroup, or none when the product has fewer than
 * two priced variants or they all cost the same (one Offer then says it
 * truthfully). Labels, colour and size are read as the store feed reads them
 * (`variantAttributes`), so Search and Merchant Center agree.
 */
export function productJsonLdVariants(
  product: Product,
  locale: ProductLocale,
  shippingFor?: (price: number) => readonly object[],
): ProductJsonLdVariant[] {
  const priced = (product.productVariants ?? [])
    .map((variant) => ({ variant, price: variantOfferPrice(product, variant) }))
    .filter(({ price }) => Number.isFinite(price.final));
  if (priced.length < 2 || new Set(priced.map(({ price }) => price.final)).size < 2) return [];
  const productImages = Array.isArray(product.images) ? (product.images as string[]) : [];
  return priced.map(({ variant, price }) => {
    const { label, color, size } = variantAttributes(
      {
        id: variant.id,
        price: variant.price,
        stock: Number(variant.stock ?? 0),
        images: [],
        title: variant.title ?? null,
        option1: variant.option1 ?? null,
        option2: variant.option2 ?? null,
        option3: variant.option3 ?? null,
        localized: variant.localized,
      },
      locale,
    );
    return {
      id: variant.id,
      label,
      sku: variant.sku ?? null,
      images: [...getVariantImageUrls(variant), ...productImages],
      price,
      inStock: product.status === "active" && variantHasStock(product, variant),
      color,
      size,
      shippingDetails: shippingFor?.(price.final),
    };
  });
}

export function productJsonLdInput(
  product: Product,
  locale: ProductLocale,
  {
    categoryName,
    shippingFor,
  }: {
    categoryName?: string | null;
    /** `OfferShippingDetails` for one unit at this price (the store's own delivery prices). */
    shippingFor?: (price: number) => readonly object[];
  } = {},
): ProductJsonLdInput {
  const price = productOfferPrice(product);
  const variants = productJsonLdVariants(product, locale, shippingFor);
  return {
    ...(variants.length ? { variants } : {}),
    id: product.id,
    title: product.title,
    slug: product.slug,
    sku: product.sku,
    condition: product.condition,
    description: product.description ?? "",
    price,
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
    shippingDetails: shippingFor?.(price.final),
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
