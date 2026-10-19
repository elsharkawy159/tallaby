import {
  FULFILLMENT_REVIEW_STATUSES,
  FULFILLMENT_SERVICE_TYPES,
  type FulfillmentProvider,
  type FulfillmentReviewStatus,
  type FulfillmentServiceStatus,
  type FulfillmentServiceType,
} from './constants'

/**
 * Admin fulfillment queue: one row per seller (docs/admin-saas.md §3.1).
 * Pure helpers only; the query lives in queue.server.ts.
 */

/** Statuses an admin still has to act on. */
export const OPEN_FULFILLMENT_STATUSES = ['requested', 'under_review', 'awaiting_agreement'] as const satisfies readonly FulfillmentServiceStatus[]

export const FULFILLMENT_QUEUE_STATES = ['open', 'active', 'all'] as const
export type FulfillmentQueueState = (typeof FULFILLMENT_QUEUE_STATES)[number]

export const FULFILLMENT_QUEUE_PAGE_SIZE = 25

export interface FulfillmentQueueFilters {
  state: FulfillmentQueueState
  service: FulfillmentServiceType | null
  review: FulfillmentReviewStatus | null
  q: string | null
  page: number
}

export interface FulfillmentQueueService {
  serviceType: FulfillmentServiceType
  status: FulfillmentServiceStatus
  requestedProvider: FulfillmentProvider
  activeProvider: FulfillmentProvider
  requestedAt: string | null
}

/** One chip per service type, in the fixed order; `null` means not requested. */
export type FulfillmentServiceChip = { serviceType: FulfillmentServiceType; service: FulfillmentQueueService | null }

export function isOpenFulfillmentStatus(status: FulfillmentServiceStatus): boolean {
  return (OPEN_FULFILLMENT_STATUSES as readonly string[]).includes(status)
}

/** Raw URL params → safe filters. Unknown values fall back to the defaults. */
export function parseFulfillmentQueueFilters(params: Record<string, string | string[] | undefined>): FulfillmentQueueFilters {
  const one = (key: string) => {
    const value = params[key]
    return (Array.isArray(value) ? value[0] : value)?.trim() || null
  }
  const state = one('state')
  const service = one('service')
  const review = one('review')
  const q = one('q')
  const page = Number.parseInt(one('page') ?? '1', 10)
  return {
    state: (FULFILLMENT_QUEUE_STATES as readonly string[]).includes(state ?? '') ? (state as FulfillmentQueueState) : 'open',
    service: (FULFILLMENT_SERVICE_TYPES as readonly string[]).includes(service ?? '') ? (service as FulfillmentServiceType) : null,
    review: (FULFILLMENT_REVIEW_STATUSES as readonly string[]).includes(review ?? '') ? (review as FulfillmentReviewStatus) : null,
    q: q ? q.slice(0, 100) : null,
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1,
  }
}

/** Filters → URL query string (defaults omitted), for links that keep the current queue view. */
export function fulfillmentQueueQuery(filters: Partial<FulfillmentQueueFilters>): string {
  const query = new URLSearchParams()
  if (filters.state && filters.state !== 'open') query.set('state', filters.state)
  if (filters.service) query.set('service', filters.service)
  if (filters.review) query.set('review', filters.review)
  if (filters.q) query.set('q', filters.q)
  if (filters.page && filters.page > 1) query.set('page', String(filters.page))
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export function serviceChips(services: readonly FulfillmentQueueService[]): FulfillmentServiceChip[] {
  const byType = new Map(services.map((service) => [service.serviceType, service]))
  return FULFILLMENT_SERVICE_TYPES.map((serviceType) => ({ serviceType, service: byType.get(serviceType) ?? null }))
}

/** "3 d", "5 h", "12 min"; empty for no date. */
export function formatAge(value: string | null, now: Date = new Date()): string {
  if (!value) return ''
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(value).getTime()) / 60_000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours} h`
  return `${Math.floor(hours / 24)} d`
}

/** The sellers before and after `sellerId` in an ordered id list (queue navigation). */
export function queueNeighbours(ids: readonly string[], sellerId: string): { previous: string | null; next: string | null; position: number | null } {
  const index = ids.indexOf(sellerId)
  if (index < 0) return { previous: null, next: null, position: null }
  return { previous: ids[index - 1] ?? null, next: ids[index + 1] ?? null, position: index + 1 }
}
