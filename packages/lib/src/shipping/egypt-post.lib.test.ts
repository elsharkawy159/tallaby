import { describe, expect, it } from 'vitest'

import {
  EGYPT_POST_COLUMNS,
  EGYPT_POST_GOVERNORATES,
  normalizeEgyptianMobile,
  toEgyptPostRow,
  toEgyptPostRows,
  type EgyptPostOrderInput,
} from './egypt-post.lib'
import { normalizeGovernorate } from './governorate.lib'

const DEFAULTS = {
  weightKg: 1,
  volume: 'Small' as const,
  merchantCode: '1017575',
  merchantName: 'Tallaby',
  warehouseName: 'المطريه القاهره',
}

function makeOrder(overrides: Partial<EgyptPostOrderInput> = {}): EgyptPostOrderInput {
  return {
    orderId: 'order-1',
    orderNumber: 'TLB-100234',
    totalAmount: 250,
    paymentStatus: 'pending',
    customerName: 'Ahmed Ali',
    phone: '01012345678',
    addressLine1: '12 Al Nasr St',
    addressLine2: null,
    governorate: 'Cairo',
    city: 'Nasr City',
    deliveryInstructions: null,
    orderNotes: null,
    items: [{ productName: 'Wireless Mouse', quantity: 2 }],
    sellerNames: ['Acme Store'],
    ...overrides,
  }
}

describe('EGYPT_POST_COLUMNS', () => {
  it('matches the template header exactly, in order', () => {
    expect(EGYPT_POST_COLUMNS).toEqual([
      'Package_Serial',
      'Description',
      'Total_Weight',
      'Package_volume',
      'COD_Value',
      'Item_Special_Notes',
      'Customer_Name',
      'Mobile_No',
      'Street',
      'City',
      'Package_Ref. Number',
      'Merchant_Name',
      'Warehouse_Name',
      'HasPOD',
      'SellerName',
      'Post_Id',
    ])
  })
})

describe('EGYPT_POST_GOVERNORATES', () => {
  it('maps every canonical governorate normalizeGovernorate can produce', () => {
    const canonicalKeys = [
      'CAIRO',
      'GIZA',
      'QALIUBIA',
      'KAFR EL SHEIKH',
      'SHARKIA',
      'ALEXANDRIA',
      'BEHEIRA',
      'GHARBIA',
      'MONUFIA',
      'DAMIETTA',
      'DAKAHLIA',
      'ISMAILIA',
      'SUEZ',
      'PORT SAID',
      'FAYOUM',
      'BENI SUEF',
      'MINYA',
      'ASSIUT',
      'SOHAG',
      'QENA',
      'ASWAN',
      'LUXOR',
      'RED SEA',
      'MARSA MATROUH',
      'NEW VALLEY',
      'NORTH SINAI',
      'SOUTH SINAI',
    ]

    expect(Object.keys(EGYPT_POST_GOVERNORATES).sort()).toEqual(canonicalKeys.sort())
  })

  it('preserves Egypt Post\'s own spelling quirks', () => {
    expect(EGYPT_POST_GOVERNORATES.BEHEIRA).toBe('BEHIRA')
    expect(EGYPT_POST_GOVERNORATES.MONUFIA).toBe('MONOUFIA')
    expect(EGYPT_POST_GOVERNORATES.DAMIETTA).toBe('DOMITTA')
    expect(EGYPT_POST_GOVERNORATES['BENI SUEF']).toBe('BANI SWEIF')
    expect(EGYPT_POST_GOVERNORATES.MINYA).toBe('MENIA')
    expect(EGYPT_POST_GOVERNORATES.SOHAG).toBe('SOUHAGE')
    expect(EGYPT_POST_GOVERNORATES.LUXOR).toBe('LOUXOR')
    expect(EGYPT_POST_GOVERNORATES['NEW VALLEY']).toBe('NEW VALLLEY')
    expect(EGYPT_POST_GOVERNORATES['NORTH SINAI']).toBe('NOURTH SINAI')
  })

  it('round-trips through normalizeGovernorate for Arabic input', () => {
    const canonical = normalizeGovernorate('الدقهلية')
    expect(canonical).toBe('DAKAHLIA')
    expect(EGYPT_POST_GOVERNORATES[canonical!]).toBe('DAKAHLIA')
  })
})

describe('normalizeEgyptianMobile', () => {
  it('accepts a bare 11-digit mobile number', () => {
    expect(normalizeEgyptianMobile('01012345678')).toBe('01012345678')
  })

  it('strips a +20 country code and restores the leading 0', () => {
    expect(normalizeEgyptianMobile('+201012345678')).toBe('01012345678')
  })

  it('strips a 0020 country code', () => {
    expect(normalizeEgyptianMobile('0020 101 234 5678')).toBe('01012345678')
  })

  it('strips spaces, dashes, and parens', () => {
    expect(normalizeEgyptianMobile('010-1234-5678')).toBe('01012345678')
    expect(normalizeEgyptianMobile('(010) 123 45678')).toBe('01012345678')
  })

  it('rejects a landline number', () => {
    expect(normalizeEgyptianMobile('0223456789')).toBeNull()
  })

  it('rejects garbage and empty input', () => {
    expect(normalizeEgyptianMobile('123456')).toBeNull()
    expect(normalizeEgyptianMobile('')).toBeNull()
    expect(normalizeEgyptianMobile(null)).toBeNull()
    expect(normalizeEgyptianMobile(undefined)).toBeNull()
  })
})

