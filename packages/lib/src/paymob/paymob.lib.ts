import { createHmac } from 'crypto'
import type { PaymobBillingData, PaymobTransactionObj } from './paymob.types'

export const PAYMOB_EGYPT_BASE_URL = 'https://accept.paymob.com'

const TRANSACTION_HMAC_FIELD_ORDER = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
] as const

function getNestedValue(obj: PaymobTransactionObj, path: string): string {
  if (path === 'order.id') {
    return String(obj.order?.id ?? '')
  }

  if (path.startsWith('source_data.')) {
    const key = path.replace('source_data.', '') as keyof PaymobTransactionObj['source_data']
    return String(obj.source_data?.[key] ?? '')
  }

  const value = obj[path as keyof PaymobTransactionObj]
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

export function buildTransactionHmacPayload(obj: PaymobTransactionObj): string {
  return TRANSACTION_HMAC_FIELD_ORDER.map((field) => getNestedValue(obj, field)).join('')
}

export function verifyPaymobTransactionHmac(
  obj: PaymobTransactionObj,
  hmac: string,
  secret: string
): boolean {
  if (!hmac || !secret) {
    return false
  }

  const payload = buildTransactionHmacPayload(obj)
  const computed = createHmac('sha512', secret).update(payload).digest('hex')

  return computed.toLowerCase() === hmac.toLowerCase()
}

export function amountToCents(amount: string | number): number {
  const numeric = typeof amount === 'string' ? Number.parseFloat(amount) : amount
  return Math.round(numeric * 100)
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  if (!trimmed) {
    return { firstName: 'Customer', lastName: 'Customer' }
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: parts[0]! }
  }

  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(' '),
  }
}

export function buildBillingData(input: {
  fullName: string
  phone: string
  email: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  country?: string | null
  postalCode?: string | null
  shippingMethod?: string | null
}): PaymobBillingData {
  const { firstName, lastName } = splitFullName(input.fullName)
  const country = normalizeCountryCode(input.country)

  return {
    first_name: firstName,
    last_name: lastName,
    phone_number: normalizePhoneNumber(input.phone),
    email: input.email || 'customer@tallaby.com',
    street: input.addressLine1,
    building: 'NA',
    floor: 'NA',
    apartment: input.addressLine2?.trim() || 'NA',
    city: input.city,
    country,
    state: input.state || input.city,
    postal_code: input.postalCode?.trim() || '00000',
    shipping_method: input.shippingMethod?.trim() || 'PKG',
  }
}

function normalizeCountryCode(country?: string | null): string {
  const value = (country || 'Egypt').trim().toLowerCase()

  if (value === 'eg' || value === 'egy' || value === 'egypt') {
    return 'EGY'
  }

  if (value.length === 3) {
    return value.toUpperCase()
  }

  return 'EGY'
}

function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.trim()
  if (!trimmed) {
    return '+201000000000'
  }

  if (trimmed.startsWith('+')) {
    return trimmed
  }

  if (trimmed.startsWith('0')) {
    return `+2${trimmed}`
  }

  return `+${trimmed}`
}
