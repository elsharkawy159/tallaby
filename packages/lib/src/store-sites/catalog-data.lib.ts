/**
 * Pure rules for the store data builder sections show (P4B-05): who a review
 * is credited to, rating aggregates, and which orders count as sales. Shared
 * by the editor loader and the storefront resolver, so both agree.
 */

/** Orders that count as sold units for best sellers and trending (never cancelled, refunded or returned). */
export const SOLD_ORDER_STATUSES = ["confirmed", "shipping_soon", "shipped", "out_for_delivery", "delivered"] as const;
/** Line items that no longer count, even inside a sold order. */
export const UNSOLD_ITEM_STATUSES = ["cancelled", "refund_requested", "refunded", "returned"] as const;

export const BEST_SELLER_DAYS = 90;
export const TRENDING_DAYS = 14;

/**
 * A reviewer's public name: the first name only, never the full name or
 * contact details; null for anonymous reviews or when no name is known.
 */
export function reviewAuthorName(fullName: string | null | undefined, anonymous: boolean | null | undefined): string | null {
  if (anonymous) return null;
  const first = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  return first ? first.slice(0, 40) : null;
}

export type RatingStats = { average: number; count: number; distribution: Record<"1" | "2" | "3" | "4" | "5", number> };

/** Average (one decimal), count and per-star counts of integer ratings 1–5; others are ignored. */
export function ratingStats(ratings: readonly number[]): RatingStats {
  const distribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  let sum = 0;
  let count = 0;
  for (const rating of ratings) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) continue;
    distribution[String(rating) as keyof typeof distribution] += 1;
    sum += rating;
    count += 1;
  }
  return { average: count ? Math.round((sum / count) * 10) / 10 : 0, count, distribution };
}

/** Product ids by units sold, most first; ties keep the newer-first input order. Products without sales are left out. */
export function rankBySales(productIds: readonly string[], units: ReadonlyMap<string, number>): string[] {
  return productIds
    .map((id, index) => ({ id, index, sold: units.get(id) ?? 0 }))
    .filter((p) => p.sold > 0)
    .sort((a, b) => b.sold - a.sold || a.index - b.index)
    .map((p) => p.id);
}

/** Whether a coupon can be shown now: active, started, not expired, uses left. */
export function isCouponLive(
  coupon: { isActive: boolean | null; startsAt: string; expiresAt: string; usageLimit: number | null; usageCount: number | null },
  now = Date.now(),
): boolean {
  if (coupon.isActive === false) return false;
  const starts = Date.parse(coupon.startsAt);
  const ends = Date.parse(coupon.expiresAt);
  if (Number.isFinite(starts) && starts > now) return false;
  if (Number.isFinite(ends) && ends <= now) return false;
  if (coupon.usageLimit != null && (coupon.usageCount ?? 0) >= coupon.usageLimit) return false;
  return true;
}

export type CouponDiscountType = "percentage" | "fixed" | "free-shipping" | "other";

/** The coupon kinds a section can describe; "buy x get y" and anything new are shown by the coupon name. */
export function couponDiscountType(value: string | null | undefined): CouponDiscountType {
  return value === "percentage" ? "percentage" : value === "fixed_amount" ? "fixed" : value === "free_shipping" ? "free-shipping" : "other";
}
