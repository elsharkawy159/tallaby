import { describe, expect, it } from 'vitest'
import {
  countdownParts,
  isCouponPopupTrigger,
  offerCoversProduct,
  offerDeadline,
  pickStoreCouponOffer,
  readShownAt,
} from './coupon-popup.lib'

describe('pickStoreCouponOffer', () => {
  const now = Date.parse('2026-10-28T10:00:00Z')
  const base = {
    couponId: 'c1',
    code: 'SAVE10',
    discountType: 'percentage' as const,
    discountValue: 10,
    trigger: 'enter' as const,
    durationMinutes: 60,
    endsAt: '2026-11-30T00:00:00Z',
    productIds: null,
    startsAt: '2026-10-01T00:00:00Z',
    usageLimit: null,
    usageCount: 0,
  }

  it('returns the first live candidate without its limits', () => {
    const offer = pickStoreCouponOffer(
      [{ ...base, couponId: 'later', startsAt: '2026-11-01T00:00:00Z' }, base],
      now,
    )
    expect(offer).toEqual({
      couponId: 'c1',
      code: 'SAVE10',
      discountType: 'percentage',
      discountValue: 10,
      trigger: 'enter',
      durationMinutes: 60,
      endsAt: '2026-11-30T00:00:00Z',
      productIds: null,
    })
  })

  it('skips ended and used-up coupons', () => {
    expect(pickStoreCouponOffer([{ ...base, endsAt: '2026-10-28T09:00:00Z' }], now)).toBeNull()
    expect(pickStoreCouponOffer([{ ...base, usageLimit: 3, usageCount: 3 }], now)).toBeNull()
    expect(pickStoreCouponOffer([], now)).toBeNull()
  })
})

describe('offerDeadline', () => {
  const shownAt = Date.parse('2026-10-28T10:00:00Z')

  it('adds the duration to the pop-up time', () => {
    const offer = { durationMinutes: 60, endsAt: '2026-11-30T00:00:00Z' }
    expect(offerDeadline(offer, shownAt)).toBe(Date.parse('2026-10-28T11:00:00Z'))
  })

  it("never runs past the coupon's own end", () => {
    const offer = { durationMinutes: 600, endsAt: '2026-10-28T12:00:00Z' }
    expect(offerDeadline(offer, shownAt)).toBe(Date.parse('2026-10-28T12:00:00Z'))
  })
})

describe('countdownParts', () => {
  it('splits the time left into days, hours, minutes and seconds', () => {
    const ms = ((1 * 24 + 2) * 3600 + 3 * 60 + 4) * 1000 + 999
    expect(countdownParts(ms)).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4 })
  })

  it('stops at zero', () => {
    expect(countdownParts(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('offerCoversProduct', () => {
  it('covers every product when the coupon has no product list', () => {
    expect(offerCoversProduct({ productIds: null }, 'p1')).toBe(true)
    expect(offerCoversProduct({ productIds: ['p2'] }, 'p1')).toBe(false)
    expect(offerCoversProduct({ productIds: ['p1'] }, 'p1')).toBe(true)
  })
})

describe('readShownAt', () => {
  const now = Date.parse('2026-10-28T10:00:00Z')

  it('reads a stored timestamp', () => {
    expect(readShownAt(String(now - 1000), now)).toBe(now - 1000)
  })

  it('ignores missing, malformed and future values', () => {
    expect(readShownAt(null, now)).toBeNull()
    expect(readShownAt('soon', now)).toBeNull()
    expect(readShownAt(String(now + 3_600_000), now)).toBeNull()
  })
})

describe('isCouponPopupTrigger', () => {
  it('accepts the three triggers only', () => {
    expect(isCouponPopupTrigger('exit')).toBe(true)
    expect(isCouponPopupTrigger('later')).toBe(false)
    expect(isCouponPopupTrigger(null)).toBe(false)
  })
})
