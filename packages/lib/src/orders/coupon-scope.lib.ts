/**
 * Which cart lines a coupon may discount, and where it may be redeemed.
 *
 * A coupon with `seller_id` is funded by that seller: it only ever discounts
 * the seller's own products, whether the cart is on tallaby.com or on the
 * seller's storefront. `applicable_to` can narrow it further to specific
 * products and to one sales channel.
 */

/** tallaby.com marketplace vs a seller's {subdomain}.tallaby.com storefront. */
export type CouponChannel = 'marketplace' | 'storefront'

export const COUPON_CHANNELS: readonly CouponChannel[] = [
  'marketplace',
  'storefront',
]

/** Discount types a seller can issue from the dashboard. */
export const SELLER_COUPON_DISCOUNT_TYPES = [
  'percentage',
  'fixed_amount',
] as const

export type SellerCouponDiscountType =
  (typeof SELLER_COUPON_DISCOUNT_TYPES)[number]

export interface CouponScopeInput {
  sellerId: string | null
  applicableTo: unknown
}

export interface CouponScopeLine {
  productId: string
  sellerId: string
}

function readApplicableTo(applicableTo: unknown): {
  productIds?: unknown
  channels?: unknown
} {
  return applicableTo && typeof applicableTo === 'object'
    ? (applicableTo as { productIds?: unknown; channels?: unknown })
    : {}
}

/** Product ids the coupon is limited to, or null when it covers every product. */
export function getCouponProductIds(applicableTo: unknown): string[] | null {
  const { productIds } = readApplicableTo(applicableTo)
  if (!Array.isArray(productIds)) return null
  const ids = productIds.filter((id): id is string => typeof id === 'string')
  return ids.length > 0 ? ids : null
}

/** Channels the coupon works on; both when unset. */
export function getCouponChannels(applicableTo: unknown): CouponChannel[] {
  const { channels } = readApplicableTo(applicableTo)
  if (!Array.isArray(channels)) return [...COUPON_CHANNELS]
  const valid = channels.filter((c): c is CouponChannel =>
    COUPON_CHANNELS.includes(c as CouponChannel),
  )
  return valid.length > 0 ? valid : [...COUPON_CHANNELS]
}

export function isCouponAllowedOnChannel(
  coupon: CouponScopeInput,
  channel: CouponChannel,
): boolean {
  return getCouponChannels(coupon.applicableTo).includes(channel)
}

export function isLineEligibleForCoupon(
  coupon: CouponScopeInput,
  line: CouponScopeLine,
): boolean {
  if (coupon.sellerId && line.sellerId !== coupon.sellerId) return false
  const productIds = getCouponProductIds(coupon.applicableTo)
  if (productIds && !productIds.includes(line.productId)) return false
  return true
}

/**
 * Splits `discount` across lines in proportion to each line's subtotal, so
 * the parts add up to the discount exactly (the last line absorbs rounding).
 */
export function allocateDiscountAcrossLines(
  discount: number,
  lineSubtotals: number[],
): number[] {
  const total = lineSubtotals.reduce((sum, value) => sum + value, 0)
  if (discount <= 0 || total <= 0) return lineSubtotals.map(() => 0)

  const capped = Math.min(discount, total)
  let remaining = Math.round(capped * 100)
  return lineSubtotals.map((value, index) => {
    if (index === lineSubtotals.length - 1) return remaining / 100
    const cents = Math.min(
      remaining,
      Math.round((capped * value * 100) / total),
    )
    remaining -= cents
    return cents / 100
  })
}
