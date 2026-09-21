import { createHmac } from 'crypto'
import { describe, expect, it } from 'vitest'
import { getPaymentProvider } from '../payments'
import {
  buildKashierOrderReference,
  buildRedirectSignaturePayload,
  buildWebhookSignaturePayload,
  parseKashierOrderReference,
  verifyKashierRedirectSignature,
  verifyKashierWebhookSignature,
} from './kashier.lib'

const KEY = 'test-payment-api-key'
const sign = (payload: string) =>
  createHmac('sha256', KEY).update(payload).digest('hex')

describe('redirect signature', () => {
  const query = {
    paymentStatus: 'SUCCESS',
    cardDataToken: 'tok',
    maskedCard: '411111******1111',
    merchantOrderId: 'abc',
    orderId: 'kashier-1',
    cardBrand: 'Visa',
    orderReference: 'ref',
    transactionId: 'TX-1',
    amount: '100.00',
    currency: 'EGP',
    mode: 'test',
  }

  it('signs absent params as the literal "null"', () => {
    expect(
      buildRedirectSignaturePayload({ paymentStatus: 'FAILURE' })
    ).toBe(
      'paymentStatus=FAILURE&cardDataToken=null&maskedCard=null&merchantOrderId=null&orderId=null&cardBrand=null&orderReference=null&transactionId=null&amount=null&currency=null'
    )
  })

  it('accepts a valid signature and ignores mode', () => {
    const signature = sign(buildRedirectSignaturePayload(query))
    expect(verifyKashierRedirectSignature({ ...query, signature }, KEY)).toBe(true)
  })

  it('rejects tampered params, wrong key, and a missing signature', () => {
    const signature = sign(buildRedirectSignaturePayload(query))
    expect(
      verifyKashierRedirectSignature(
        { ...query, paymentStatus: 'SUCCESS', amount: '1.00', signature },
        KEY
      )
    ).toBe(false)
    expect(verifyKashierRedirectSignature({ ...query, signature }, 'other')).toBe(false)
    expect(verifyKashierRedirectSignature(query, KEY)).toBe(false)
  })
})

describe('webhook signature', () => {
  const data = {
    amount: 1,
    channel: 'online | e-commerce',
    currency: 'EGP',
    kashierOrderId: '9ad06b17-755b-4e21-9774-aff3e2726ac9',
    merchantOrderId: '1653481557813',
    method: 'card',
    orderReference: 'TEST-ORD-38855',
    status: 'SUCCESS',
    transactionId: 'TX-249893963',
    transactionResponseCode: '00',
    signatureKeys: [
      'transactionResponseCode',
      'status',
      'amount',
      'channel',
      'currency',
      'kashierOrderId',
      'merchantOrderId',
      'method',
      'orderReference',
      'transactionId',
    ],
  }

  it('matches the documented payload example', () => {
    expect(buildWebhookSignaturePayload(data, data.signatureKeys)).toBe(
      'amount=1&channel=online%20%7C%20e-commerce&currency=EGP&kashierOrderId=9ad06b17-755b-4e21-9774-aff3e2726ac9&merchantOrderId=1653481557813&method=card&orderReference=TEST-ORD-38855&status=SUCCESS&transactionId=TX-249893963&transactionResponseCode=00'
    )
  })

  it('accepts a valid signature', () => {
    const signature = sign(buildWebhookSignaturePayload(data, data.signatureKeys))
    expect(verifyKashierWebhookSignature(data, signature, KEY)).toBe(true)
    expect(verifyKashierWebhookSignature(data, signature.toUpperCase(), KEY)).toBe(true)
  })

  it('rejects an invalid signature, tampered data, and missing inputs', () => {
    const signature = sign(buildWebhookSignaturePayload(data, data.signatureKeys))
    expect(verifyKashierWebhookSignature(data, 'deadbeef', KEY)).toBe(false)
    expect(verifyKashierWebhookSignature({ ...data, status: 'FAILURE' }, signature, KEY)).toBe(false)
    expect(verifyKashierWebhookSignature(data, undefined, KEY)).toBe(false)
    expect(verifyKashierWebhookSignature({ ...data, signatureKeys: [] }, signature, KEY)).toBe(false)
    expect(verifyKashierWebhookSignature(data, signature, '')).toBe(false)
  })
})

describe('order reference', () => {
  const orderId = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b'

  it('round-trips and is unique per session', () => {
    const a = buildKashierOrderReference(orderId)
    const b = buildKashierOrderReference(orderId)
    expect(a).not.toBe(b)
    expect(parseKashierOrderReference(a)).toBe(orderId)
  })

  it('rejects foreign references', () => {
    expect(parseKashierOrderReference('1653481557813')).toBeNull()
    expect(parseKashierOrderReference(orderId)).toBeNull()
    expect(parseKashierOrderReference(undefined)).toBeNull()
  })
})

describe('getPaymentProvider', () => {
  it('defaults to kashier and switches to paymob', () => {
    expect(getPaymentProvider(undefined)).toBe('kashier')
    expect(getPaymentProvider('')).toBe('kashier')
    expect(getPaymentProvider('nonsense')).toBe('kashier')
    expect(getPaymentProvider('paymob')).toBe('paymob')
    expect(getPaymentProvider(' Kashier ')).toBe('kashier')
  })
})
