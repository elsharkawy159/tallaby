import { describe, expect, it } from 'vitest'

import { normalizeGovernorate } from './governorate.lib'
import {
  applyShippingFeesAndRound,
  calculateCartWeightGrams,
  calculateLocationShippingCost,
  calculateRawShippingAmount,
  cartQualifiesForProductFreeDelivery,
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
    price: 250,
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

  it('returns 0 when all physical items qualify for free delivery and subtotal meets threshold', () => {
    expect(
      calculateLocationShippingCost({
        items: [
          {
            quantity: 1,
            price: 250,
            product: {
              productType: 'physical',
              freeDelivery: true,
            },
          },
        ],
        destinationState: 'Cairo',
        cartSubtotal: 250,
      }),
    ).toBe(0)
  })

  it('charges shipping when free-delivery items are below the 200 EGP threshold', () => {
    expect(
      calculateLocationShippingCost({
        items: [
          {
            quantity: 1,
            price: 100,
            product: {
              productType: 'physical',
              freeDelivery: true,
              dimensions: { weight: 1, weightUnit: 'kg' },
            },
          },
        ],
        destinationState: 'Giza',
        cartSubtotal: 100,
      }),
    ).toBe(65)
  })

  it('waives seller free_delivery only when cart subtotal is at least 200 EGP', () => {
    const freeSellerItem = {
      quantity: 1,
      price: 150,
      sellerId: 'seller-free',
      product: {
        productType: 'physical' as const,
        freeDelivery: false,
        dimensions: { weight: 1, weightUnit: 'kg' },
        sellerId: 'seller-free',
        seller: { freeDelivery: true },
      },
    }

    expect(
      calculateLocationShippingCost({
        items: [freeSellerItem],
        destinationState: 'Giza',
        cartSubtotal: 150,
      }),
    ).toBe(65)

    expect(
      calculateLocationShippingCost({
        items: [{ ...freeSellerItem, price: 200 }],
        destinationState: 'Giza',
        cartSubtotal: 200,
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

  it('returns null when destination address is not set yet', () => {
    expect(
      calculateLocationShippingCost({
        items: [physicalItem],
        destinationState: null,
      }),
    ).toBeNull()

    expect(
      calculateLocationShippingCost({
        items: [physicalItem],
        destinationState: undefined,
      }),
    ).toBeNull()

    expect(
      calculateLocationShippingCost({
        items: [physicalItem],
        destinationState: '   ',
      }),
    ).toBeNull()
  })

  it('waives shipping only for the seller whose free_delivery flag is true', () => {
    const freeSellerItem = {
      quantity: 1,
      price: 150,
      sellerId: 'seller-free',
      product: {
        productType: 'physical' as const,
        freeDelivery: false,
        dimensions: { weight: 1, weightUnit: 'kg' },
        sellerId: 'seller-free',
        seller: { freeDelivery: true },
      },
    }
    const paidSellerItem = {
      quantity: 1,
      price: 150,
      sellerId: 'seller-paid',
      product: {
        productType: 'physical' as const,
        freeDelivery: false,
        dimensions: { weight: 1, weightUnit: 'kg' },
        sellerId: 'seller-paid',
        seller: { freeDelivery: false },
      },
    }

    // Only the non-free seller's shipping is billed (cart ≥ 200)
    expect(
      calculateLocationShippingCost({
        items: [freeSellerItem, paidSellerItem],
        destinationState: 'Giza',
        cartSubtotal: 300,
      }),
    ).toBe(65)

    // Both sellers free -> whole order ships free
    expect(
      calculateLocationShippingCost({
        items: [
          freeSellerItem,
          {
            ...paidSellerItem,
            sellerId: 'seller-free-2',
            product: {
              ...paidSellerItem.product,
              sellerId: 'seller-free-2',
              seller: { freeDelivery: true },
            },
          },
        ],
        destinationState: 'Giza',
        cartSubtotal: 300,
      }),
    ).toBe(0)
  })

  it('does not require a destination when the only billable seller is unknown but every seller present is free', () => {
    expect(
      calculateLocationShippingCost({
        items: [
          {
            quantity: 1,
            price: 250,
            sellerId: 'seller-free',
            product: {
              productType: 'physical',
              freeDelivery: false,
              sellerId: 'seller-free',
              seller: { freeDelivery: true },
            },
          },
        ],
        destinationState: null,
        cartSubtotal: 250,
      }),
    ).toBe(0)
  })
})

describe('cartQualifiesForProductFreeDelivery', () => {
  it('is false when one seller in a multi-seller cart is not free delivery', () => {
    expect(
      cartQualifiesForProductFreeDelivery(
        [
          {
            quantity: 1,
            sellerId: 'seller-free',
            product: {
              productType: 'physical',
              sellerId: 'seller-free',
              seller: { freeDelivery: true },
            },
          },
          {
            quantity: 1,
            sellerId: 'seller-paid',
            product: {
              productType: 'physical',
              freeDelivery: false,
              sellerId: 'seller-paid',
              seller: { freeDelivery: false },
            },
          },
        ],
        300,
      ),
    ).toBe(false)
  })

  it('is true when every seller in the cart is free delivery and threshold is met', () => {
    expect(
      cartQualifiesForProductFreeDelivery(
        [
          {
            quantity: 1,
            sellerId: 'seller-a',
            product: {
              productType: 'physical',
              sellerId: 'seller-a',
              seller: { freeDelivery: true },
            },
          },
          {
            quantity: 1,
            sellerId: 'seller-b',
            product: {
              productType: 'physical',
              freeDelivery: true,
              sellerId: 'seller-b',
              seller: { freeDelivery: false },
            },
          },
        ],
        200,
      ),
    ).toBe(true)
  })

  it('is false when free-delivery sellers are below the 200 EGP threshold', () => {
    expect(
      cartQualifiesForProductFreeDelivery(
        [
          {
            quantity: 1,
            sellerId: 'seller-a',
            product: {
              productType: 'physical',
              sellerId: 'seller-a',
              seller: { freeDelivery: true },
            },
          },
        ],
        100,
      ),
    ).toBe(false)
  })
})
