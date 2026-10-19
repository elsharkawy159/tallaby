import { describe, expect, it } from 'vitest'
import {
  FEE_PLANS,
  STANDARD_FEE_PLAN,
  allocateFeeAcrossLines,
  computePlatformFeePiastres,
  computeOrderLineFees,
  computeSellerPlatformFee,
  eligibleSubtotalForSeller,
  isTrialActive,
  resolveFeePlan,
  toPiastres,
} from './platform-fee.lib'

describe('computePlatformFeePiastres (PLAN.md §13.1)', () => {
  it.each([
    [100, 500],
    [250, 500],
    [251, 500],
    [500, 500],
    [1000, 500],
    [100_000, 500],
  ])('EGP %d → %d piastres (flat EGP 5)', (egp, fee) => {
    expect(computePlatformFeePiastres(egp * 100)).toBe(fee)
  })

  it('charges nothing without a positive subtotal', () => {
    expect(computePlatformFeePiastres(0)).toBe(0)
    expect(computePlatformFeePiastres(-100)).toBe(0)
    expect(computePlatformFeePiastres(Number.NaN)).toBe(0)
  })

  it('caps the fee at the subtotal for orders under EGP 5', () => {
    expect(computePlatformFeePiastres(300)).toBe(300)
    expect(computePlatformFeePiastres(1)).toBe(1)
    expect(computePlatformFeePiastres(500)).toBe(500)
  })
})

describe('resolveFeePlan', () => {
  it('falls back to the standard plan', () => {
    expect(resolveFeePlan(null)).toBe(STANDARD_FEE_PLAN)
    expect(resolveFeePlan('')).toBe(STANDARD_FEE_PLAN)
    expect(resolveFeePlan('legacy_5pct')).toBe(STANDARD_FEE_PLAN)
    expect(resolveFeePlan('standard_2pct_min5')).toBe(STANDARD_FEE_PLAN)
    expect(resolveFeePlan(' Flat_5 ')).toBe('flat_5')
    expect(FEE_PLANS[STANDARD_FEE_PLAN]).toEqual({ rateBps: 0, minPiastres: 500 })
  })
})

describe('toPiastres', () => {
  it('converts decimals and strings', () => {
    expect(toPiastres('199.99')).toBe(19_999)
    expect(toPiastres(0.1 + 0.2)).toBe(30)
    expect(toPiastres(null)).toBe(0)
    expect(toPiastres(undefined)).toBe(0)
    expect(toPiastres('abc')).toBe(0)
  })
})

describe('eligibleSubtotalForSeller (D2)', () => {
  it('sums the line totals after the seller coupon and ignores negatives', () => {
    expect(eligibleSubtotalForSeller([{ total: '80.00' }, { total: 20.5 }, { total: '-3' }])).toBe(10_050)
    expect(eligibleSubtotalForSeller([])).toBe(0)
  })
})

describe('allocateFeeAcrossLines', () => {
  it('adds up to the fee exactly', () => {
    const lines = [3_333, 3_333, 3_334]
    const parts = allocateFeeAcrossLines(500, lines)
    expect(parts.reduce((a, b) => a + b, 0)).toBe(500)
    expect(parts.every(Number.isInteger)).toBe(true)
  })

  it('splits in proportion to the lines', () => {
    expect(allocateFeeAcrossLines(1_000, [25_000, 25_000])).toEqual([500, 500])
    expect(allocateFeeAcrossLines(600, [10_000, 20_000])).toEqual([200, 400])
  })

  it('returns zeros when there is no fee or no lines total', () => {
    expect(allocateFeeAcrossLines(0, [100, 200])).toEqual([0, 0])
    expect(allocateFeeAcrossLines(500, [0, 0])).toEqual([0, 0])
  })

  it.each([
    [[1, 1, 1], 3],
    [[7, 13, 9_999], 500],
    [[12_345, 1, 99], 500],
  ])('never loses a piastre for %j', (lines, fee) => {
    expect(allocateFeeAcrossLines(fee, lines).reduce((a, b) => a + b, 0)).toBe(fee)
  })
})

describe('isTrialActive (D4)', () => {
  const seller = {
    feeTrialStartedAt: '2026-10-01T00:00:00.000Z',
    feeTrialEndsAt: new Date('2026-10-31T00:00:00.000Z'),
  }

  it('covers [start, end)', () => {
    expect(isTrialActive(seller, new Date('2026-10-01T00:00:00.000Z'))).toBe(true)
    expect(isTrialActive(seller, new Date('2026-10-30T23:59:59.999Z'))).toBe(true)
    expect(isTrialActive(seller, new Date('2026-10-31T00:00:00.000Z'))).toBe(false)
    expect(isTrialActive(seller, new Date('2026-09-30T23:59:59.999Z'))).toBe(false)
  })

  it('is off without both dates or with invalid dates', () => {
    expect(isTrialActive({}, new Date())).toBe(false)
    expect(isTrialActive({ feeTrialStartedAt: seller.feeTrialStartedAt }, new Date('2026-10-02'))).toBe(false)
    expect(isTrialActive({ feeTrialStartedAt: 'nope', feeTrialEndsAt: 'nope' })).toBe(false)
  })

  it('defaults to now', () => {
    const start = new Date(Date.now() - 1_000)
    const end = new Date(Date.now() + 60_000)
    expect(isTrialActive({ feeTrialStartedAt: start, feeTrialEndsAt: end })).toBe(true)
  })
})

