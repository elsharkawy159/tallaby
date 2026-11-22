'use client'

import { isMarketplaceHost } from '@workspace/lib/storefront'
import { trackMetaEvent } from '@/lib/meta/meta.client'
import type { MetaContentParams, MetaStandardEvent, TrackMetaEventOptions } from '@/lib/meta/meta.types'

/**
 * One call per commerce event (PLAN.md P7-04): ViewContent, AddToCart,
 * InitiateCheckout, Purchase.
 *
 * - Marketplace host: Tallaby's Meta pixel, exactly as before.
 * - Store host: the store's own apps (Meta Pixel, GA4, GTM dataLayer, TikTok
 *   Pixel, Snap Pixel), once
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
    ttq?: { track?: (event: string, properties?: Record<string, unknown>, options?: { event_id: string }) => void }
    snaptr?: (...args: unknown[]) => void
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

// F-103: the commerce events only. PageView is the pixels' own (TikTok follows
// SPA navigation itself; Snap's is sent by SellerTracking), and Lead stays
// off, as it is by default for the store's Meta Pixel (F-30).
const TIKTOK_EVENT: Partial<Record<MetaStandardEvent, string>> = {
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout',
  Purchase: 'Purchase',
}

const SNAP_EVENT: Partial<Record<MetaStandardEvent, string>> = {
  ViewContent: 'VIEW_CONTENT',
  AddToCart: 'ADD_CART',
  InitiateCheckout: 'START_CHECKOUT',
  Purchase: 'PURCHASE',
}

function contentIds (params: Params): string[] {
  return Array.isArray(params.content_ids) ? params.content_ids.filter((id): id is string => typeof id === 'string') : []
}

function finiteNumber (value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** TikTok Pixel `ttq.track(event, properties, options)` for a Meta-shaped event, or null when TikTok gets none. */
export function toTiktokEvent (name: MetaStandardEvent, params: Params, options?: TrackMetaEventOptions) {
  const event = TIKTOK_EVENT[name]
  if (!event) return null
  const lines = Array.isArray(params.contents) ? params.contents : null
  const contents = lines
    ? lines.map((line) => ({
      content_id: line.id,
      ...(finiteNumber(line.quantity) !== undefined ? { quantity: line.quantity } : {}),
      ...(finiteNumber(line.item_price) !== undefined ? { price: line.item_price } : {}),
    }))
    : contentIds(params).map((id) => ({ content_id: id }))
  const value = finiteNumber(params.value)
  const numItems = finiteNumber(params.num_items)
  const properties: Record<string, unknown> = {
    contents,
    content_type: 'product',
    content_ids: contents.map((line) => line.content_id),
    ...(value !== undefined ? { value } : {}),
    ...(typeof params.currency === 'string' && params.currency ? { currency: params.currency } : {}),
    ...(numItems !== undefined ? { num_items: numItems } : {}),
  }
  return { event, properties, ...(options?.eventId ? { options: { event_id: options.eventId } } : {}) }
}

/** Snap Pixel `snaptr('track', event, params)` for a Meta-shaped event, or null when Snap gets none. */
export function toSnapEvent (name: MetaStandardEvent, params: Params, options?: TrackMetaEventOptions) {
  const event = SNAP_EVENT[name]
  if (!event) return null
  const ids = Array.isArray(params.contents) ? params.contents.map((line) => line.id) : contentIds(params)
  const price = finiteNumber(params.value)
  const numItems = finiteNumber(params.num_items)
  const snapParams: Record<string, unknown> = {
    ...(ids.length ? { item_ids: ids } : {}),
    ...(price !== undefined ? { price } : {}),
    ...(typeof params.currency === 'string' && params.currency ? { currency: params.currency } : {}),
    ...(numItems !== undefined ? { number_items: numItems } : {}),
    // Purchase's event id is the order id (MetaPurchase).
    ...(event === 'PURCHASE' && options?.eventId ? { transaction_id: options.eventId } : {}),
    ...(options?.eventId ? { client_dedup_id: options.eventId } : {}),
  }
  return { event, params: snapParams }
}

function sendTiktok (name: MetaStandardEvent, params: Params, options?: TrackMetaEventOptions) {
  try {
    const track = window.ttq?.track
    if (typeof track !== 'function') return
    const mapped = toTiktokEvent(name, params, options)
    if (!mapped) return
    if (mapped.options) track.call(window.ttq, mapped.event, mapped.properties, mapped.options)
    else track.call(window.ttq, mapped.event, mapped.properties)
  } catch {
    // A blocked tracker must never break the store.
  }
}

function sendSnap (name: MetaStandardEvent, params: Params, options?: TrackMetaEventOptions) {
  try {
    if (typeof window.snaptr !== 'function') return
    const mapped = toSnapEvent(name, params, options)
    if (mapped) window.snaptr('track', mapped.event, mapped.params)
  } catch {
    // A blocked tracker must never break the store.
  }
}

function dispatch ({ name, params, options }: QueuedEvent) {
  // The store's Meta event toggles and Purchase-on-delivery (F-30) apply to
  // its Meta Pixel only; GA4 / GTM / TikTok / Snap keep their events.
  if (!bus().metaBlocked?.has(name)) trackMetaEvent(name, params, options)
  sendTiktok(name, params, options)
  sendSnap(name, params, options)
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
