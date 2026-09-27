import { describe, expect, it } from 'vitest'
import {
  fulfillmentAgreementStatus,
  fulfillmentModel,
  fulfillmentProvider,
  fulfillmentReviewStatus,
  fulfillmentServiceStatus,
  fulfillmentServiceType,
} from '@workspace/db/schema'
import {
  FULFILLMENT_AGREEMENT_STATUSES,
  FULFILLMENT_MODELS,
  FULFILLMENT_PROVIDERS,
  FULFILLMENT_REVIEW_STATUSES,
  FULFILLMENT_SERVICE_STATUSES,
  FULFILLMENT_SERVICE_TYPES,
} from './constants'
import { feeTypesForService } from './constants'
import { getPlanPricingLabel } from './pricing'
import { toFulfillmentPlanView, plansForService } from './plan-view'
import {
  buildInitialServiceRows,
  resolveEffectiveFulfillment,
} from './resolve'
import {
  collectCatalogIssues,
  fulfillmentRequestSchema,
  requiresInventoryDropOff,
  requiresPickupAddress,
  type ServiceChoices,
} from './validate'
import type { SellerServiceRow } from './types'

const DELIVERY_STANDARD = '00000000-0000-4000-8000-000000000001'
const DELIVERY_EXPRESS = '00000000-0000-4000-8000-000000000002'
const STORAGE_GROWTH = '00000000-0000-4000-8000-000000000003'
const PACKAGING_STANDARD = '00000000-0000-4000-8000-000000000004'
const CS_TALLABY = '00000000-0000-4000-8000-000000000005'
const RETURNS_TALLABY = '00000000-0000-4000-8000-000000000006'

const seller = { provider: 'seller' as const, planId: null }

const allSeller: ServiceChoices = {
  storage: seller,
  packaging: seller,
  delivery: { ...seller, config: { mode: 'own_riders' } },
  customer_service: seller,
  returns: seller,
}

const allTallaby: ServiceChoices = {
  storage: { provider: 'tallaby', planId: STORAGE_GROWTH },
  packaging: { provider: 'tallaby', planId: PACKAGING_STANDARD },
  delivery: { provider: 'tallaby', planId: DELIVERY_STANDARD },
  customer_service: { provider: 'tallaby', planId: CS_TALLABY },
  returns: { provider: 'tallaby', planId: RETURNS_TALLABY },
}

const details = {
  estimatedSkus: '11_50' as const,
  estimatedDailyOrders: '6_20' as const,
  sizeCategory: 'small' as const,
  hasFragileProducts: false,
}

const pickupAddress = {
  governorate: 'GIZA',
  city: 'Dokki',
  street: '12 Tahrir Street',
  contactPhone: '01012345678',
}