describe('computeSellerPlatformFee', () => {
  const at = new Date('2026-11-15T12:00:00.000Z')

  it('charges a regular seller and splits the fee', () => {
    const result = computeSellerPlatformFee({ feePlan: STANDARD_FEE_PLAN }, [{ total: '300.00' }, { total: '200.00' }], at)
    expect(result.feePiastres).toBe(500)
    expect(result.lineFeesPiastres).toEqual([300, 200])
    expect(result.effectiveRate).toBe(0.01)
    expect(result.snapshot).toEqual({
      plan: 'flat_5',
      rateBps: 0,
      minPiastres: 500,
      eligiblePiastres: 50_000,
      feePiastres: 500,
      trial: false,
      exempt: false,
      computedAt: '2026-11-15T12:00:00.000Z',
    })
  })

  it('charges the flat fee on small orders', () => {
    const result = computeSellerPlatformFee({}, [{ total: 100 }], at)
    expect(result.feePiastres).toBe(500)
    expect(result.effectiveRate).toBe(0.05)
  })

  it('charges nothing during the 7-day trial', () => {
    const result = computeSellerPlatformFee(
      { feeTrialStartedAt: '2026-11-09T00:00:00Z', feeTrialEndsAt: '2026-11-16T00:00:00Z' },
      [{ total: 1_000 }],
      at,
    )
    expect(result.feePiastres).toBe(0)
    expect(result.lineFeesPiastres).toEqual([0])
    expect(result.snapshot).toMatchObject({ trial: true, exempt: false, eligiblePiastres: 100_000 })
  })

  it('charges from day 8', () => {
    const result = computeSellerPlatformFee(
      { feeTrialStartedAt: '2026-11-08T12:00:00Z', feeTrialEndsAt: '2026-11-15T12:00:00Z' },
      [{ total: 1_000 }],
      at,
    )
    expect(result.feePiastres).toBe(500)
    expect(result.snapshot.trial).toBe(false)
  })

  it('charges nothing for exempt sellers', () => {
    const result = computeSellerPlatformFee({ isCommissionExempt: true }, [{ total: 1_000 }], at)
    expect(result.feePiastres).toBe(0)
    expect(result.snapshot).toMatchObject({ exempt: true, trial: false })
  })

  it('handles a seller with no positive lines', () => {
    const result = computeSellerPlatformFee({}, [{ total: 0 }], at)
    expect(result.feePiastres).toBe(0)
    expect(result.effectiveRate).toBe(0)
  })

  it('uses the current time by default', () => {
    expect(computeSellerPlatformFee({}, [{ total: 500 }]).feePiastres).toBe(500)
  })
})

describe('computeOrderLineFees (D22)', () => {
  const at = new Date('2026-11-15T12:00:00.000Z')

  it('charges each seller on its own lines and keeps the line order', () => {
    const fees = computeOrderLineFees(
      [
        { sellerId: 'a', total: '300.00' },
        { sellerId: 'b', total: '100.00' },
        { sellerId: 'a', total: '50.00' },
      ],
      new Map([['b', { isCommissionExempt: true }]]),
      at,
    )
    expect(fees.map((fee) => fee.commissionAmount)).toEqual(['4.29', '0.00', '0.71'])
    expect(fees.map((fee) => fee.sellerEarning)).toEqual(['295.71', '100.00', '49.29'])
    expect(fees[0]!.platformFee).toBe(fees[2]!.platformFee)
    expect(fees[0]!.platformFee.feePiastres).toBe(500)
    expect(fees[1]!.platformFee.exempt).toBe(true)
    expect(fees[0]!.commissionRate).toBe(0.0143)
  })

  it('charges the flat fee to each seller separately', () => {
    const fees = computeOrderLineFees(
      [
        { sellerId: 'a', total: 100 },
        { sellerId: 'b', total: 100 },
      ],
      new Map(),
      at,
    )
    expect(fees.map((fee) => fee.commissionAmount)).toEqual(['5.00', '5.00'])
  })

  it('returns nothing for no lines', () => {
    expect(computeOrderLineFees([], new Map())).toEqual([])
  })
})
