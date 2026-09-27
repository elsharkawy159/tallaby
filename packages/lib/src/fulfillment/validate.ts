import { z } from 'zod'
import { CAIRO_ORIGIN_RATES } from '../shipping/shipping-rates'
import {
  DAILY_ORDER_RANGES,
  FULFILLMENT_MODELS,
  FULFILLMENT_PROVIDERS,
  FULFILLMENT_SERVICE_TYPES,
  INVENTORY_UNIT_RANGES,
  PRODUCT_SIZE_CATEGORIES,
  SELLER_DELIVERY_MODES,
  SKU_RANGES,
  type FulfillmentServiceType,
} from './constants'
import type { FulfillmentPlanView } from './types'

/**
 * Validation for the seller's fulfillment request (onboarding and, later,
 * change requests). Error messages are stable codes, not prose: the UI maps
 * them to translated strings (`onboarding.errors.<code>`), and the server
 * returns them unchanged.
 */

const GOVERNORATES = Object.keys(CAIRO_ORIGIN_RATES) as [string, ...string[]]

export const governorateSchema = z.enum(GOVERNORATES, { message: 'governorate_invalid' })

export const EGYPT_MOBILE_REGEX = /^(?:\+20|20|0)?1[0125][0-9]{8}$/

export const pickupAddressSchema = z.object({
  governorate: governorateSchema,
  city: z.string().trim().min(2, 'city_required').max(100, 'too_long'),
  street: z.string().trim().min(5, 'street_required').max(200, 'too_long'),
  landmark: z.string().trim().max(200, 'too_long').optional(),
  contactName: z.string().trim().max(100, 'too_long').optional(),
  contactPhone: z.string().trim().regex(EGYPT_MOBILE_REGEX, 'phone_invalid'),
})
export type PickupAddress = z.infer<typeof pickupAddressSchema>

export const serviceConfigSchema = z.object({
  mode: z.enum(SELLER_DELIVERY_MODES).optional(),
  courierName: z.string().trim().max(100, 'too_long').optional(),
})

export const serviceChoiceSchema = z.object({
  provider: z.enum(FULFILLMENT_PROVIDERS),
  planId: z.string().uuid().nullable(),
  config: serviceConfigSchema.optional(),
})
export type ServiceChoice = z.infer<typeof serviceChoiceSchema>

export const servicesSchema = z.object({
  storage: serviceChoiceSchema,
  packaging: serviceChoiceSchema,
  delivery: serviceChoiceSchema,
  customer_service: serviceChoiceSchema,
  returns: serviceChoiceSchema,
})
export type ServiceChoices = z.infer<typeof servicesSchema>

export const operationalDetailsSchema = z.object({
  estimatedSkus: z.enum(SKU_RANGES, { message: 'required' }),
  estimatedDailyOrders: z.enum(DAILY_ORDER_RANGES, { message: 'required' }),
  sizeCategory: z.enum(PRODUCT_SIZE_CATEGORIES, { message: 'required' }),
  hasFragileProducts: z.boolean({ message: 'required' }),
  estimatedInventoryUnits: z.enum(INVENTORY_UNIT_RANGES).optional(),
  specialPackagingNotes: z.string().trim().max(500, 'too_long').optional(),
  coverageGovernorates: z.array(governorateSchema).max(GOVERNORATES.length).optional(),
})
export type OperationalDetails = z.infer<typeof operationalDetailsSchema>

/**
 * Sellers using Tallaby storage bring their inventory to Tallaby's warehouse
 * themselves; Tallaby never collects inventory. Orders then ship from the
 * warehouse, so no seller pickup address is needed.
 */
export function requiresInventoryDropOff(services: ServiceChoices): boolean {
  return services.storage.provider === 'tallaby'
}

/**
 * Whether Tallaby must physically collect from the seller's location: the
 * seller keeps the stock and Tallaby packs orders, delivers them, or brings
 * returns back to the seller. Customer service alone needs no address.
 */
export function requiresPickupAddress(services: ServiceChoices): boolean {
  if (requiresInventoryDropOff(services)) return false
  return (['packaging', 'delivery', 'returns'] as const).some(
    (type) => services[type].provider === 'tallaby',
  )
}

type Issue = { path: (string | number)[]; message: string }

/** Catalog-independent cross-field rules. */
export function collectRequestIssues(input: {
  model: (typeof FULFILLMENT_MODELS)[number]
  services: ServiceChoices
  details: OperationalDetails
  pickupAddress?: PickupAddress | null
}): Issue[] {
  const issues: Issue[] = []
  const { model, services, details } = input

  for (const type of FULFILLMENT_SERVICE_TYPES) {
    const choice = services[type]
    if (choice.provider === 'tallaby' && !choice.planId) {
      issues.push({ path: ['services', type, 'planId'], message: 'plan_required' })
    }
    if (choice.provider === 'seller' && choice.planId) {
      issues.push({ path: ['services', type, 'planId'], message: 'plan_not_allowed' })
    }
  }

  if (model === 'tallaby_fulfillment') {
    for (const type of FULFILLMENT_SERVICE_TYPES) {
      if (services[type].provider !== 'tallaby') {
        issues.push({ path: ['services', type, 'provider'], message: 'tallaby_model_requires_tallaby' })
      }
    }
  }

  if (services.delivery.provider === 'seller' && !services.delivery.config?.mode) {
    issues.push({ path: ['services', 'delivery', 'config', 'mode'], message: 'delivery_mode_required' })
  }

  if (services.storage.provider === 'tallaby' && !details.estimatedInventoryUnits) {
    issues.push({ path: ['details', 'estimatedInventoryUnits'], message: 'required' })
  }

  if (requiresPickupAddress(services) && !input.pickupAddress) {
    issues.push({ path: ['pickupAddress'], message: 'pickup_address_required' })
  }

  return issues
}

export const fulfillmentRequestSchema = z
  .object({
    model: z.enum(FULFILLMENT_MODELS, { message: 'required' }),
    services: servicesSchema,
    details: operationalDetailsSchema,
    pickupAddress: pickupAddressSchema.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    for (const issue of collectRequestIssues(value)) {
      ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message })
    }
  })
export type FulfillmentRequest = z.infer<typeof fulfillmentRequestSchema>

/**
 * Catalog rules, checked server-side against the live `fulfillment_plans`
 * rows: every requested plan must exist, be active, and belong to the service
 * it was chosen for.
 */
export function collectCatalogIssues(
  services: ServiceChoices,
  plans: readonly Pick<FulfillmentPlanView, 'id' | 'serviceType' | 'isActive'>[],
): Issue[] {
  const byId = new Map(plans.map((plan) => [plan.id, plan]))
  const issues: Issue[] = []

  for (const type of FULFILLMENT_SERVICE_TYPES) {
    const planId = services[type].planId
    if (!planId) continue
    const plan = byId.get(planId)
    if (!plan || !plan.isActive || plan.serviceType !== (type as FulfillmentServiceType)) {
      issues.push({ path: ['services', type, 'planId'], message: 'plan_unavailable' })
    }
  }

  return issues
}

/** Choices that make "Let Tallaby handle fulfillment" true: Tallaby everywhere. */
export function isFullTallabyFulfillment(services: ServiceChoices): boolean {
  return FULFILLMENT_SERVICE_TYPES.every((type) => services[type].provider === 'tallaby')
}