const issueCodes = (input: unknown) => {
  const result = fulfillmentRequestSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}:${i.message}`)
}

describe('enum mirrors', () => {
  it('match the database enums exactly', () => {
    expect([...FULFILLMENT_SERVICE_TYPES]).toEqual(fulfillmentServiceType.enumValues)
    expect([...FULFILLMENT_PROVIDERS]).toEqual(fulfillmentProvider.enumValues)
    expect([...FULFILLMENT_MODELS]).toEqual(fulfillmentModel.enumValues)
    expect([...FULFILLMENT_SERVICE_STATUSES]).toEqual(fulfillmentServiceStatus.enumValues)
    expect([...FULFILLMENT_REVIEW_STATUSES]).toEqual(fulfillmentReviewStatus.enumValues)
    expect([...FULFILLMENT_AGREEMENT_STATUSES]).toEqual(fulfillmentAgreementStatus.enumValues)
  })
})

describe('fulfillmentRequestSchema', () => {
  it('accepts an all-seller setup without a pickup address', () => {
    expect(issueCodes({ model: 'seller_managed', services: allSeller, details })).toEqual([])
  })

  it('accepts mixed providers (seller storage + Tallaby delivery)', () => {
    const services = { ...allSeller, delivery: { provider: 'tallaby', planId: DELIVERY_EXPRESS } }
    expect(
      issueCodes({ model: 'seller_managed', services, details, pickupAddress }),
    ).toEqual([])
  })

  it('requires a plan for every Tallaby service', () => {
    const services = { ...allSeller, packaging: { provider: 'tallaby', planId: null } }
    expect(issueCodes({ model: 'seller_managed', services, details, pickupAddress })).toContain(
      'services.packaging.planId:plan_required',
    )
  })

  it('rejects a plan on a seller-handled service', () => {
    const services = { ...allSeller, storage: { provider: 'seller', planId: STORAGE_GROWTH } }
    expect(issueCodes({ model: 'seller_managed', services, details })).toContain(
      'services.storage.planId:plan_not_allowed',
    )
  })

  it('requires Tallaby everywhere for the Tallaby fulfillment model', () => {
    const services = { ...allTallaby, returns: seller }
    const codes = issueCodes({
      model: 'tallaby_fulfillment',
      services,
      details: { ...details, estimatedInventoryUnits: '101_500' },
      pickupAddress,
    })
    expect(codes).toContain('services.returns.provider:tallaby_model_requires_tallaby')
  })

  it('requires a delivery mode when the seller delivers', () => {
    const services = { ...allSeller, delivery: seller }
    expect(issueCodes({ model: 'seller_managed', services, details })).toContain(
      'services.delivery.config.mode:delivery_mode_required',
    )
  })

  it('requires an inventory estimate when Tallaby stores', () => {
    const services = { ...allSeller, storage: { provider: 'tallaby', planId: STORAGE_GROWTH } }
    expect(issueCodes({ model: 'seller_managed', services, details, pickupAddress })).toContain(
      'details.estimatedInventoryUnits:required',
    )
  })

  it('requires a pickup address when Tallaby collects from a seller who keeps the stock', () => {
    const services = { ...allSeller, returns: { provider: 'tallaby', planId: RETURNS_TALLABY } }
    expect(requiresPickupAddress(services)).toBe(true)
    expect(requiresPickupAddress(allSeller)).toBe(false)
    // Customer service alone involves no physical collection.
    expect(
      requiresPickupAddress({ ...allSeller, customer_service: { provider: 'tallaby', planId: CS_TALLABY } }),
    ).toBe(false)
    expect(issueCodes({ model: 'seller_managed', services, details })).toContain(
      'pickupAddress:pickup_address_required',
    )
  })

  it('rejects unknown governorates and invalid phones in the pickup address', () => {
    const codes = issueCodes({
      model: 'seller_managed',
      services: allTallaby,
      details: { ...details, estimatedInventoryUnits: '1_100' },
      pickupAddress: { ...pickupAddress, governorate: 'ATLANTIS', contactPhone: '123' },
    })
    expect(codes).toContain('pickupAddress.governorate:governorate_invalid')
    expect(codes).toContain('pickupAddress.contactPhone:phone_invalid')
  })
})

describe('inventory drop-off', () => {
  it('Tallaby storage means the seller brings inventory to the warehouse - no pickup address', () => {
    const services = { ...allTallaby }
    expect(requiresInventoryDropOff(services)).toBe(true)
    expect(requiresPickupAddress(services)).toBe(false)
    expect(
      issueCodes({
        model: 'tallaby_fulfillment',
        services,
        details: { ...details, estimatedInventoryUnits: '101_500' },
      }),
    ).toEqual([])
  })
})

describe('collectCatalogIssues', () => {
  const plans = [
    { id: DELIVERY_STANDARD, serviceType: 'delivery' as const, isActive: true },
    { id: DELIVERY_EXPRESS, serviceType: 'delivery' as const, isActive: false },
    { id: STORAGE_GROWTH, serviceType: 'storage' as const, isActive: true },
  ]

  it('flags inactive, unknown and mismatched plans', () => {
    const services: ServiceChoices = {
      ...allSeller,
      delivery: { provider: 'tallaby', planId: DELIVERY_EXPRESS },
      packaging: { provider: 'tallaby', planId: STORAGE_GROWTH },
      returns: { provider: 'tallaby', planId: RETURNS_TALLABY },
    }
    expect(collectCatalogIssues(services, plans).map((i) => i.path.join('.'))).toEqual([
      'services.packaging.planId',
      'services.delivery.planId',
      'services.returns.planId',
    ])
  })

  it('passes active plans of the right service', () => {
    const services = { ...allSeller, delivery: { provider: 'tallaby' as const, planId: DELIVERY_STANDARD } }
    expect(collectCatalogIssues(services, plans)).toEqual([])
  })
})

describe('buildInitialServiceRows', () => {
  it('keeps today\'s behavior active and records the request separately', () => {
    const rows = buildInitialServiceRows(
      { ...allSeller, storage: { provider: 'tallaby', planId: STORAGE_GROWTH } },
      DELIVERY_STANDARD,
    )
    const storage = rows.find((r) => r.serviceType === 'storage')!
    expect(storage).toMatchObject({
      requestedProvider: 'tallaby',
      requestedPlanId: STORAGE_GROWTH,
      activeProvider: 'seller',
      activePlanId: null,
      status: 'requested',
    })

    // Seller-handled packaging equals the baseline, so it is live immediately.
    expect(rows.find((r) => r.serviceType === 'packaging')!.status).toBe('active')

    // Seller delivery differs from the baseline (Tallaby standard): needs review.
    const delivery = rows.find((r) => r.serviceType === 'delivery')!
    expect(delivery).toMatchObject({
      requestedProvider: 'seller',
      requestedConfig: { mode: 'own_riders' },
      activeProvider: 'tallaby',
      activePlanId: DELIVERY_STANDARD,
      // The pending own-riders request must not leak into the live config.
      activeConfig: { legacy: true, sellerRidersAllowed: false },
      status: 'requested',
    })
  })

  it('activates Tallaby standard delivery immediately since it is the baseline', () => {
    const rows = buildInitialServiceRows(allTallaby, DELIVERY_STANDARD)
    expect(rows.find((r) => r.serviceType === 'delivery')!.status).toBe('active')
    expect(rows.filter((r) => r.status === 'requested').map((r) => r.serviceType)).toEqual([
      'storage',
      'packaging',
      'customer_service',
      'returns',
    ])
  })
})

describe('resolveEffectiveFulfillment', () => {
  const row = (overrides: Partial<SellerServiceRow>): SellerServiceRow => ({
    serviceType: 'storage',
    status: 'active',
    requestedProvider: 'seller',
    requestedPlanId: null,
    requestedConfig: {},
    activeProvider: 'seller',
    activePlanId: null,
    activeConfig: {},
    ...overrides,
  })

  it('uses only active columns - a pending request changes nothing', () => {
    const effective = resolveEffectiveFulfillment(
      [row({ status: 'requested', requestedProvider: 'tallaby', requestedPlanId: STORAGE_GROWTH })],
      DELIVERY_STANDARD,
    )
    expect(effective.storage).toEqual({ provider: 'seller', planId: null, config: {} })
  })

  it('applies an activated Tallaby service', () => {
    const effective = resolveEffectiveFulfillment(
      [row({ activeProvider: 'tallaby', activePlanId: STORAGE_GROWTH })],
      DELIVERY_STANDARD,
    )
    expect(effective.storage.provider).toBe('tallaby')
    expect(effective.storage.planId).toBe(STORAGE_GROWTH)
  })

  it('falls back to the baseline for missing and paused services', () => {
    const effective = resolveEffectiveFulfillment(
      [row({ status: 'paused', activeProvider: 'tallaby', activePlanId: STORAGE_GROWTH })],
      DELIVERY_STANDARD,
    )
    expect(effective.storage.provider).toBe('seller')
    expect(effective.delivery).toMatchObject({ provider: 'tallaby', planId: DELIVERY_STANDARD })
    expect(effective.returns.provider).toBe('seller')
  })
})

describe('getPlanPricingLabel', () => {
  it('returns null when nothing is configured (UI shows "discussed with our team")', () => {
    expect(getPlanPricingLabel(null, 'en')).toBeNull()
    expect(getPlanPricingLabel({}, 'en')).toBeNull()
    expect(getPlanPricingLabel({ amount: null, unit: 'order' }, 'ar')).toBeNull()
  })

  it('shows an explicitly configured amount, including zero', () => {
    expect(getPlanPricingLabel({ amount: 25, unit: 'order' }, 'en')).toMatch(/25.*\/ order/)
    expect(getPlanPricingLabel({ amount: 0 }, 'en')).toMatch(/0/)
  })

  it('uses the localized note', () => {
    expect(getPlanPricingLabel({ noteEn: 'Custom quote', noteAr: 'عرض سعر مخصص' }, 'ar')).toBe(
      'عرض سعر مخصص',
    )
  })
})

describe('toFulfillmentPlanView', () => {
  it('normalizes malformed jsonb and empty pricing', () => {
    const view = toFulfillmentPlanView({
      id: STORAGE_GROWTH,
      code: 'storage_growth',
      serviceType: 'storage',
      nameEn: 'Storage Growth',
      nameAr: 'تخزين النمو',
      descriptionEn: null,
      descriptionAr: null,
      features: [{ en: 'Receiving', ar: 'استلام' }, 'garbage', { en: '' }],
      limits: {},
      pricing: { model: 'monthly' },
      shippingSpeed: null,
      availability: null,
      isActive: true,
      sortOrder: 20,
    })
    expect(view.features).toEqual([{ en: 'Receiving', ar: 'استلام' }])
    expect(view.limits).toBeNull()
    expect(view.pricing).toBeNull()
  })

  it('orders plans per service by sort order and skips inactive ones', () => {
    const base = toFulfillmentPlanView({
      id: 'a', code: 'b', serviceType: 'storage', nameEn: '', nameAr: '', descriptionEn: null,
      descriptionAr: null, features: [], limits: null, pricing: null, shippingSpeed: null,
      availability: null, isActive: true, sortOrder: 0,
    })
    const plans = [
      { ...base, id: '3', code: 'storage_business', sortOrder: 30 },
      { ...base, id: '1', code: 'storage_basic', sortOrder: 10 },
      { ...base, id: '2', code: 'storage_off', sortOrder: 5, isActive: false },
      { ...base, id: '4', code: 'delivery_standard', serviceType: 'delivery' as const },
    ]
    expect(plansForService(plans, 'storage').map((p) => p.id)).toEqual(['1', '3'])
  })
})

describe('feeTypesForService', () => {
  it("offers only the service's own fee, special handling, or other", () => {
    expect(feeTypesForService('storage')).toEqual(['storage', 'special_handling', 'other'])
    expect(feeTypesForService('returns')).toEqual(['return', 'special_handling', 'other'])
    expect(feeTypesForService('delivery')).not.toContain('storage')
  })
})
