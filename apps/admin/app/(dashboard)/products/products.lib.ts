import { formatCurrency } from "@workspace/lib";
import type { z } from "zod";

import type { productSchema } from "../_lib/validations/product-schema";
import type {
  InventorySummary,
  ParsedProductPrice,
  ProductDetailView,
  ProductInventoryRow,
  ProductRatingSummary,
  ProductRaw,
  ProductReviewRow,
  ProductTranslationRow,
  ProductVariantRow,
  ProductStatus,
  ReviewStatus,
  SalesSummary,
} from "./products.types";

type ProductFormData = z.infer<typeof productSchema>;

const DEFAULT_LOCALE = "en";
const LOW_STOCK_THRESHOLD = 10;

export function getEnTranslation(
  product: ProductRaw
): ProductTranslationRow | undefined {
  const translations = (
    product as ProductRaw & { productTranslations?: ProductTranslationRow[] }
  ).productTranslations;
  return translations?.find((t) => t.locale === DEFAULT_LOCALE);
}

export function parseProductPrice(price: unknown): ParsedProductPrice {
  const priceData = price as
    | {
        base?: number | string;
        list?: number | string;
        final?: number | string;
      }
    | number
    | null
    | undefined;

  if (typeof priceData === "number") {
    return { base: priceData, list: null, final: priceData };
  }

  if (!priceData || typeof priceData !== "object") {
    return { base: 0, list: null, final: 0 };
  }

  const base = priceData.base ? parseFloat(String(priceData.base)) : 0;
  const list = priceData.list ? parseFloat(String(priceData.list)) : null;
  const final = priceData.final
    ? parseFloat(String(priceData.final))
    : list ?? base;

  return { base, list, final };
}

export function parseProductImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.filter((img): img is string => typeof img === "string" && img.length > 0);
}

export function getStorefrontProductUrl(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const baseUrl =
    process.env.NEXT_PUBLIC_ECOMMERCE_URL ??
    process.env.NEXT_PUBLIC_ECOMMERCE_DOMAIN ??
    process.env.ECOMMERCE_URL ??
    process.env.ECOMMERCE_DOMAIN ??
    "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/products/${slug}`;
}

export function formatProductPrice(amount: number): string {
  return formatCurrency(amount, "EGP");
}

export function mapVariants(raw: ProductRaw): ProductVariantRow[] {
  const variants = raw.productVariants ?? [];

  return variants.map((variant) => ({
    id: String(variant.id),
    sku: (variant.sku as string | null) ?? null,
    title: (variant.title as string | null) ?? null,
    price: variant.price ? parseFloat(String(variant.price)) : 0,
    stock: variant.stock ? parseInt(String(variant.stock), 10) : 0,
    imageUrl: (variant.imageUrl as string | null) ?? null,
    option1: (variant.option1 as string | null) ?? null,
    option2: (variant.option2 as string | null) ?? null,
    option3: (variant.option3 as string | null) ?? null,
    position: variant.position ? parseInt(String(variant.position), 10) : 1,
  }));
}

export function mapReviews(raw: ProductRaw): ProductReviewRow[] {
  type RawReview = {
    id: string;
    userId: string;
    orderId: string | null;
    orderItemId: string | null;
    rating: number;
    title: string | null;
    comment: string | null;
    images: unknown;
    isVerifiedPurchase: boolean | null;
    isAnonymous: boolean | null;
    status: string | null;
    helpfulCount: number | null;
    unhelpfulCount: number | null;
    reportCount: number | null;
    createdAt: string | null;
    user?: {
      fullName?: string | null;
      email?: string | null;
    } | null;
  };

  const reviews = (raw.reviews ?? []) as RawReview[];

  return reviews.map((review) => {
    const images = Array.isArray(review.images)
      ? review.images.filter((img): img is string => typeof img === "string")
      : [];

    const status = (review.status ?? "pending") as ReviewStatus;

    return {
      id: review.id,
      userId: review.userId,
      userName: review.isAnonymous
        ? "Anonymous User"
        : review.user?.fullName ?? "Unknown User",
      userEmail: review.user?.email ?? "",
      orderId: review.orderId,
      orderItemId: review.orderItemId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images,
      isVerifiedPurchase: review.isVerifiedPurchase ?? false,
      isAnonymous: review.isAnonymous ?? false,
      status,
      helpfulCount: review.helpfulCount ?? 0,
      unhelpfulCount: review.unhelpfulCount ?? 0,
      reportCount: review.reportCount ?? 0,
      createdAt: review.createdAt ?? new Date().toISOString(),
    };
  });
}

