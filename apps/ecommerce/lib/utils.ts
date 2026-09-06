import { ProductCardProps } from "@/components/product";
import { getPriceFinal, getPriceList, parsePriceJson } from "@workspace/lib";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getShareUrl(url?: string) {
  // Return an empty string during server-side rendering
  if (typeof window === "undefined") return "";

  try {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return `${baseUrl}${url ? `/${url}` : "/"}`;
  } catch (error) {
    // Fallback for any window access issues
    return "";
  }
}

export const PRODUCT_IMAGE_FALLBACK = "/png product.png";

export function resolvePrimaryImage(images?: ProductCardProps["images"]) {
  if (!images || images.length === 0) return PRODUCT_IMAGE_FALLBACK;
  const first = images[0] as any;
  const key = typeof first === "string" ? first : first?.url;
  if (!key || typeof key !== "string") return PRODUCT_IMAGE_FALLBACK;
  return getPublicUrl(key, "products");
}

export function resolvePrice(product: ProductCardProps) {
  if (product && product.price != null) {
    const fromJson = getPriceFinal(product.price);
    if (fromJson > 0 || typeof product.price === "object") return fromJson;
  }
  // legacy shape: base/sale
  if (typeof product?.sale_price === "number")
    return product.sale_price as number;
  if (typeof product?.base_price === "number")
    return product.base_price as number;
  return 0;
}

/** List / compare-at price when it is higher than the selling price. */
export function resolveListPrice(product: ProductCardProps): number | null {
  if (product?.price != null) {
    const list = getPriceList(product.price);
    const final = getPriceFinal(product.price);
    if (list != null && list > final) return list;
  }

  if (
    typeof product?.base_price === "number" &&
    typeof product?.sale_price === "number" &&
    product.base_price > product.sale_price
  ) {
    return product.base_price;
  }

  return null;
}

/** Whole-number discount percent for badges, or null when not on sale. */
export function resolveDiscountPercent(
  product: ProductCardProps
): number | null {
  const final = resolvePrice(product);
  const list = resolveListPrice(product);
  if (list == null || list <= 0 || final >= list) return null;

  if (product.price != null && typeof product.price === "object") {
    const parsed = parsePriceJson(product.price);
    if (
      parsed.discountType === "percent" &&
      parsed.discountValue != null &&
      parsed.discountValue > 0
    ) {
      return Math.min(99, Math.round(parsed.discountValue));
    }
  }

  const percent = Math.round(((list - final) / list) * 100);
  return percent > 0 ? Math.min(99, percent) : null;
}

type ProductCardSource = Record<string, unknown> & {
  id?: string;
  title?: string;
  slug?: string;
  images?: ProductCardProps["images"];
  price?: ProductCardProps["price"];
  quantity?: number | string;
  maxOrderQuantity?: number | string;
  averageRating?: number | null;
  reviewCount?: number;
  productVariants?: ProductCardProps["productVariants"];
};

/** Maps a merged product row to the flat shape expected by ProductCard. */
export function toProductCardProps(product: ProductCardSource): ProductCardProps {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    images: product.images,
    price: product.price,
    quantity: product.quantity,
    maxOrderQuantity: product.maxOrderQuantity,
    averageRating: product.averageRating ?? null,
    reviewCount: product.reviewCount ?? 0,
    productVariants: product.productVariants,
  };
}
