import type {
  FulfillmentFeeType,
  FulfillmentProvider,
  FulfillmentServiceStatus,
  FulfillmentServiceType,
  SellerDeliveryMode,
} from './constants'

export interface LocalizedText {
  en: string
  ar: string
}

/** `fulfillment_plans.pricing`. Every field optional; null means "not priced yet". */
export interface PlanPricing {
  model?: 'fixed' | 'per_unit' | 'per_order' | 'monthly' | 'custom'
  amount?: number | null
  unit?: string | null
  noteEn?: string | null
  noteAr?: string | null
}

/** Client-safe shape of a catalog plan, as passed to onboarding/admin UIs. */
export interface FulfillmentPlanView {
  id: string
  code: string
  serviceType: FulfillmentServiceType
  nameEn: string
  nameAr: string
  descriptionEn: string | null
  descriptionAr: string | null
  features: LocalizedText[]
  limits: Record<string, unknown> | null
  pricing: PlanPricing | null
  shippingSpeed: string | null
  availability: { governorates?: string[] } | null
  isActive: boolean
  sortOrder: number
}

/** `requested_config` / `active_config`. Only delivery uses keys today. */
export interface ServiceConfig {
  mode?: SellerDeliveryMode
  courierName?: string
  /** Set by the 0041 backfill / baseline: pre-fulfillment delivery behavior. */
  legacy?: boolean
  sellerRidersAllowed?: boolean
}

/** The fields of a `seller_fulfillment_services` row the pure logic needs. */
export interface SellerServiceRow {
  serviceType: FulfillmentServiceType
  status: FulfillmentServiceStatus
  requestedProvider: FulfillmentProvider
  requestedPlanId: string | null
  requestedConfig: ServiceConfig
  activeProvider: FulfillmentProvider
  activePlanId: string | null
  activeConfig: ServiceConfig
}

export interface EffectiveService {
  provider: FulfillmentProvider
  planId: string | null
  config: ServiceConfig
}

export type EffectiveFulfillment = Record<FulfillmentServiceType, EffectiveService>

export interface AgreementRate {
  feeType: FulfillmentFeeType
  /** Required when feeType is "other": what the fee is for. */
  label?: string | null
  amount: number
  unit?: string | null
  note?: string | null
}
