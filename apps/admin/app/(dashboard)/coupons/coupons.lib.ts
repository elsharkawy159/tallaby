import { formatCurrency } from "@workspace/lib";
import type { CouponDiscountType } from "../_lib/validations/coupon-schema";
import type { AdminCoupon, CouponState } from "./coupons.types";

export const DISCOUNT_TYPE_LABELS: Record<CouponDiscountType, string> = {
  percentage: "Percentage",
  fixed_amount: "Fixed amount",
  free_shipping: "Free shipping",
};

export const COUPON_STATE_LABELS: Record<CouponState, string> = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  inactive: "Inactive",
};

/** Mirrors the SQL state filters in actions/coupons.ts. */
export function getCouponState(
  coupon: Pick<AdminCoupon, "isActive" | "startsAt" | "expiresAt">,
  now: Date = new Date()
): CouponState {
  if (!coupon.isActive) return "inactive";
  if (new Date(coupon.expiresAt) < now) return "expired";
  if (new Date(coupon.startsAt) > now) return "scheduled";
  return "active";
}

export function formatEgp(amount: string | number | null): string | null {
  if (amount === null || amount === "") return null;
  return formatCurrency(Number(amount));
}

export function formatCouponDiscount(
  coupon: Pick<AdminCoupon, "discountType" | "discountValue" | "maximumDiscount">
): string {
  switch (coupon.discountType) {
    case "percentage": {
      const cap = formatEgp(coupon.maximumDiscount);
      return `${Number(coupon.discountValue)}% off${cap ? ` (max ${cap})` : ""}`;
    }
    case "fixed_amount":
      return `${formatEgp(coupon.discountValue)} off`;
    case "free_shipping":
      return "Free shipping";
    default:
      return "Buy X get Y";
  }
}

export function formatCouponDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** ISO timestamp -> `datetime-local` input value in the browser's time zone. */
export function toDateTimeLocal(value: string | Date): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function generateCouponCode(length = 8): string {
  // No 0/O/1/I so codes are easy to read out loud.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}
