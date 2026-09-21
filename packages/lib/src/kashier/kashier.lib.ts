import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Query parameters Kashier signs on the merchantRedirect, in signing order.
 * `signature` and `mode` are never part of the signed body.
 */
const REDIRECT_SIGNATURE_FIELDS = [
  'paymentStatus',
  'cardDataToken',
  'maskedCard',
  'merchantOrderId',
  'orderId',
  'cardBrand',
  'orderReference',
  'transactionId',
  'amount',
  'currency',
] as const

function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a.toLowerCase())
  const right = Buffer.from(b.toLowerCase())
  return left.length === right.length && timingSafeEqual(left, right)
}

/** A parameter absent from the redirect is signed as the literal string "null". */
export function buildRedirectSignaturePayload(
  query: Record<string, string | null | undefined>
): string {
  return REDIRECT_SIGNATURE_FIELDS.map(
    (field) => `${field}=${query[field] ?? 'null'}`
  ).join('&')
}

export function verifyKashierRedirectSignature(
  query: Record<string, string | null | undefined>,
  paymentApiKey: string
): boolean {
  const signature = query.signature
  if (!signature || !paymentApiKey) {
    return false
  }

  return safeEqualHex(
    hmacSha256Hex(paymentApiKey, buildRedirectSignaturePayload(query)),
    signature
  )
}

/**
 * Webhook payload: signatureKeys sorted alphabetically, only the values
 * URL-encoded, joined as key=value with "&".
 */
export function buildWebhookSignaturePayload(
  data: Record<string, unknown>,
  signatureKeys: string[]
): string {
  return [...signatureKeys]
    .sort()
    .map((key) => {
      const value = data[key]
      const text = value === null || value === undefined ? '' : String(value)
      return `${key}=${encodeURIComponent(text)}`
    })
    .join('&')
}

export function verifyKashierWebhookSignature(
  data: Record<string, unknown> | null | undefined,
  signatureHeader: string | null | undefined,
  paymentApiKey: string
): boolean {
  if (!data || !signatureHeader || !paymentApiKey) {
    return false
  }

  const keys = data.signatureKeys
  if (
    !Array.isArray(keys) ||
    keys.length === 0 ||
    !keys.every((key) => typeof key === 'string')
  ) {
    return false
  }

  return safeEqualHex(
    hmacSha256Hex(paymentApiKey, buildWebhookSignaturePayload(data, keys)),
    signatureHeader
  )
}

/** Kashier expects amounts as decimal strings, e.g. "100.00". */
export function formatKashierAmount(amount: string | number): string {
  const numeric = typeof amount === 'string' ? Number.parseFloat(amount) : amount
  return numeric.toFixed(2)
}

/**
 * Kashier rejects a duplicate `order` per merchant, and the payment page can
 * create several sessions for one Tallaby order (retries, re-renders). Each
 * session therefore gets its own reference, which still carries the order id.
 */
export function buildKashierOrderReference(orderId: string): string {
  return `${orderId}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`
}

const ORDER_REFERENCE_PATTERN =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_[0-9a-z]+$/i

export function parseKashierOrderReference(
  reference: string | null | undefined
): string | null {
  const match = reference ? ORDER_REFERENCE_PATTERN.exec(reference) : null
  return match ? match[1]! : null
}
