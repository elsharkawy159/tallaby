import { FULFILLMENT_SERVICE_TYPES, type FulfillmentServiceType } from './constants'
import type {
  EffectiveFulfillment,
  EffectiveService,
  SellerServiceRow,
  ServiceConfig,
} from './types'
import type { ServiceChoice } from './validate'

/**
 * What a service runs under before any Tallaby service is activated for the
 * seller: today's behavior. The seller stores, packs, answers customers and
 * handles returns; delivery goes through Tallaby's existing standard flow
 * (checkout bills Tallaby's governorate rates, the shipping app dispatches).
 */
export function baselineService(
  serviceType: FulfillmentServiceType,
  baselineDeliveryPlanId: string,
  options: { sellerRidersAllowed?: boolean } = {},
): EffectiveService {
  if (serviceType === 'delivery') {
    return {
      provider: 'tallaby',
      planId: baselineDeliveryPlanId,
      config: { legacy: true, sellerRidersAllowed: options.sellerRidersAllowed ?? false },
    }
  }
  return { provider: 'seller', planId: null, config: {} }
}

/**
 * The configuration orders should actually run under, per service.
 *
 * Only `active_*` columns count - a pending request never changes behavior.
 * A missing row or a `paused` service falls back to the baseline. Future
 * shipping/billing wiring must go through this function rather than reading
 * the table directly, so "requested != active" is enforced in one place.
 */
export function resolveEffectiveFulfillment(
  rows: readonly SellerServiceRow[],
  baselineDeliveryPlanId: string,
): EffectiveFulfillment {
  const byType = new Map(rows.map((row) => [row.serviceType, row]))
  const result = {} as EffectiveFulfillment

  for (const serviceType of FULFILLMENT_SERVICE_TYPES) {
    const row = byType.get(serviceType)
    result[serviceType] =
      !row || row.status === 'paused'
        ? baselineService(serviceType, baselineDeliveryPlanId)
        : { provider: row.activeProvider, planId: row.activePlanId, config: row.activeConfig }
  }

  return result
}

/** A requested choice matches what is already live, so it needs no admin step. */
export function choiceMatchesService(choice: ServiceChoice, live: EffectiveService): boolean {
  if (choice.provider !== live.provider) return false
  if (choice.provider === 'tallaby') return choice.planId === live.planId
  return true
}

export interface InitialServiceRow {
  serviceType: FulfillmentServiceType
  requestedProvider: ServiceChoice['provider']
  requestedPlanId: string | null
  requestedConfig: ServiceConfig
  activeProvider: EffectiveService['provider']
  activePlanId: string | null
  activeConfig: ServiceConfig
  status: 'active' | 'requested'
}

/**
 * Rows written at onboarding. Active = baseline (orders keep working exactly as
 * today); requested = the seller's choice. A choice that equals the baseline is
 * active immediately; anything else waits for Tallaby to contact the seller.
 */
export function buildInitialServiceRows(
  services: Record<FulfillmentServiceType, ServiceChoice>,
  baselineDeliveryPlanId: string,
): InitialServiceRow[] {
  return FULFILLMENT_SERVICE_TYPES.map((serviceType) => {
    const choice = services[serviceType]
    // Active = baseline only. Nothing from the request (e.g. own riders)
    // reaches active_* until an admin activates it.
    const baseline = baselineService(serviceType, baselineDeliveryPlanId)
    const requestedConfig = choice.config ?? {}
    return {
      serviceType,
      requestedProvider: choice.provider,
      requestedPlanId: choice.provider === 'tallaby' ? choice.planId : null,
      requestedConfig,
      activeProvider: baseline.provider,
      activePlanId: baseline.planId,
      activeConfig: baseline.config,
      status: choiceMatchesService(choice, baseline) ? 'active' : 'requested',
    }
  })
}
