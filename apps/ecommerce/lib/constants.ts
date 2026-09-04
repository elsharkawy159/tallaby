import { FREE_DELIVERY_MIN_SUBTOTAL } from "@workspace/lib/shipping";

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
export const SHIPPING_COST = process.env.NEXT_PUBLIC_SHIPPING_COST || 50;
export const FREE_SHIPPING_THRESHOLD = FREE_DELIVERY_MIN_SUBTOTAL;
export const DEFAULT_CURRENCY = "EGP";
