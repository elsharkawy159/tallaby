import {
  FREE_DELIVERY_MIN_SUBTOTAL,
} from '../shipping/shipping-rates'
import { formatDecimal } from './place-order.lib'

import type {
  OrderCouponDiscountType,
  OrderDiscountLine,
} from '@workspace/db'

export type {
  OrderCouponDiscountType,
  OrderDiscountLine,
  OrderDiscountType,
} from '@workspace/db'

export interface BuildOrderDiscountCouponInput {
  id: string
  code: string
  name?: string | null
  discountType: OrderCouponDiscountType
  discountValue: string | number
}

export interface BuildOrderDiscountLinesInput {
  /** Merchandise coupon discount (percentage / fixed / buy_x_get_y). */
  merchandiseDiscount: number
  /** Final shipping waiver amount applied to the order. */
  shippingDiscount: number
  /**
   * Shipping discount from the cart subtotal threshold alone
   * (before free_shipping coupon max).
   */
  thresholdShippingDiscount: number
  coupon: BuildOrderDiscountCouponInput | null
}

export interface BuildOrderDiscountLinesResult {
  lines: OrderDiscountLine[]
  totalDiscount: number
  /** Amount attributed to the coupon for coupon_usage audit. */
  couponContribution: number
}

function formatCouponLabel (coupon: BuildOrderDiscountCouponInput): string {
  const code = coupon.code.trim().toUpperCase()
  const value = Number(coupon.discountValue)

  if (coupon.discountType === 'percentage') {
    return `${code} (${value}%)`
  }
  if (coupon.discountType === 'fixed_amount') {
    return `${code} (${formatDecimal(value)} EGP off)`
  }
  if (coupon.discountType === 'free_shipping') {
    return `${code} (free shipping)`
  }
  if (coupon.discountType === 'buy_x_get_y') {
    return coupon.name?.trim() ? `${code} (${coupon.name.trim()})` : code
  }
  return code
}

/**
 * Builds the persisted discounts jsonb array for an order.
 * Prefer free_shipping coupon attribution over threshold when both waive shipping.
 */
export function buildOrderDiscountLines (
  input: BuildOrderDiscountLinesInput,
): BuildOrderDiscountLinesResult {
  const lines: OrderDiscountLine[] = []
  const merchandiseDiscount = Math.max(0, input.merchandiseDiscount)
  const shippingDiscount = Math.max(0, input.shippingDiscount)
  const coupon = input.coupon

  if (merchandiseDiscount > 0 && coupon) {
    lines.push({
      type: 'coupon',
      label: formatCouponLabel(coupon),
      amount: formatDecimal(merchandiseDiscount),
      code: coupon.code.trim().toUpperCase(),
      couponId: coupon.id,
      couponDiscountType: coupon.discountType,
    })
  }

  if (shippingDiscount > 0) {
    const attributeToFreeShippingCoupon =
      coupon?.discountType === 'free_shipping'

    if (attributeToFreeShippingCoupon && coupon) {
      lines.push({
        type: 'free_shipping_coupon',
        label: formatCouponLabel(coupon),
        amount: formatDecimal(shippingDiscount),
        code: coupon.code.trim().toUpperCase(),
        couponId: coupon.id,
        couponDiscountType: 'free_shipping',
      })
    } else {
      lines.push({
        type: 'threshold_free_shipping',
        label: `Free delivery (orders ≥ ${FREE_DELIVERY_MIN_SUBTOTAL} EGP)`,
        amount: formatDecimal(shippingDiscount),
      })
    }
  }

  const totalDiscount = lines.reduce(
    (sum, line) => sum + Number(line.amount),
    0,
  )

  let couponContribution = 0
  if (coupon) {
    if (merchandiseDiscount > 0) {
      couponContribution = merchandiseDiscount
    } else if (coupon.discountType === 'free_shipping' && shippingDiscount > 0) {
      couponContribution = shippingDiscount
    }
  }

  return {
    lines,
    totalDiscount,
    couponContribution,
  }
}

/** Safely parse orders.discounts jsonb from the DB. */
export function parseOrderDiscountLines (value: unknown): OrderDiscountLine[] {
  if (!Array.isArray(value)) return []

  const lines: OrderDiscountLine[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    if (
      typeof row.type !== 'string' ||
      typeof row.label !== 'string' ||
      typeof row.amount !== 'string'
    ) {
      continue
    }

    const line: OrderDiscountLine = {
      type: row.type as OrderDiscountLine['type'],
      label: row.label,
      amount: row.amount,
    }
    if (typeof row.code === 'string' && row.code.length > 0) {
      line.code = row.code
    }
    if (typeof row.couponId === 'string') {
      line.couponId = row.couponId
    }
    if (typeof row.couponDiscountType === 'string') {
      line.couponDiscountType =
        row.couponDiscountType as OrderDiscountLine['couponDiscountType']
    }
    lines.push(line)
  }
  return lines
}
