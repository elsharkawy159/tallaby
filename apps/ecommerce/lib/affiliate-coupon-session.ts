import { cookies } from 'next/headers'
import { db, customerSessions, eq } from '@workspace/db'
import { getSessionId } from '@/actions/auth'
import { normalizeCouponCode } from '@/lib/affiliate-coupon.lib'

const LEGACY_PENDING_COUPON_COOKIE = 'pending_coupon'

/**
 * Pending checkout coupon on the customer session (guest + authenticated).
 *
 * Stores only the code string — never a discount amount. Server validation
 * in `validateCoupon` / place-order remains authoritative.
 */

async function readSessionId (): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get('session_id')?.value ?? null
  } catch {
    return null
  }
}

async function clearLegacyPendingCouponCookie (): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(LEGACY_PENDING_COUPON_COOKIE)
  } catch {
    // Cookie writes can fail during static render; session is the source of truth.
  }
}

export async function getPendingCouponCode (): Promise<string | null> {
  try {
    const sessionId = await readSessionId()
    if (!sessionId) return null

    const [row] = await db
      .select({ couponCode: customerSessions.couponCode })
      .from(customerSessions)
      .where(eq(customerSessions.id, sessionId))
      .limit(1)

    return normalizeCouponCode(row?.couponCode)
  } catch (error) {
    console.error('Failed to read pending coupon from session:', error)
    return null
  }
}

export async function setPendingCouponCode (code: string): Promise<boolean> {
  const normalized = normalizeCouponCode(code)
  if (!normalized) return false

  try {
    const sessionId = await getSessionId()
    const now = new Date().toISOString()

    await db
      .insert(customerSessions)
      .values({
        id: sessionId,
        couponCode: normalized,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: customerSessions.id,
        set: {
          couponCode: normalized,
          updatedAt: now,
        },
      })

    await clearLegacyPendingCouponCookie()
    return true
  } catch (error) {
    console.error('Failed to set pending coupon on session:', error)
    return false
  }
}

export async function clearPendingCouponCode (): Promise<void> {
  try {
    const sessionId = await readSessionId()
    if (sessionId) {
      await db
        .update(customerSessions)
        .set({
          couponCode: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(customerSessions.id, sessionId))
    }

    await clearLegacyPendingCouponCookie()
  } catch (error) {
    console.error('Failed to clear pending coupon from session:', error)
  }
}
