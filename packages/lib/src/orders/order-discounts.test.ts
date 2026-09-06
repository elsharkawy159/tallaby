import { describe, expect, it } from 'vitest'
import { FREE_DELIVERY_MIN_SUBTOTAL } from '../shipping/shipping-rates'
import { buildOrderDiscountLines } from './order-discounts'

describe('buildOrderDiscountLines', () => {
  it('returns empty lines when no discounts apply', () => {
    const result = buildOrderDiscountLines({
      merchandiseDiscount: 0,
      shippingDiscount: 0,
      thresholdShippingDiscount: 0,
      coupon: null,
    })
    expect(result.lines).toEqual([])
    expect(result.totalDiscount).toBe(0)
    expect(result.couponContribution).toBe(0)
  })

  it('records a percentage coupon line', () => {
    const result = buildOrderDiscountLines({
      merchandiseDiscount: 45,
      shippingDiscount: 0,
      thresholdShippingDiscount: 0,
      coupon: {
        id: 'c1',
        code: 'welcome10',
        discountType: 'percentage',
        discountValue: 10,
      },
    })
    expect(result.lines).toEqual([
      {
        type: 'coupon',
        label: 'WELCOME10 (10%)',
        amount: '45.00',
        code: 'WELCOME10',
        couponId: 'c1',
        couponDiscountType: 'percentage',
      },
    ])
    expect(result.totalDiscount).toBe(45)
    expect(result.couponContribution).toBe(45)
  })

  it('records threshold free shipping', () => {
    const result = buildOrderDiscountLines({
      merchandiseDiscount: 0,
      shippingDiscount: 65,
      thresholdShippingDiscount: 65,
      coupon: null,
    })
    expect(result.lines).toEqual([
      {
        type: 'threshold_free_shipping',
        label: `Free delivery (orders ≥ ${FREE_DELIVERY_MIN_SUBTOTAL} EGP)`,
        amount: '65.00',
      },
    ])
    expect(result.totalDiscount).toBe(65)
    expect(result.couponContribution).toBe(0)
  })

  it('stacks coupon merchandise and threshold free shipping', () => {
    const result = buildOrderDiscountLines({
      merchandiseDiscount: 20,
      shippingDiscount: 65,
      thresholdShippingDiscount: 65,
      coupon: {
        id: 'c2',
        code: 'SAVE20',
        discountType: 'fixed_amount',
        discountValue: 20,
      },
    })
    expect(result.lines).toHaveLength(2)
    expect(result.lines[0]?.type).toBe('coupon')
    expect(result.lines[1]?.type).toBe('threshold_free_shipping')
    expect(result.totalDiscount).toBe(85)
    expect(result.couponContribution).toBe(20)
  })

  it('attributes shipping waiver to free_shipping coupon over threshold', () => {
    const result = buildOrderDiscountLines({
      merchandiseDiscount: 0,
      shippingDiscount: 65,
      thresholdShippingDiscount: 65,
      coupon: {
        id: 'c3',
        code: 'FREESHIP',
        discountType: 'free_shipping',
        discountValue: 0,
      },
    })
    expect(result.lines).toEqual([
      {
        type: 'free_shipping_coupon',
        label: 'FREESHIP (free shipping)',
        amount: '65.00',
        code: 'FREESHIP',
        couponId: 'c3',
        couponDiscountType: 'free_shipping',
      },
    ])
    expect(result.couponContribution).toBe(65)
  })
})
