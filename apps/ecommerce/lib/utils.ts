import { ProductCardProps } from "@/components/product";
import { formatPrice } from "@workspace/lib";
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

export function resolvePrimaryImage(images?: ProductCardProps["images"]) {
  const fallbackImage = "/png product.png";

  if (!images || images.length === 0) return fallbackImage;
  const first = images[0] as any;
  const key = typeof first === "string" ? first : first?.url;
  if (!key || typeof key !== "string") return fallbackImage;
  return getPublicUrl(key, "products");
}

export function resolvePrice(product: ProductCardProps) {
  // new API shape: price as object
  if (product && typeof product.price === "object" && product.price !== null) {
    const p = product.price as NonNullable<ProductCardProps["price"]> & any;
    const value = p.final ?? p.base ?? p.list;
    if (typeof value === "number") return value;
  }
  // demo shape: price as number
  if (typeof product?.price === "number") return product.price as number;
  // legacy shape: base/sale
  if (typeof product?.sale_price === "number")
    return product.sale_price as number;
  if (typeof product?.base_price === "number")
    return product.base_price as number;
  return 0;
}
