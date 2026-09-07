'use server'

import {
  clearPendingCouponCode,
  getPendingCouponCode,
  setPendingCouponCode,
} from '@/lib/affiliate-coupon-cookie'
import { normalizeCouponCode } from '@/lib/affiliate-coupon.lib'

/**
 * Persist a coupon captured from `?coupon=` (or a manual apply) into the
 * pending-coupon cookie. Does not validate eligibility — that happens when
 * checkout / place-order applies the code.
 */
export async function persistPendingCouponAction (
  rawCode: string
): Promise<{ success: true; code: string } | { success: false }> {
  const code = normalizeCouponCode(rawCode)
  if (!code) return { success: false }

  const saved = await setPendingCouponCode(code)
  if (!saved) return { success: false }

  return { success: true, code }
}

export async function getPendingCouponAction (): Promise<string | null> {
  return getPendingCouponCode()
}

export async function clearPendingCouponAction (): Promise<void> {
  await clearPendingCouponCode()
}
