/**
 * Client-safe mirrors of the fulfillment enums in
 * `packages/db/src/drizzle/schema.ts` (migration 0040). A unit test asserts the
 * two stay identical, so these can be imported from client components without
 * pulling in the DB layer.
 */

export const FULFILLMENT_SERVICE_TYPES = [
  'storage',
  'packaging',
  'delivery',
  'customer_service',
  'returns',
] as const
export type FulfillmentServiceType = (typeof FULFILLMENT_SERVICE_TYPES)[number]

export const FULFILLMENT_PROVIDERS = ['seller', 'tallaby'] as const
export type FulfillmentProvider = (typeof FULFILLMENT_PROVIDERS)[number]

export const FULFILLMENT_MODELS = ['seller_managed', 'tallaby_fulfillment'] as const
export type FulfillmentModel = (typeof FULFILLMENT_MODELS)[number]

export const FULFILLMENT_SERVICE_STATUSES = [
  'requested',
  'under_review',
  'awaiting_agreement',
  'active',
  'paused',
  'rejected',
] as const
export type FulfillmentServiceStatus = (typeof FULFILLMENT_SERVICE_STATUSES)[number]

export const FULFILLMENT_REVIEW_STATUSES = ['pending_contact', 'contacted', 'configured'] as const
export type FulfillmentReviewStatus = (typeof FULFILLMENT_REVIEW_STATUSES)[number]

export const FULFILLMENT_AGREEMENT_STATUSES = [
  'draft',
  'proposed',
  'accepted',
  'active',
  'superseded',
  'terminated',
] as const
export type FulfillmentAgreementStatus = (typeof FULFILLMENT_AGREEMENT_STATUSES)[number]

/** Fee kinds an agreement can carry; aligned with the future `fee` wallet transactions. */
export const FULFILLMENT_FEE_TYPES = [
  'storage',
  'packaging',
  'delivery',
  'return',
  'customer_service',
  'inbound_receiving',
  'special_handling',
  /** Anything else; the rate carries its own `label`. */
  'other',
] as const
export type FulfillmentFeeType = (typeof FULFILLMENT_FEE_TYPES)[number]

/** The fee a service's own work is billed as. */
export const SERVICE_FEE_TYPE: Record<FulfillmentServiceType, FulfillmentFeeType> = {
  storage: 'storage',
  packaging: 'packaging',
  delivery: 'delivery',
  customer_service: 'customer_service',
  returns: 'return',
}

/**
 * Fee types an agreement for one service may carry: that service's own fee,
 * special handling, or a free-text "other". Other services' fees belong on
 * their own agreements.
 */
export function feeTypesForService(serviceType: FulfillmentServiceType): FulfillmentFeeType[] {
  return [SERVICE_FEE_TYPE[serviceType], 'special_handling', 'other']
}

/** How a seller delivers when they keep delivery themselves. */
export const SELLER_DELIVERY_MODES = ['own_riders', 'external_courier'] as const
export type SellerDeliveryMode = (typeof SELLER_DELIVERY_MODES)[number]

/**
 * The plan code that represents today's delivery behavior (checkout bills
 * Tallaby's governorate rates and the shipping app dispatches). Used as the
 * active delivery configuration until an admin activates something else.
 */
export const BASELINE_DELIVERY_PLAN_CODE = 'delivery_standard'

/** Bumped whenever the seller terms text changes; stored on the profile. */
export const SELLER_TERMS_VERSION = '2026-09'

/** Estimate buckets. Ranges, not numbers: sellers rarely know exact figures up front. */
export const SKU_RANGES = ['1_10', '11_50', '51_200', '201_1000', '1000_plus'] as const
export const DAILY_ORDER_RANGES = ['0_5', '6_20', '21_50', '51_200', '200_plus'] as const
export const INVENTORY_UNIT_RANGES = ['1_100', '101_500', '501_2000', '2001_10000', '10000_plus'] as const
export const PRODUCT_SIZE_CATEGORIES = ['small', 'medium', 'large', 'mixed'] as const
