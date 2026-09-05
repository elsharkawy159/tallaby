import { FREE_DELIVERY_MIN_SUBTOTAL } from "@workspace/lib/shipping";

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
export const SHIPPING_COST = process.env.NEXT_PUBLIC_SHIPPING_COST || 50;
export const FREE_SHIPPING_THRESHOLD = FREE_DELIVERY_MIN_SUBTOTAL;
export const DEFAULT_CURRENCY = "EGP";

/** Days from delivery within which a return can be requested. */
export const RETURN_WINDOW_DAYS = 7;
/** Typical delivery estimates in business days. Ranges, never guarantees. */
export const DELIVERY_ESTIMATE_METRO = "1-3"; // Cairo & Giza
export const DELIVERY_ESTIMATE_OTHER = "2-5"; // other governorates
