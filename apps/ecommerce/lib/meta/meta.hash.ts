import { createHash } from 'crypto'

/** Normalize then SHA-256 hash PII for Meta CAPI (hex digest). */
export function hashMetaPii (value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  return createHash('sha256').update(normalized).digest('hex')
}

/** Phone: strip non-digits except leading +, then hash digits-only per Meta guidance. */
export function hashMetaPhone (phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  const digits = phone.replace(/[^\d]/g, '')
  if (!digits) return undefined
  return createHash('sha256').update(digits).digest('hex')
}