describe('toEgyptPostRow', () => {
  it('builds a complete row for a valid order', () => {
    const result = toEgyptPostRow(makeOrder(), 0, DEFAULTS)

    expect(result.error).toBeUndefined()
    expect(result.row).toMatchObject({
      Package_Serial: 1,
      Description: '2× Wireless Mouse',
      Total_Weight: 1000,
      Package_volume: 'Small',
      COD_Value: 250,
      Customer_Name: 'Ahmed Ali',
      Mobile_No: '01012345678',
      Street: '12 Al Nasr St',
      City: 'CAIRO',
      'Package_Ref. Number': 'TLB-100234',
      Merchant_Name: 'Tallaby',
      Warehouse_Name: 'المطريه القاهره',
      HasPOD: 'FALSE',
      SellerName: 'Acme Store',
      Post_Id: '1017575',
    })
  })

  it('uses the row index for Package_Serial (1-based)', () => {
    const result = toEgyptPostRow(makeOrder(), 4, DEFAULTS)
    expect(result.row?.Package_Serial).toBe(5)
  })

  it('zeroes COD_Value for a paid or collected order', () => {
    expect(toEgyptPostRow(makeOrder({ paymentStatus: 'paid' }), 0, DEFAULTS).row?.COD_Value).toBe(0)
    expect(toEgyptPostRow(makeOrder({ paymentStatus: 'collected' }), 0, DEFAULTS).row?.COD_Value).toBe(0)
  })

  it('charges the full total for a pending/unsettled order', () => {
    expect(toEgyptPostRow(makeOrder({ paymentStatus: 'pending' }), 0, DEFAULTS).row?.COD_Value).toBe(250)
  })

  it('falls back to the batch default weight when the shipment has none, converted to grams', () => {
    const result = toEgyptPostRow(makeOrder({ packageWeightKg: null }), 0, DEFAULTS)
    expect(result.row?.Total_Weight).toBe(1000)
  })

  it("uses the shipment's own weight when set, converted from kg to grams", () => {
    const result = toEgyptPostRow(makeOrder({ packageWeightKg: 3.5 }), 0, DEFAULTS)
    expect(result.row?.Total_Weight).toBe(3500)
  })

  it('rounds a fractional gram result to the nearest whole gram', () => {
    const result = toEgyptPostRow(makeOrder({ packageWeightKg: 0.1234 }), 0, DEFAULTS)
    expect(result.row?.Total_Weight).toBe(123)
  })

  it('joins address lines when a second line is present', () => {
    const result = toEgyptPostRow(makeOrder({ addressLine2: 'Apt 4, Floor 2' }), 0, DEFAULTS)
    expect(result.row?.Street).toBe('12 Al Nasr St, Apt 4, Floor 2')
  })

  it('falls back to the account phone when the address has none', () => {
    const result = toEgyptPostRow(
      makeOrder({ phone: null, fallbackPhone: '+201098765432' }),
      0,
      DEFAULTS
    )
    expect(result.row?.Mobile_No).toBe('01098765432')
  })

  it('uses "Tallaby" as SellerName when the order has multiple sellers', () => {
    const result = toEgyptPostRow(makeOrder({ sellerNames: ['Acme Store', 'Other Shop'] }), 0, DEFAULTS)
    expect(result.row?.SellerName).toBe('Tallaby')
  })

  it('uses the single seller name when there is exactly one', () => {
    const result = toEgyptPostRow(makeOrder({ sellerNames: ['Acme Store'] }), 0, DEFAULTS)
    expect(result.row?.SellerName).toBe('Acme Store')
  })

  it('joins delivery instructions and order notes with an em dash', () => {
    const result = toEgyptPostRow(
      makeOrder({ deliveryInstructions: 'Ring the bell', orderNotes: 'Gift wrap' }),
      0,
      DEFAULTS
    )
    expect(result.row?.Item_Special_Notes).toBe('Ring the bell — Gift wrap')
  })

  it('errors when no valid mobile number can be derived', () => {
    const result = toEgyptPostRow(makeOrder({ phone: 'not-a-phone', fallbackPhone: null }), 0, DEFAULTS)
    expect(result.row).toBeUndefined()
    expect(result.error?.reason).toMatch(/mobile/i)
    expect(result.error?.orderNumber).toBe('TLB-100234')
  })

  it('errors when the governorate cannot be mapped', () => {
    const result = toEgyptPostRow(makeOrder({ governorate: 'Nowhereland', city: 'Nowhereland' }), 0, DEFAULTS)
    expect(result.row).toBeUndefined()
    expect(result.error?.reason).toMatch(/not recognized/i)
  })
})

describe('toEgyptPostRows', () => {
  it('collects rows and errors across a batch without throwing', () => {
    const orders = [
      makeOrder({ orderId: 'a', orderNumber: 'TLB-1' }),
      makeOrder({ orderId: 'b', orderNumber: 'TLB-2', governorate: 'Bad Place', city: 'Bad Place' }),
      makeOrder({ orderId: 'c', orderNumber: 'TLB-3' }),
    ]

    const { rows, errors } = toEgyptPostRows(orders, DEFAULTS)

    expect(rows).toHaveLength(2)
    expect(errors).toHaveLength(1)
    expect(errors[0]?.orderNumber).toBe('TLB-2')
    expect(rows[0]?.Package_Serial).toBe(1)
    expect(rows[1]?.Package_Serial).toBe(2)
  })
})
