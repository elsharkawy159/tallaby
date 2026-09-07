import { describe, expect, it } from 'vitest'
import {
  buildProductShareUrl,
  buildProductShareUrlFromPath,
  normalizeCouponCode,
} from './affiliate-coupon.lib'

describe('normalizeCouponCode', () => {
  it('uppercases and trims a valid code', () => {
    expect(normalizeCouponCode('  ahmed10  ')).toBe('AHMED10')
  })

  it('rejects empty / whitespace', () => {
    expect(normalizeCouponCode('')).toBeNull()
    expect(normalizeCouponCode('   ')).toBeNull()
    expect(normalizeCouponCode(null)).toBeNull()
    expect(normalizeCouponCode(undefined)).toBeNull()
  })

  it('rejects injection-prone or malformed codes', () => {
    expect(normalizeCouponCode('A')).toBeNull()
    expect(normalizeCouponCode('BAD CODE')).toBeNull()
    expect(normalizeCouponCode('x<script>')).toBeNull()
    expect(normalizeCouponCode('a'.repeat(50))).toBeNull()
  })
})

describe('buildProductShareUrl', () => {
  it('appends coupon for an affiliate share', () => {
    expect(
      buildProductShareUrl(
        'https://www.tallaby.com/products/test-product',
        'ABC123'
      )
    ).toBe('https://www.tallaby.com/products/test-product?coupon=ABC123')
  })

  it('omits coupon for a non-affiliate share', () => {
    expect(
      buildProductShareUrl(
        'https://www.tallaby.com/products/test-product',
        null
      )
    ).toBe('https://www.tallaby.com/products/test-product')
  })

  it('URL-encodes coupon values safely via URLSearchParams', () => {
    // Underscore is allowed by normalize; URLSearchParams keeps it literal.
    expect(
      buildProductShareUrl(
        'https://www.tallaby.com/products/test-product',
        'AHMED_10'
      )
    ).toBe('https://www.tallaby.com/products/test-product?coupon=AHMED_10')
  })

  it('preserves existing query params and sets coupon with &', () => {
    expect(
      buildProductShareUrl(
        'https://www.tallaby.com/products/phone-holder?foo=bar',
        'AHMED10'
      )
    ).toBe(
      'https://www.tallaby.com/products/phone-holder?foo=bar&coupon=AHMED10'
    )
  })

  it('replaces an existing coupon instead of duplicating it', () => {
    expect(
      buildProductShareUrl(
        'https://www.tallaby.com/products/phone-holder?coupon=OLD',
        'NEW10'
      )
    ).toBe('https://www.tallaby.com/products/phone-holder?coupon=NEW10')
  })

  it('ignores invalid coupon input without breaking the product URL', () => {
    expect(
      buildProductShareUrl(
        'https://www.tallaby.com/products/test-product',
        'BAD CODE'
      )
    ).toBe('https://www.tallaby.com/products/test-product')
  })
})

describe('buildProductShareUrlFromPath', () => {
  it('builds an affiliate product share from origin + pathname', () => {
    expect(
      buildProductShareUrlFromPath({
        origin: 'https://www.tallaby.com',
        pathname: '/products/portable-handheld-fan',
        coupon: 'AHMED10',
      })
    ).toBe(
      'https://www.tallaby.com/products/portable-handheld-fan?coupon=AHMED10'
    )
  })

  it('builds a clean product URL when the sharer is not an affiliate', () => {
    expect(
      buildProductShareUrlFromPath({
        origin: 'https://www.tallaby.com',
        pathname: '/products/test-product',
        coupon: null,
      })
    ).toBe('https://www.tallaby.com/products/test-product')
  })

  it('keeps locale prefixes in the pathname', () => {
    expect(
      buildProductShareUrlFromPath({
        origin: 'https://www.tallaby.com',
        pathname: '/ar/products/test-product',
        coupon: 'ABC123',
      })
    ).toBe('https://www.tallaby.com/ar/products/test-product?coupon=ABC123')
  })
})
