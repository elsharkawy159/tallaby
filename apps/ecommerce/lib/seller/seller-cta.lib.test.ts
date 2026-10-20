import { describe, expect, it } from 'vitest'

import type { AuthenticatedUserDisplay } from '@/lib/auth/auth-user.types'
import {
  SELLER_DASHBOARD_URL,
  SELLER_SIGNUP_URL,
  getSellerCtaHref,
  getSellerCtaOpensInNewTab,
} from './seller-cta.lib'

const customer = { isSeller: false } as AuthenticatedUserDisplay
const seller = { isSeller: true } as AuthenticatedUserDisplay

describe('getSellerCtaHref', () => {
  it('sends guests and customers from the sell page to the dashboard signup (P2-05)', () => {
    expect(getSellerCtaHref(null, { fromSellPage: true })).toBe(SELLER_SIGNUP_URL)
    expect(getSellerCtaHref(customer, { fromSellPage: true })).toBe(SELLER_SIGNUP_URL)
    expect(SELLER_SIGNUP_URL).toMatch(/\/signup$/)
  })

  it('keeps other entry points on the sell page', () => {
    expect(getSellerCtaHref(null)).toBe('/sell')
    expect(getSellerCtaHref(customer)).toBe('/sell')
  })

  it('sends sellers to their dashboard in a new tab', () => {
    expect(getSellerCtaHref(seller, { fromSellPage: true })).toBe(SELLER_DASHBOARD_URL)
    expect(getSellerCtaOpensInNewTab(seller)).toBe(true)
    expect(getSellerCtaOpensInNewTab(customer)).toBe(false)
  })
})