export function computeProductRatingSummary(
  reviews: ProductReviewRow[],
  storedAverage: number | null | undefined,
  storedCount: number | null | undefined
): ProductRatingSummary {
  const approved = reviews.filter((review) => review.status === "approved");

  if (approved.length > 0) {
    const averageRating =
      approved.reduce((sum, review) => sum + review.rating, 0) / approved.length;

    return {
      averageRating,
      reviewCount: approved.length,
      totalReviewCount: reviews.length,
    };
  }

  if (reviews.length > 0) {
    return {
      averageRating: 0,
      reviewCount: 0,
      totalReviewCount: reviews.length,
    };
  }

  const reviewCount = storedCount ?? 0;
  const averageRating =
    reviewCount > 0 && storedAverage != null
      ? parseFloat(String(storedAverage))
      : 0;

  return {
    averageRating,
    reviewCount,
    totalReviewCount: reviewCount,
  };
}

export function computeInventorySummary(
  productQuantity: number,
  variants: ProductVariantRow[]
): InventorySummary {
  if (variants.length === 0) {
    const qty = productQuantity;
    return {
      totalVariants: 0,
      totalQuantity: qty,
      lowStock: qty > 0 && qty < LOW_STOCK_THRESHOLD ? 1 : 0,
      outOfStock: qty === 0 ? 1 : 0,
    };
  }

  const totalQuantity = variants.reduce((sum, variant) => sum + variant.stock, 0);
  const lowStock = variants.filter(
    (variant) => variant.stock > 0 && variant.stock < LOW_STOCK_THRESHOLD
  ).length;
  const outOfStock = variants.filter((variant) => variant.stock === 0).length;

  return {
    totalVariants: variants.length,
    totalQuantity,
    lowStock,
    outOfStock,
  };
}

export function buildInventoryRows(
  product: ProductRaw,
  variants: ProductVariantRow[]
): ProductInventoryRow[] {
  if (variants.length > 0) {
    return variants.map((variant) => {
      const stock = variant.stock;
      let status: ProductInventoryRow["status"] = "in_stock";
      if (stock === 0) status = "out_of_stock";
      else if (stock < LOW_STOCK_THRESHOLD) status = "low_stock";

      return {
        id: variant.id,
        sku: variant.sku ?? "—",
        variantName: variant.title ?? "Default variant",
        quantity: stock,
        status,
      };
    });
  }

  const quantity = product.quantity ? parseInt(String(product.quantity), 10) : 0;
  let status: ProductInventoryRow["status"] = "in_stock";
  if (quantity === 0) status = "out_of_stock";
  else if (quantity < LOW_STOCK_THRESHOLD) status = "low_stock";

  return [
    {
      id: product.id,
      sku: product.sku ?? "—",
      variantName: "Product-level stock",
      quantity,
      status,
    },
  ];
}

