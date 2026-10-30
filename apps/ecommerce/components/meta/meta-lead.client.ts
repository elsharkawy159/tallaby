'use client'

import { trackCommerceEvent } from '@/lib/storefront-events.client'
import { DEFAULT_CURRENCY } from '@/lib/constants'

const STORAGE_PREFIX = 'meta_lead_'
const fired = new Set<string>()

/**
 * Store websites: the Meta `Lead` event when the checkout saves a missed
 * order lead (ROADMAP.md F-03 / F-30b). Once per cart (`event_id`) in this
 * browser. The store bus drops it unless the seller switched Lead on, and
 * it reaches only the store's Meta Pixel (GA4 / GTM have no Lead mapping).
 */
export function trackStoreLead (lead: { eventId: string; value: number } | null | undefined): void {
  if (!lead?.eventId || fired.has(lead.eventId)) return
  fired.add(lead.eventId)
  try {
    const key = `${STORAGE_PREFIX}${lead.eventId}`
    if (window.sessionStorage.getItem(key)) return
    window.sessionStorage.setItem(key, '1')
  } catch {
    // Storage blocked: the in-memory guard and the event id still dedupe.
  }
  trackCommerceEvent(
    'Lead',
    { value: Number.isFinite(lead.value) ? lead.value : 0, currency: DEFAULT_CURRENCY },
    { eventId: lead.eventId }
  )
}
