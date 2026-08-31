import { describe, expect, it } from 'vitest'

import { normalizeGovernorate } from './governorate.lib'
import {
  applyShippingFeesAndRound,
  calculateCartWeightGrams,
  calculateLocationShippingCost,
  calculateRawShippingAmount,
  getWeightExtraCharge,
} from './shipping.lib'

describe('normalizeGovernorate', () => {
  it('normalizes English governorate names', () => {
    expect(normalizeGovernorate('Cairo Governorate')).toBe('CAIRO')
    expect(normalizeGovernorate('giza')).toBe('GIZA')
    expect(normalizeGovernorate('Alexandria')).toBe('ALEXANDRIA')
  })

  it('normalizes alternate spellings from the rate sheet', () => {
    expect(normalizeGovernorate('Louxor')).toBe('LUXOR')
    expect(normalizeGovernorate('Souhage')).toBe('SOHAG')
    expect(normalizeGovernorate('Nourth Sinai')).toBe('NORTH SINAI')
    expect(normalizeGovernorate('New Vallley')).toBe('NEW VALLEY')
    expect(normalizeGovernorate('Domitta')).toBe('DAMIETTA')
    expect(normalizeGovernorate('Bani Swief')).toBe('BENI SUEF')
    expect(normalizeGovernorate('Menia')).toBe('MINYA')
    expect(normalizeGovernorate('Behira')).toBe('BEHEIRA')
    expect(normalizeGovernorate('Monoufia')).toBe('MONUFIA')
  })

  it('normalizes Arabic governorate names', () => {
    expect(normalizeGovernorate('القاهرة')).toBe('CAIRO')
    expect(normalizeGovernorate('الجيزة')).toBe('GIZA')
  })

  it('normalizes geocoder-style spellings seen in live address data', () => {
    // "Al Qalyubiya" — the exact user_addresses.state value on a live order;
    // previously fell through to null and blocked Egypt Post assignment.
    expect(normalizeGovernorate('Al Qalyubiya')).toBe('QALIUBIA')
  })

  it('returns null for empty or unknown values', () => {
    expect(normalizeGovernorate('')).toBeNull()
    expect(normalizeGovernorate(undefined)).toBeNull()
  })
})

describe('applyShippingFeesAndRound', () => {
  it('applies 14% fees and rounds up to the nearest 5', () => {
    expect(applyShippingFeesAndRound(55)).toBe(65)
    expect(applyShippingFeesAndRound(110)).toBe(130)
    expect(applyShippingFeesAndRound(69)).toBe(80)
  })
})

describe('getWeightExtraCharge', () => {
  it('charges only for weight beyond the first 1 kg tier', () => {
    expect(getWeightExtraCharge(999)).toBe(0)
    expect(getWeightExtraCharge(1000)).toBe(0)
    expect(getWeightExtraCharge(1001)).toBe(7)
    expect(getWeightExtraCharge(2500)).toBe(14)
  })
})

describe('calculateCartWeightGrams', () => {
  it('defaults missing product weight to 1 kg per item', () => {
    expect(
      calculateCartWeightGrams([
        { quantity: 2, product: { productType: 'physical' } },
      ]),
    ).toBe(2000)
  })

  it('uses dimensions.weight with kg units', () => {
    expect(
      calculateCartWeightGrams([
        {
          quantity: 1,
          product: {
            productType: 'physical',
            dimensions: { weight: 0.5, weightUnit: 'kg' },
          },
        },
      ]),
    ).toBe(500)
  })

  it('ignores digital items', () => {
    expect(
      calculateCartWeightGrams([
        { quantity: 1, product: { productType: 'digital' } },
      ]),
    ).toBe(0)
  })
})

describe('calculateRawShippingAmount', () => {
  it('combines base rate and weight surcharge', () => {
    expect(calculateRawShippingAmount('Giza', 2300)).toBe(69)
  })

  it('uses fallback base rate for unknown governorates', () => {
    expect(calculateRawShippingAmount('Unknown Place', 500)).toBe(110)
  })
})

describe('calculateLocationShippingCost', () => {
  const physicalItem = {
    quantity: 1,
    product: {
      productType: 'physical' as const,
      freeDelivery: false,
      dimensions: { weight: 1, weightUnit: 'kg' },
    },
  }

  it('returns 0 for digital-only carts', () => {
    expect(
      calculateLocationShippingCost({
        items: [{ quantity: 1, product: { productType: 'digital' } }],
        destinationState: 'Cairo',
      }),
    ).toBe(0)
  })

  it('returns 0 when all physical items qualify for free delivery', () => {
    expect(
      calculateLocationShippingCost({
        items: [
          {
            quantity: 1,
            product: {
              productType: 'physical',
              freeDelivery: true,
            },
          },
        ],
        destinationState: 'Cairo',
      }),
    ).toBe(0)
  })

  it('calculates location-based shipping for Cairo to Giza', () => {
    expect(
      calculateLocationShippingCost({
        items: [physicalItem],
        destinationState: 'Giza',
      }),
    ).toBe(65)
  })

  it('includes weight surcharge in the final amount', () => {
    expect(
      calculateLocationShippingCost({
        items: [
          {
            quantity: 1,
            product: {
              productType: 'physical',
              freeDelivery: false,
              dimensions: { weight: 2.3, weightUnit: 'kg' },
            },
          },
        ],
        destinationState: 'Giza',
      }),
    ).toBe(80)
  })
})
