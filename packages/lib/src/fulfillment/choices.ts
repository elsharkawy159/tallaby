import { BASELINE_DELIVERY_PLAN_CODE, FULFILLMENT_SERVICE_TYPES, type FulfillmentServiceType } from './constants'
import { plansForService } from './plan-view'
import type { FulfillmentPlanView } from './types'
import type { ServiceChoice, ServiceChoices } from './validate'

/**
 * Pure helpers for the seller's service choice UI. Shared by the ecommerce
 * onboarding wizard and the dashboard request flow (PLAN.md §15, P8-01), so
 * both offer exactly the same options.
 */

/** First active plan for a service (admin sort order), or null if Tallaby doesn't offer it yet. */
export function defaultPlanId(
  plans: readonly FulfillmentPlanView[],
  serviceType: FulfillmentServiceType,
): string | null {
  return plansForService(plans, serviceType)[0]?.id ?? null
}

export function tallabyAvailable(
  plans: readonly FulfillmentPlanView[],
  serviceType: FulfillmentServiceType,
): boolean {
  return plansForService(plans, serviceType).length > 0
}

/** Tallaby choice that keeps an already-selected, still-available plan. */
export function tallabyChoice(
  plans: readonly FulfillmentPlanView[],
  serviceType: FulfillmentServiceType,
  current?: ServiceChoice,
): ServiceChoice {
  const available = plansForService(plans, serviceType)
  const keep = current?.provider === 'tallaby' && available.some((p) => p.id === current.planId)
  return {
    provider: 'tallaby',
    planId: keep ? current!.planId : (available[0]?.id ?? null),
  }
}

/** "Let Tallaby handle fulfillment": every service with Tallaby. */
export function tallabyPreset(
  plans: readonly FulfillmentPlanView[],
  current: ServiceChoices,
): ServiceChoices {
  return Object.fromEntries(
    FULFILLMENT_SERVICE_TYPES.map((type) => [type, tallabyChoice(plans, type, current[type])]),
  ) as ServiceChoices
}

/**
 * Starting point for "I want to manage fulfillment": how sellers operate today
 * (they store, pack, answer customers and handle returns; Tallaby's standard
 * delivery ships the orders). Everything stays editable.
 */
export function sellerManagedPreset(plans: readonly FulfillmentPlanView[]): ServiceChoices {
  const seller: ServiceChoice = { provider: 'seller', planId: null }
  const deliveryPlans = plansForService(plans, 'delivery')
  const standard = deliveryPlans.find((p) => p.code === BASELINE_DELIVERY_PLAN_CODE) ?? deliveryPlans[0]
  return {
    storage: seller,
    packaging: seller,
    delivery: standard ? { provider: 'tallaby', planId: standard.id } : seller,
    customer_service: seller,
    returns: seller,
  }
}

/** True when Tallaby offers an active plan for every service. */
export function tallabyAvailableEverywhere(plans: readonly FulfillmentPlanView[]): boolean {
  return FULFILLMENT_SERVICE_TYPES.every((type) => tallabyAvailable(plans, type))
}

/** Removes plan/config noise that doesn't apply to the chosen provider. */
export function normalizeServiceChoices(services: ServiceChoices): ServiceChoices {
  const out = { ...services }
  for (const key of FULFILLMENT_SERVICE_TYPES) {
    const choice = out[key]
    if (choice.provider === 'seller') {
      const mode = key === 'delivery' ? choice.config?.mode : undefined
      const courierName = mode === 'external_courier' ? choice.config?.courierName?.trim() : undefined
      out[key] = {
        provider: 'seller',
        planId: null,
        ...(mode ? { config: { mode, ...(courierName ? { courierName } : {}) } } : {}),
      }
    } else {
      out[key] = { provider: 'tallaby', planId: choice.planId }
    }
  }
  return out
}
