import { describe, expect, it } from 'vitest'
import {
  buildBillingData,
  buildTransactionHmacPayload,
  verifyPaymobTransactionHmac,
} from './paymob.lib'
import type { PaymobTransactionObj } from './paymob.types'

const sampleTransaction: PaymobTransactionObj = {
  amount_cents: 100,
  created_at: '2020-03-25T18:39:44.719228',
  currency: 'EGP',
  error_occured: false,
  has_parent_transaction: false,
  id: 2556706,
  integration_id: 6741,
  is_3d_secure: true,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  order: { id: 4778239 },
  owner: 4705,
  pending: false,
  source_data: {
    pan: '2346',
    sub_type: 'MasterCard',
    type: 'card',
  },
  success: true,
}

describe('paymob HMAC', () => {
  it('includes required billing fields for intention API', () => {
    const billing = buildBillingData({
      fullName: 'John Doe',
      phone: '01012345678',
      email: 'john@example.com',
      addressLine1: 'Main St',
      city: 'Cairo',
      state: 'Cairo',
      postalCode: '11511',
    })

    expect(billing.postal_code).toBe('11511')
    expect(billing.shipping_method).toBe('PKG')
    expect(billing.phone_number).toBe('+201012345678')
  })

  it('builds the documented concatenation payload', () => {
    expect(buildTransactionHmacPayload(sampleTransaction)).toBe(
      '1002020-03-25T18:39:44.719228EGPfalsefalse25567066741truefalsefalsefalsetruefalse47782394705false2346MasterCardcardtrue'
    )
  })

  it('rejects invalid HMAC values', () => {
    expect(
      verifyPaymobTransactionHmac(sampleTransaction, 'invalid-hmac', 'test-secret')
    ).toBe(false)
  })
})
