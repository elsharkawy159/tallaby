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
