'use client'

import { isMarketplaceHost } from '@workspace/lib/storefront'
import { trackMetaEvent } from '@/lib/meta/meta.client'
import type { MetaContentParams, MetaStandardEvent, TrackMetaEventOptions } from '@/lib/meta/meta.types'

/**
 * One call per commerce event (PLAN.md P7-04): ViewContent, AddToCart,
 * InitiateCheckout, Purchase.
 *
 * - Marketplace host: Tallaby's Meta pixel, exactly as before.
 * - Store host: the store's own apps (Meta Pixel, GA4, GTM dataLayer), once
 *   the visitor accepted and the trackers are loaded. Events fired earlier
 *   (a Purchase on first paint, or before Accept) wait in memory for this
 *   page and are sent then; if the visitor declines they are never sent.
 */

type Params = Partial<MetaContentParams> & Record<string, unknown>

type QueuedEvent = { name: MetaStandardEvent; params: Params; options?: TrackMetaEventOptions }

/** `metaBlocked`: Meta events this store does not send (F-30), set before `ready`. */
type Bus = { ready: boolean; queue: QueuedEvent[]; metaBlocked?: Set<string> }

declare global {
  interface Window {
    __tallabyStoreEvents?: Bus
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const GA4_EVENT: Partial<Record<MetaStandardEvent, string>> = {
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
}

function bus (): Bus {
  window.__tallabyStoreEvents ??= { ready: false, queue: [] }
  return window.__tallabyStoreEvents
}

/** GA4 / GTM ecommerce payload for a Meta-shaped event. */
export function toGa4Ecommerce (params: Params, options?: TrackMetaEventOptions) {
  const ids = Array.isArray(params.content_ids) ? (params.content_ids as string[]) : []
  return {
    currency: params.currency,
    value: typeof params.value === 'number' ? params.value : undefined,
    ...(options?.eventId ? { transaction_id: options.eventId } : {}),
    items: ids.map((id) => ({ item_id: id })),
  }
}

function dispatch ({ name, params, options }: QueuedEvent) {
  // The store's Meta event toggles and Purchase-on-delivery (F-30) apply to
  // its Meta Pixel only; GA4 / GTM keep their events.
  if (!bus().metaBlocked?.has(name)) trackMetaEvent(name, params, options)
  const ga4Name = GA4_EVENT[name]
  if (!ga4Name) return
  const ecommerce = toGa4Ecommerce(params, options)
  try {
    if (typeof window.gtag === 'function') window.gtag('event', ga4Name, ecommerce)
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ ecommerce: null })
      window.dataLayer.push({ event: ga4Name, ecommerce })
    }
  } catch {
    // A blocked tracker must never break the store.
  }
}

export function trackCommerceEvent (
  name: MetaStandardEvent,
  params: Params,
  options?: TrackMetaEventOptions
): void {
  if (typeof window === 'undefined') return
  if (isMarketplaceHost(window.location.host)) {
    trackMetaEvent(name, params, options)
    return
  }
  const events = bus()
  if (events.ready) dispatch({ name, params, options })
  else events.queue.push({ name, params, options })
}

/**
 * Called by the store's tracker before `markStoreTrackingReady`: the Meta
 * events this store's Pixel must not send (switched off in the dashboard, or
 * Purchase when it is sent on delivery). Server-computed; never client input.
 */
export function setStoreMetaBlockedEvents (blocked: readonly string[] | undefined): void {
  bus().metaBlocked = new Set(blocked ?? [])
}

/** Called by the store's tracker once its scripts are in place. */
export function markStoreTrackingReady (): void {
  const events = bus()
  events.ready = true
  for (const event of events.queue.splice(0)) dispatch(event)
}
