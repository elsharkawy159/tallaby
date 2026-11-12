import { describe, expect, it } from 'vitest'
import {
  allocateDiscountAcrossLines,
  getCouponChannels,
  isCouponAllowedOnChannel,
  isCouponInStore,
  isLineEligibleForCoupon,
  sellerCouponTargetError,
} from './coupon-scope.lib'

describe('isCouponInStore (F-87k: coupons per store)', () => {
  it('lets an all-stores coupon (store_id null) work in every store and on the marketplace', () => {
    expect(isCouponInStore({ storeId: null }, 'store-a')).toBe(true)
    expect(isCouponInStore({ storeId: null }, 'store-b')).toBe(true)
    expect(isCouponInStore({ storeId: null }, null)).toBe(true)
  })

  it('keeps a store coupon to its own store', () => {
    expect(isCouponInStore({ storeId: 'store-a' }, 'store-a')).toBe(true)
    expect(isCouponInStore({ storeId: 'store-a' }, 'store-b')).toBe(false)
  })

  it('refuses a store coupon where there is no store (marketplace)', () => {
    expect(isCouponInStore({ storeId: 'store-a' }, null)).toBe(false)
    expect(isCouponInStore({ storeId: 'store-a' }, undefined)).toBe(false)
  })
})

describe('sellerCouponTargetError', () => {
  it('accepts a whole-order coupon for all stores or one store', () => {
    expect(sellerCouponTargetError({ storeId: null, productIds: null })).toBeNull()
    expect(sellerCouponTargetError({ storeId: 'store-a', productIds: null })).toBeNull()
    expect(sellerCouponTargetError({ storeId: null, productIds: [] })).toBeNull()
  })

  it('needs one store for a product list (products belong to one store)', () => {
    expect(sellerCouponTargetError({ storeId: null, productIds: ['p1'] })).toBe('invalid_products')
    expect(sellerCouponTargetError({ storeId: 'store-a', productIds: ['p1'] })).toBeNull()
  })
})

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
