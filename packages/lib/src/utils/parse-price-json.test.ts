import { describe, expect, it } from 'vitest'
import {
  getPriceFinal,
  getPriceList,
  parsePriceJson,
} from './parse-price-json'

describe('parsePriceJson', () => {
  it('parses full product-style jsonb', () => {
    expect(
      parsePriceJson({
        base: 100,
        list: 300,
        final: 150,
        discountType: 'amount',
        discountValue: 150,
      })
    ).toEqual({
      base: 100,
      list: 300,
      final: 150,
      discountType: 'amount',
      discountValue: 150,
    })
  })

  it('accepts legacy scalar number and string', () => {
    expect(parsePriceJson(42)).toEqual({
      base: 42,
      list: null,
      final: 42,
      discountType: null,
      discountValue: null,
    })
    expect(getPriceFinal('99.5')).toBe(99.5)
  })

  it('falls back through final → current → list → base', () => {
    expect(getPriceFinal({ list: 10, current: 8 })).toBe(8)
    expect(getPriceList({ list: 20, final: 15 })).toBe(20)
  })

  it('keeps base, list and final as entered, to the piastre', () => {
    expect(
      parsePriceJson({
        base: 199,
        list: 248,
        final: 344.991,
        discountType: 'percent',
        discountValue: 10,
      })
    ).toEqual({
      base: 199,
      list: 248,
      final: 344.99,
      discountType: 'percent',
      discountValue: 10,
    })
  })
})