export function transformProductForDetail(
  product: ProductRaw,
  salesSummary: SalesSummary
): ProductDetailView {
  const enTranslation = getEnTranslation(product);
  const { base, list, final } = parseProductPrice(product.price);
  const bulletPoints = Array.isArray(enTranslation?.bulletPoints)
    ? (enTranslation.bulletPoints as string[])
    : [];
  const variants = mapVariants(product);
  const productQuantity = product.quantity
    ? parseInt(String(product.quantity), 10)
    : 0;
  const slug = enTranslation?.slug ?? null;

  const brand = product.brand
    ? {
        id: product.brand.id,
        name: product.brand.name || "Unknown",
        slug: product.brand.slug || "",
      }
    : null;

  const mainCategory = product.category
    ? {
        id: product.category.id,
        name: product.category.name || "Unknown",
        slug: product.category.slug || "",
      }
    : {
        id: "",
        name: "Uncategorized",
        slug: "",
      };

  const seller = product.seller
    ? {
        id: product.seller.id,
        businessName: product.seller.businessName ?? null,
        displayName: product.seller.displayName ?? null,
      }
    : null;

  const reviews = mapReviews(product);
  const ratingSummary = computeProductRatingSummary(
    reviews,
    product.averageRating,
    product.reviewCount
  );
  const inventorySummary = computeInventorySummary(productQuantity, variants);
  const inventoryRows = buildInventoryRows(product, variants);

  return {
    id: product.id,
    title: enTranslation?.title ?? "Untitled Product",
    slug,
    description: enTranslation?.description ?? null,
    bulletPoints,
    sku: product.sku ?? null,
    basePrice: base,
    listPrice: list,
    finalPrice: final,
    averageRating: ratingSummary.averageRating,
    reviewCount: ratingSummary.reviewCount,
    totalReviewCount: ratingSummary.totalReviewCount,
    brand,
    seller,
    mainCategory,
    status: product.status ?? "pending",
    isPlatformChoice: product.isPlatformChoice ?? false,
    isBestSeller: product.isMostSelling ?? false,
    isFeatured: product.isFeatured ?? false,
    isTrending: product.isTrending ?? false,
    isSeasonal: product.isSeasonal ?? false,
    freeDelivery: product.freeDelivery ?? false,
    metaTitle: enTranslation?.metaTitle ?? null,
    metaDescription: enTranslation?.metaDescription ?? null,
    images: parseProductImages(product.images),
    variants,
    reviews,
    inventoryRows,
    inventorySummary,
    salesSummary,
    createdAt: product.createdAt ?? new Date().toISOString(),
    updatedAt: product.updatedAt ?? new Date().toISOString(),
    storefrontUrl: getStorefrontProductUrl(slug),
  };
}

export function transformProductForForm(product: ProductRaw): Partial<ProductFormData> {
  const enTranslation = getEnTranslation(product);
  const { base, list, final } = parseProductPrice(product.price);
  const bulletPoints = Array.isArray(enTranslation?.bulletPoints)
    ? (enTranslation.bulletPoints as string[])
    : [];

  const dimensions = product.dimensions as ProductFormData["dimensions"] | null;

  const variants = (product.productVariants ?? []).map((variant) => ({
    id: variant.id,
    title: variant.title ?? "",
    sku: variant.sku ?? "",
    price: variant.price ? parseFloat(String(variant.price)) : 0,
    stock: variant.stock ?? 0,
    imageUrl: variant.imageUrl ?? undefined,
    option1: variant.option1 ?? undefined,
    option2: variant.option2 ?? undefined,
    option3: variant.option3 ?? undefined,
    barCode: variant.barCode ?? undefined,
    position: variant.position ?? 1,
  }));

  return {
    title: enTranslation?.title,
    slug: enTranslation?.slug ?? undefined,
    description: enTranslation?.description || undefined,
    bulletPoints: bulletPoints.length > 0 ? bulletPoints : [],
    brandId: product.brandId || "",
    categoryId: product.categoryId,
    sku: product.sku ?? undefined,
    basePrice: base,
    listPrice: list ?? undefined,
    finalPrice: final,
    quantity: product.quantity ? parseInt(String(product.quantity), 10) : 0,
    images: parseProductImages(product.images),
    status: product.status ?? "pending",
    isPlatformChoice: product.isPlatformChoice ?? false,
    isBestSeller: product.isMostSelling ?? false,
    isFeatured: product.isFeatured ?? false,
    isTrending: product.isTrending ?? false,
    isSeasonal: product.isSeasonal ?? false,
    freeDelivery: product.freeDelivery ?? false,
    condition: product.condition ?? "new",
    conditionDescription: product.conditionDescription ?? undefined,
    fulfillmentType: product.fulfillmentType ?? "seller_fulfilled",
    handlingTime: product.handlingTime
      ? parseInt(String(product.handlingTime), 10)
      : 1,
    maxOrderQuantity: product.maxOrderQuantity ?? undefined,
    taxClass:
      (product.taxClass as ProductFormData["taxClass"] | null) ?? "standard",
    dimensions: dimensions ?? undefined,
    variants: variants.length > 0 ? variants : undefined,
    metaTitle: enTranslation?.metaTitle ?? undefined,
    metaDescription: enTranslation?.metaDescription ?? undefined,
    locale: "en",
  };
}

export function canApproveProduct(status: ProductStatus): boolean {
  return status === "pending" || status === "rejected";
}

export function canRejectProduct(status: ProductStatus): boolean {
  return status === "pending";
}
