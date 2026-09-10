import { describe, expect, it } from 'vitest'
import {
  roundNullablePriceUpToNearestFive,
  roundPriceUpToNearestFive,
} from './round-price'

describe('roundPriceUpToNearestFive', () => {
  it('rounds up to the next multiple of 5', () => {
    expect(roundPriceUpToNearestFive(199)).toBe(200)
    expect(roundPriceUpToNearestFive(248)).toBe(250)
    expect(roundPriceUpToNearestFive(344)).toBe(345)
    expect(roundPriceUpToNearestFive(1)).toBe(5)
  })

  it('leaves prices already on the step untouched', () => {
    expect(roundPriceUpToNearestFive(5)).toBe(5)
    expect(roundPriceUpToNearestFive(150)).toBe(150)
    expect(roundPriceUpToNearestFive(1000)).toBe(1000)
  })

  it('never rounds down, including fractional prices', () => {
    expect(roundPriceUpToNearestFive(150.01)).toBe(155)
    expect(roundPriceUpToNearestFive(199.99)).toBe(200)
    expect(roundPriceUpToNearestFive(0.5)).toBe(5)
  })

  it('absorbs binary float noise instead of jumping a whole step', () => {
    // 0.1 + 0.2 = 0.30000000000000004; 149.99999999999997 is one ULP under 150
    expect(roundPriceUpToNearestFive(149.99999999999997)).toBe(150)
  })

  it('returns 0 for non-positive and non-finite input', () => {
    expect(roundPriceUpToNearestFive(0)).toBe(0)
    expect(roundPriceUpToNearestFive(-10)).toBe(0)
    expect(roundPriceUpToNearestFive(Number.NaN)).toBe(0)
    expect(roundPriceUpToNearestFive(Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('roundNullablePriceUpToNearestFive', () => {
  it('passes null and undefined straight through', () => {
    expect(roundNullablePriceUpToNearestFive(null)).toBeNull()
    expect(roundNullablePriceUpToNearestFive(undefined)).toBeNull()
    expect(roundNullablePriceUpToNearestFive(Number.NaN)).toBeNull()
  })

  it('rounds real numbers', () => {
    expect(roundNullablePriceUpToNearestFive(248)).toBe(250)
    expect(roundNullablePriceUpToNearestFive(0)).toBe(0)
  })
})
