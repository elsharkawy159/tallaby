import { trackTallabySignup, type SignupMethod } from '@workspace/lib/integrations'
import { readTrackingConsent } from '@/lib/tracking-consent.client'
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

/**
 * Tallaby's CompleteRegistration for a new seller account that finished
 * signup in the tallaby.com dialog (same event id as the server CAPI event,
 * so Meta keeps one). No email or phone is sent to the pixel. The helper would
 * load the pixel, so it runs only after the visitor accepted (F-70a).
 */
export function trackSignupComplete (eventId: string, method: SignupMethod): void {
  if (readTrackingConsent() !== 'granted') return
  trackTallabySignup(process.env.NEXT_PUBLIC_META_PIXEL_ID, eventId, method)
}
