import { describe, expect, it } from 'vitest'
import { describeAdminNotification } from './notification-bell.lib'

describe('describeAdminNotification (0173)', () => {
  it('describes a top-up paid online with the EGP paid and the USD credit', () => {
    const text = describeAdminNotification({
      type: 'top_up_paid',
      data: { amount: '539.01', currency: 'EGP', creditAmount: '10.00', creditCurrency: 'USD', method: 'kashier', sellerName: 'Mona' },
    })
    expect(text.title).toBe('Top-up paid online')
    expect(text.body).toBe('Mona · EGP 539.01 ($10.00) via Kashier')
  })

  it('leaves out a credit in the same currency and missing fields', () => {
    expect(
      describeAdminNotification({ type: 'top_up_paid', data: { amount: '100.00', currency: 'EGP', creditAmount: '100.00', creditCurrency: 'EGP' } }).body
    ).toBe('EGP 100.00')
    expect(describeAdminNotification({ type: 'top_up_paid', data: {} }).body).toBe('A seller topped up their wallet online.')
  })

  it('describes a referral signup', () => {
    expect(
      describeAdminNotification({ type: 'referral_signup', data: { sellerName: 'Ali', referrerName: 'Omar' } })
    ).toEqual({ title: 'New seller from a referral', body: 'Ali · referred by Omar' })
    expect(describeAdminNotification({ type: 'referral_signup', data: {} }).body).toBe(
      'A seller signed up through a referral link.'
    )
  })

  it('shows an unknown type as a plain notification', () => {
    expect(describeAdminNotification({ type: 'something_new', data: {} })).toEqual({ title: 'Notification', body: '' })
  })
})

describe('describeAdminNotification (0176, Tallaby Pay)', () => {
  it('describes a withdrawal request', () => {
    expect(
      describeAdminNotification({
        type: 'tallaby_pay_payout_requested',
        data: { amount: '750.00', sellerName: 'Mona', storeName: 'Mona Shop' },
      })
    ).toEqual({ title: 'Tallaby Pay withdrawal requested', body: 'Mona · Mona Shop · EGP 750.00' })
    expect(describeAdminNotification({ type: 'tallaby_pay_payout_requested', data: {} }).body).toBe(
      'A store asked to withdraw its earnings.'
    )
  })

  it('describes an identity to verify, naming the legal name only when it differs', () => {
    expect(
      describeAdminNotification({ type: 'tallaby_pay_kyc_submitted', data: { sellerName: 'Mona', legalName: 'Mona Ali Hassan' } }).body
    ).toBe('Mona as Mona Ali Hassan')
    expect(describeAdminNotification({ type: 'tallaby_pay_kyc_submitted', data: { sellerName: 'Mona', legalName: 'Mona' } }).body).toBe(
      'Mona'
    )
  })

  it('names each refund source', () => {
    const data = { storeName: 'Nour', orderNumber: '1042', amount: '320.00' }
    expect(describeAdminNotification({ type: 'tallaby_pay_refund_requested', data: { ...data, source: 'seller' } })).toEqual({
      title: 'Tallaby Pay refund requested',
      body: 'Nour · #1042 · EGP 320.00',
    })
    expect(describeAdminNotification({ type: 'tallaby_pay_refund_requested', data: { source: 'paid_twice' } }).title).toBe(
      'Paid twice: refund in EasyKash'
    )
    expect(describeAdminNotification({ type: 'tallaby_pay_refund_requested', data: { source: 'paid_after_cancel' } }).title).toBe(
      'Paid after cancel: refund in EasyKash'
    )
  })

  it('keeps the old plain-notification fallback', () => {
    expect(describeAdminNotification({ type: 'something_new', data: {} })).toEqual({ title: 'Notification', body: '' })
  })
})
