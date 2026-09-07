import { cookies } from 'next/headers'
import {
  PENDING_COUPON_COOKIE_MAX_AGE,
  PENDING_COUPON_COOKIE_NAME,
  normalizeCouponCode,
} from '@/lib/affiliate-coupon.lib'

/**
 * Pending checkout coupon cookie (guest + authenticated).
 *
 * Stores only the code string — never a discount amount. Server validation
 * in `validateCoupon` / place-order remains authoritative.
 */

export async function getPendingCouponCode (): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return normalizeCouponCode(
      cookieStore.get(PENDING_COUPON_COOKIE_NAME)?.value
    )
  } catch {
    return null
  }
}

export async function setPendingCouponCode (code: string): Promise<boolean> {
  const normalized = normalizeCouponCode(code)
  if (!normalized) return false

  try {
    const cookieStore = await cookies()
    cookieStore.set(PENDING_COUPON_COOKIE_NAME, normalized, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: PENDING_COUPON_COOKIE_MAX_AGE,
      path: '/',
    })
    return true
  } catch (error) {
    console.error('Failed to set pending coupon cookie:', error)
    return false
  }
}

export async function clearPendingCouponCode (): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(PENDING_COUPON_COOKIE_NAME)
  } catch (error) {
    console.error('Failed to clear pending coupon cookie:', error)
  }
}
