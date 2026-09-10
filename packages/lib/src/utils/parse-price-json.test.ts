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
      base: 45,
      list: null,
      final: 45,
      discountType: null,
      discountValue: null,
    })
    expect(getPriceFinal('99.5')).toBe(100)
  })

  it('falls back through final → current → list → base', () => {
    expect(getPriceFinal({ list: 10, current: 8 })).toBe(10)
    expect(getPriceList({ list: 20, final: 15 })).toBe(20)
  })

  it('rounds base, list and final up to the nearest 5', () => {
    expect(
      parsePriceJson({
        base: 199,
        list: 248,
        final: 344,
        discountType: 'percent',
        discountValue: 10,
      })
    ).toEqual({
      base: 200,
      list: 250,
      final: 345,
      discountType: 'percent',
      discountValue: 10,
    })
  })
})
