import { describe, expect, it } from 'vitest'
import { calculateSellerEarning } from './product-pricing.lib'

const base = { commissionRate: 5, isCommissionExempt: false }

describe('calculateSellerEarning (platform fee, PLAN.md §13)', () => {
  it('takes max(EGP 5, 2%) from a one-unit order', () => {
    expect(calculateSellerEarning(100, base)).toBe(95)
    expect(calculateSellerEarning(1000, base)).toBe(995)
    expect(calculateSellerEarning('251', base)).toBe(246)
  })

  it('after the USD switch: the EGP equivalent of 3 cents on Free, nothing on Pro', () => {
    const live = { ...base, feeBilling: { usdLive: true, marketRate: 50 } }
    expect(calculateSellerEarning(100, live)).toBe(98.5)
    const until = new Date(Date.now() + 86_400_000).toISOString()
    expect(calculateSellerEarning(100, { ...live, plan: 'pro', planExpiresAt: until })).toBe(100)
    // A lapsed Pro seller pays like Free.
    const past = new Date(Date.now() - 86_400_000).toISOString()
    expect(calculateSellerEarning(100, { ...live, plan: 'pro', planExpiresAt: past })).toBe(98.5)
  })

  it('stays EGP 5 while the switch is off', () => {
    expect(calculateSellerEarning(100, { ...base, feeBilling: { usdLive: false, marketRate: 50 } })).toBe(95)
  })

  it('never goes below zero for prices under EGP 5', () => {
    expect(calculateSellerEarning(3, base)).toBe(0)
  })

  it('charges nothing when exempt or during the trial', () => {
    expect(calculateSellerEarning(1000, { ...base, isCommissionExempt: true })).toBe(1000)
    const day = 86_400_000
    expect(
      calculateSellerEarning(1000, {
        ...base,
        feeTrialStartedAt: new Date(Date.now() - day).toISOString(),
        feeTrialEndsAt: new Date(Date.now() + day).toISOString(),
      }),
    ).toBe(1000)
  })

  it('returns 0 without a price', () => {
    expect(calculateSellerEarning(undefined, base)).toBe(0)
    expect(calculateSellerEarning(0, base)).toBe(0)
  })
})
