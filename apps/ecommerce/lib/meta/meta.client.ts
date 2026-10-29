import {
  metaPhoneDigits,
  signupEventParams,
  type SignupMethod,
} from '@workspace/lib/integrations'
import type {
  MetaContentParams,
  MetaStandardEvent,
  TrackMetaEventOptions,
} from './meta.types'

function isBrowser (): boolean {
  return typeof window !== 'undefined'
}

/**
 * Safely fire a Meta Pixel standard event.
 * No-ops on SSR, when fbq is blocked/unavailable, or when the pixel is unset.
 */
export function trackMetaEvent (
  eventName: MetaStandardEvent,
  params?: Partial<MetaContentParams> & Record<string, unknown>,
  options?: TrackMetaEventOptions
): void {
  if (!isBrowser()) return

  try {
    const fbq = window.fbq
    if (typeof fbq !== 'function') return

    if (options?.eventId) {
      fbq('track', eventName, params ?? {}, { eventID: options.eventId })
      return
    }

    fbq('track', eventName, params ?? {})
  } catch {
    // Ad blockers / CSP / unavailable fbq must never break the storefront
  }
}

const SIGNUP_TRACKED_KEY = 'tallaby:meta-signup'

/**
 * Tallaby's CompleteRegistration for a new seller account, once per browser
 * (same event id as the server CAPI event, so Meta keeps one). Re-running
 * `init` with the seller's email/phone is Meta's manual advanced matching;
 * the pixel hashes them before sending.
 */
export function trackSignupComplete (
  eventId: string,
  method: SignupMethod,
  user: { email?: string | null; phone?: string | null }
): void {
  if (!isBrowser()) return
  try {
    if (window.localStorage.getItem(SIGNUP_TRACKED_KEY) === eventId) return
    window.localStorage.setItem(SIGNUP_TRACKED_KEY, eventId)
  } catch {
    // Storage blocked: the shared event id still deduplicates at Meta
  }
  try {
    const fbq = window.fbq
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    if (typeof fbq !== 'function' || !pixelId) return
    const userData: Record<string, string> = {}
    const email = user.email?.trim().toLowerCase()
    const phone = metaPhoneDigits(user.phone)
    if (email) userData.em = email
    if (phone) userData.ph = phone
    if (Object.keys(userData).length) fbq('init', pixelId, userData)
    fbq('track', 'CompleteRegistration', signupEventParams(method), { eventID: eventId })
  } catch {
    // Ad blockers / CSP must never break signup
  }
}
