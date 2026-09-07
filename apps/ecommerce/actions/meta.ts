'use server'

import { cookies } from 'next/headers'
import { sendMetaCapiEvent } from '@/lib/meta/meta.server'
import { getMetaCapiUserData } from '@/lib/meta/meta.user'
import { toMetaContentIds } from '@/lib/meta/meta.product'
import { DEFAULT_CURRENCY } from '@/lib/constants'

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 // 24h

function initiateCheckoutCookieName (cartId: string): string {
  // Cookie-name safe: strip hyphens from UUID
  return `meta_ic_${cartId.replace(/-/g, '')}`
}

export interface TrackMetaInitiateCheckoutInput {
  cartId: string
  productIds: string[]
  value: number
  numItems: number
  currency?: string
}

/**
 * One-shot InitiateCheckout CAPI for a cart.
 * event_id = cartId (must match Pixel). Skips if this cart was already sent
 * (httpOnly cookie gate) so RSC prefetch / remounts cannot spam Meta.
 */
export async function trackMetaInitiateCheckoutAction (
  input: TrackMetaInitiateCheckoutInput
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const cartId = input.cartId?.trim()
  if (!cartId || !input.productIds?.length) {
    return { success: false, error: 'Missing cart or products' }
  }

  try {
    const cookieStore = await cookies()
    const cookieName = initiateCheckoutCookieName(cartId)

    if (cookieStore.get(cookieName)?.value === '1') {
      return { success: true, skipped: true }
    }

    // Claim before send to reduce parallel double-fire races
    cookieStore.set(cookieName, '1', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === 'production',
    })

    const { userData, eventSourceUrl } = await getMetaCapiUserData()
    const currency = input.currency || DEFAULT_CURRENCY

    const result = await sendMetaCapiEvent({
      eventName: 'InitiateCheckout',
      eventId: cartId,
      eventSourceUrl: eventSourceUrl ?? undefined,
      userData,
      customData: {
        content_ids: toMetaContentIds(input.productIds),
        content_type: 'product',
        value: Number.isFinite(input.value) ? input.value : 0,
        currency,
        num_items: input.numItems,
      },
    })

    return result
  } catch (error) {
    console.error('Meta CAPI InitiateCheckout action failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'InitiateCheckout failed',
    }
  }
}
