import { describe, expect, it } from 'vitest'
import {
  isDuplicateOrder,
  isFakePhone,
  isJunkAddress,
  isJunkName,
  isOwnAccount,
  itemsFingerprint,
  normalizeEgMobile,
  orderJunkReasons,
} from './fee-hold.lib'

describe('isJunkName', () => {
  it.each(['test', 'Test Test', 'asdasd', 'ASDF', 'qwerty', 'aaaa', 'ahmed test', 'تست', 'تجربة', 'شسيشسي', 'ههههه', 'x', '123', 'sdfgh', ''])(
    'flags %s',
    (name) => expect(isJunkName(name)).toBe(true),
  )
  it.each(['Ahmed Mohamed', 'محمد علي', 'Sara', 'Nada Hassan', 'عبد الرحمن', 'Abdo', 'Assad Ali', 'Tess'])(
    'keeps %s',
    (name) => expect(isJunkName(name)).toBe(false),
  )
})

describe('isJunkAddress', () => {
  it.each(['test', 'asdasd street', 'abc', '12', 'تجربة'])('flags %s', (line) => expect(isJunkAddress(line)).toBe(true))
  it.each(['12 شارع التحرير', '5 Abbas El Akkad St', 'Building 9, Maadi'])('keeps %s', (line) =>
    expect(isJunkAddress(line)).toBe(false),
  )
})

describe('isFakePhone', () => {
  it.each(['01000000000', '01111111111', '01234567890', '+20 100 000 0000', '01087654321', '٠١٠٠٠٠٠٠٠٠٠'])('flags %s', (phone) =>
    expect(isFakePhone(phone)).toBe(true),
  )
  it.each(['01012345671', '01123456719','01552349876', 'not a phone'])('keeps %s', (phone) =>
    expect(isFakePhone(phone)).toBe(false),
  )
  it('normalises spellings', () => {
    expect(normalizeEgMobile('+20 101 234 5678')).toBe('01012345678')
    expect(normalizeEgMobile('00201012345678')).toBe('01012345678')
  })
})

describe('isOwnAccount', () => {
  const seller = { sellerId: 's1', phones: ['+201012345678', null], emails: ['Owner@Shop.com'] }
  it('matches the seller account, phone or email', () => {
    expect(isOwnAccount({ userId: 's1' }, seller)).toBe(true)
    expect(isOwnAccount({ userId: 'u', phone: '01012345678' }, seller)).toBe(true)
    expect(isOwnAccount({ userId: 'u', email: ' owner@shop.com ' }, seller)).toBe(true)
  })
  it('keeps a real customer', () => {
    expect(isOwnAccount({ userId: 'u', phone: '01099999998', email: 'a@b.com' }, seller)).toBe(false)
  })
})

describe('isDuplicateOrder', () => {
  const fp = itemsFingerprint([
    { productId: 'p1', variantId: 'v1', quantity: 1 },
    { productId: 'p2', quantity: 2 },
  ])
  it('ignores line order and merges split lines', () => {
    expect(
      itemsFingerprint([
        { productId: 'p2', quantity: 1 },
        { productId: 'p1', variantId: 'v1', quantity: 1 },
        { productId: 'p2', quantity: 1 },
      ]),
    ).toBe(fp)
  })
  it('matches same items by phone or by account', () => {
    expect(isDuplicateOrder({ userId: 'u2', phone: '+201012345678', fingerprint: fp }, [{ userId: 'u1', phone: '01012345678', fingerprint: fp }])).toBe(true)
    expect(isDuplicateOrder({ userId: 'u1', phone: null, fingerprint: fp }, [{ userId: 'u1', phone: null, fingerprint: fp }])).toBe(true)
  })
  it('different items or another customer is a new order', () => {
    expect(isDuplicateOrder({ userId: 'u1', phone: '01012345678', fingerprint: 'other' }, [{ userId: 'u1', phone: '01012345678', fingerprint: fp }])).toBe(false)
    expect(isDuplicateOrder({ userId: 'u2', phone: '01099999998', fingerprint: fp }, [{ userId: 'u1', phone: '01012345678', fingerprint: fp }])).toBe(false)
  })
})

describe('orderJunkReasons', () => {
  it('collects every order-wide signal', () => {
    expect(orderJunkReasons({ fullName: 'test', phone: '01000000000', addressLine1: 'asd' })).toEqual([
      'junk_name',
      'fake_phone',
      'junk_address',
    ])
    expect(orderJunkReasons({ fullName: 'Ahmed Ali', phone: '01012345671', addressLine1: '12 شارع التحرير' })).toEqual([])
    expect(orderJunkReasons(null)).toEqual([])
  })
})

describe('foreign phones (F-61e)', () => {
  it('spots a repeat from the same foreign number on another guest account', () => {
    const recent = [{ userId: 'guest-1', phone: '+966512345678', fingerprint: 'p1x1' }]
    expect(isDuplicateOrder({ userId: 'guest-2', phone: '0512345678', fingerprint: 'p1x1' }, recent)).toBe(true)
    expect(isDuplicateOrder({ userId: 'guest-2', phone: '+966512345679', fingerprint: 'p1x1' }, recent)).toBe(false)
  })

  it('spots a seller testing with their own foreign number', () => {
    const seller = { sellerId: 's1', phones: ['+966512345678'], emails: [] }
    expect(isOwnAccount({ userId: 'guest', phone: '966512345678' }, seller)).toBe(true)
  })
})
