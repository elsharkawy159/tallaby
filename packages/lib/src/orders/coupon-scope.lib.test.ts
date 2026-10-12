import { describe, expect, it } from 'vitest'
import {
  allocateDiscountAcrossLines,
  getCouponChannels,
  isCouponAllowedOnChannel,
  isLineEligibleForCoupon,
} from './coupon-scope.lib'

describe('isLineEligibleForCoupon', () => {
  it('accepts every line for a platform coupon', () => {
    const coupon = { sellerId: null, applicableTo: null }
    expect(isLineEligibleForCoupon(coupon, { productId: 'p1', sellerId: 's1' })).toBe(true)
  })

  it("limits a seller coupon to that seller's lines", () => {
    const coupon = { sellerId: 's1', applicableTo: null }
    expect(isLineEligibleForCoupon(coupon, { productId: 'p1', sellerId: 's1' })).toBe(true)
    expect(isLineEligibleForCoupon(coupon, { productId: 'p2', sellerId: 's2' })).toBe(false)
  })

  it('narrows to the listed products', () => {
    const coupon = { sellerId: 's1', applicableTo: { productIds: ['p1'] } }
    expect(isLineEligibleForCoupon(coupon, { productId: 'p1', sellerId: 's1' })).toBe(true)
    expect(isLineEligibleForCoupon(coupon, { productId: 'p3', sellerId: 's1' })).toBe(false)
  })

  it('treats an empty product list as all products', () => {
    const coupon = { sellerId: 's1', applicableTo: { productIds: [] } }
    expect(isLineEligibleForCoupon(coupon, { productId: 'p9', sellerId: 's1' })).toBe(true)
  })
})

describe('coupon channels', () => {
  it('defaults to both channels', () => {
    expect(getCouponChannels(null)).toEqual(['marketplace', 'storefront'])
    expect(getCouponChannels({ channels: ['bogus'] })).toEqual(['marketplace', 'storefront'])
  })

  it('honours a single channel', () => {
    const coupon = { sellerId: 's1', applicableTo: { channels: ['storefront'] } }
    expect(isCouponAllowedOnChannel(coupon, 'storefront')).toBe(true)
    expect(isCouponAllowedOnChannel(coupon, 'marketplace')).toBe(false)
  })
})

describe('allocateDiscountAcrossLines', () => {
  it('splits proportionally and sums exactly', () => {
    const parts = allocateDiscountAcrossLines(10, [100, 200, 33.33])
    expect(parts.reduce((a, b) => a + b, 0)).toBeCloseTo(10, 2)
    expect(parts[1]).toBeGreaterThan(parts[0]!)
  })

  it('caps at the lines total', () => {
    expect(allocateDiscountAcrossLines(500, [100, 50])).toEqual([100, 50])
  })

  it('returns zeros when nothing to discount', () => {
    expect(allocateDiscountAcrossLines(0, [10, 20])).toEqual([0, 0])
  })
})
