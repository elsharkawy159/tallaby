import { FULFILLMENT_SERVICE_TYPES, type FulfillmentServiceType } from './constants'
import { baselineService } from './resolve'
import type { SellerServiceRow, ServiceConfig } from './types'
import type { ServiceChoice, ServiceChoices } from './validate'

/**
 * Pure planning for a seller's fulfillment request from the dashboard
 * (PLAN.md §15, P8-01). Decides, per service, what the upsert writes. It only
 * ever produces `requested_*` values and a review status: `active_*` is copied
 * from the baseline for brand-new rows (exactly what the resolver already uses
 * for a missing row) and otherwise never touched. `activateSellerService`
 * stays the single path that changes what orders run under.
 */

export type ServiceRequestPlan =
  /** No row yet: insert one with baseline active_* and the choice as requested_*. */
  | {
      kind: 'insert'
      serviceType: FulfillmentServiceType
      requested: RequestedValues
      status: 'active' | 'requested'
    }
  /** Row exists and the choice changed: rewrite requested_* (and the status). */
  | {
      kind: 'update'
      serviceType: FulfillmentServiceType
      requested: RequestedValues
      status: 'active' | 'requested'
    }
  /** Same choice as the current request (idempotent re-submit): no write. */
  | { kind: 'unchanged'; serviceType: FulfillmentServiceType }
  /**
   * Paused by an admin and the seller asks for something new. Refused: any
   * status change would un-pause (the resolver treats only `paused` as
   * "fall back to baseline"), which would change live behaviour.
   */
  | { kind: 'blocked'; serviceType: FulfillmentServiceType }

export interface RequestedValues {
  provider: ServiceChoice['provider']
  planId: string | null
  config: ServiceConfig
}

const OPEN_STATUSES = new Set(['requested', 'under_review', 'awaiting_agreement'])

function requestedValues(choice: ServiceChoice): RequestedValues {
  if (choice.provider === 'tallaby') return { provider: 'tallaby', planId: choice.planId, config: {} }
  const config: ServiceConfig = {}
  if (choice.config?.mode) config.mode = choice.config.mode
  if (choice.config?.mode === 'external_courier' && choice.config.courierName) {
    config.courierName = choice.config.courierName
  }
  return { provider: 'seller', planId: null, config }
}

/**
 * Same provider, same plan, and for seller-handled services the same delivery
 * mode/courier. Stricter than `choiceMatchesService`, which ignores seller
 * config: switching own riders -> courier is a change the team must see.
 */
function sameService(
  a: { provider: string; planId: string | null; config: ServiceConfig },
  b: { provider: string; planId: string | null; config: ServiceConfig },
): boolean {
  if (a.provider !== b.provider) return false
  if (a.provider === 'tallaby') return a.planId === b.planId
  return (a.config.mode ?? null) === (b.config.mode ?? null) &&
    (a.config.courierName ?? null) === (b.config.courierName ?? null)
}

export function planServiceRequests(
  existing: readonly SellerServiceRow[],
  services: ServiceChoices,
  baselineDeliveryPlanId: string,
): ServiceRequestPlan[] {
  const byType = new Map(existing.map((row) => [row.serviceType, row]))

  return FULFILLMENT_SERVICE_TYPES.map((serviceType): ServiceRequestPlan => {
    const requested = requestedValues(services[serviceType])
    const row = byType.get(serviceType)

    if (!row) {
      const baseline = baselineService(serviceType, baselineDeliveryPlanId)
      return {
        kind: 'insert',
        serviceType,
        requested,
        status: sameService(requested, baseline) ? 'active' : 'requested',
      }
    }

    const current = { provider: row.requestedProvider, planId: row.requestedPlanId, config: row.requestedConfig }
    if (sameService(requested, current)) return { kind: 'unchanged', serviceType }
    if (row.status === 'paused') return { kind: 'blocked', serviceType }

    // Back to what is already live withdraws the request; anything else is a
    // new request for the team. active_* is never written here.
    const live = { provider: row.activeProvider, planId: row.activePlanId, config: row.activeConfig }
    return {
      kind: 'update',
      serviceType,
      requested,
      status: sameService(requested, live) ? 'active' : 'requested',
    }
  })
}

/** The profile review status after a request: reopened when something is open again. */
export function nextReviewStatus(
  current: 'pending_contact' | 'contacted' | 'configured' | null,
  statuses: readonly string[],
): 'pending_contact' | 'contacted' | 'configured' {
  const open = statuses.some((status) => OPEN_STATUSES.has(status))
  if (!open) return 'configured'
  if (!current || current === 'configured') return 'pending_contact'
  return current
}
