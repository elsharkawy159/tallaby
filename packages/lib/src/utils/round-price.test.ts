import { describe, expect, it } from 'vitest'
import { normalizeNullablePrice, normalizePrice } from './round-price'

describe('normalizePrice', () => {
  it('keeps the price the seller entered', () => {
    expect(normalizePrice(199)).toBe(199)
    expect(normalizePrice(248)).toBe(248)
    expect(normalizePrice(1)).toBe(1)
    expect(normalizePrice(150.5)).toBe(150.5)
  })

  it('keeps two decimals and drops float noise', () => {
    expect(normalizePrice(0.1 + 0.2)).toBe(0.3)
    expect(normalizePrice(199.999)).toBe(200)
    expect(normalizePrice(149.99999999999997)).toBe(150)
  })

  it('treats zero, negatives and non-finite values as 0', () => {
    expect(normalizePrice(0)).toBe(0)
    expect(normalizePrice(-10)).toBe(0)
    expect(normalizePrice(Number.NaN)).toBe(0)
    expect(normalizePrice(Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('normalizeNullablePrice', () => {
  it('passes null and non-finite through as null', () => {
    expect(normalizeNullablePrice(null)).toBeNull()
    expect(normalizeNullablePrice(undefined)).toBeNull()
    expect(normalizeNullablePrice(Number.NaN)).toBeNull()
  })

  it('normalises finite values', () => {
    expect(normalizeNullablePrice(248)).toBe(248)
    expect(normalizeNullablePrice(0)).toBe(0)
  })
})
