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
