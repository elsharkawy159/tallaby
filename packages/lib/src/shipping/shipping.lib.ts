import { normalizeGovernorate } from './governorate.lib'
import {
  CAIRO_ORIGIN_RATES,
  EXTRA_KG_RATE,
  FALLBACK_BASE_RATE,
  FEE_MULTIPLIER,
  ROUND_TO,
} from './shipping-rates'
import type { LocationShippingOptions, ShippingCartItem } from './shipping.types'

const DEFAULT_ITEM_WEIGHT_GRAMS = 1000

export function applyShippingFeesAndRound(amount: number): number {
  const withFees = amount * FEE_MULTIPLIER
  return Math.ceil(withFees / ROUND_TO) * ROUND_TO
}

export function getBaseRateForGovernorate(governorate: string): number | null {
  return CAIRO_ORIGIN_RATES[governorate] ?? null
}

export function getWeightExtraCharge(totalGrams: number): number {
  const extraTiers = Math.max(0, Math.ceil(totalGrams / 1000) - 1)
  return extraTiers * EXTRA_KG_RATE
}

function itemWeightToGrams(
  weight: number | string | null | undefined,
  weightUnit: string | null | undefined,
): number {
  const parsed = Number(weight)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_ITEM_WEIGHT_GRAMS
  }

  const unit = (weightUnit ?? 'kg').toLowerCase()
  if (unit === 'g' || unit === 'gram' || unit === 'grams') {
    return parsed
  }

  return parsed * 1000
}

function parseProductDimensions(
  dimensions: unknown,
): { weight?: number | string | null; weightUnit?: string | null } | null {
  if (!dimensions || typeof dimensions !== 'object') {
    return null
  }

  const record = dimensions as Record<string, unknown>
  return {
    weight:
      typeof record.weight === 'number' || typeof record.weight === 'string'
        ? record.weight
        : null,
    weightUnit:
      typeof record.weightUnit === 'string' ? record.weightUnit : null,
  }
}

export function calculateCartWeightGrams(items: ShippingCartItem[]): number {
  const physicalItems = items.filter(
    (item) => item.product?.productType !== 'digital',
  )

  if (physicalItems.length === 0) {
    return 0
  }

  return physicalItems.reduce((total, item) => {
    const dimensions = parseProductDimensions(item.product?.dimensions)
    const itemGrams = itemWeightToGrams(
      dimensions?.weight,
      dimensions?.weightUnit,
    )
    return total + itemGrams * item.quantity
  }, 0)
}

export function cartQualifiesForProductFreeDelivery(
  items: ShippingCartItem[],
): boolean {
  const physicalItems = items.filter(
    (item) => item.product?.productType !== 'digital',
  )

  return (
    physicalItems.length > 0 &&
    physicalItems.every((item) => item.product?.freeDelivery === true)
  )
}

export function calculateRawShippingAmount(
  destinationState: string | null | undefined,
  totalGrams: number,
  fallbackBaseRate = FALLBACK_BASE_RATE,
): number {
  const governorate = normalizeGovernorate(destinationState)
  const baseRate = governorate
    ? (getBaseRateForGovernorate(governorate) ?? fallbackBaseRate)
    : fallbackBaseRate

  const weightExtra = getWeightExtraCharge(totalGrams)
  return baseRate + weightExtra
}

export function calculateLocationShippingCost(
  options: LocationShippingOptions,
): number {
  const { items, destinationState, fallbackBaseRate = FALLBACK_BASE_RATE } =
    options

  const physicalItems = items.filter(
    (item) => item.product?.productType !== 'digital',
  )

  if (physicalItems.length === 0) {
    return 0
  }

  if (cartQualifiesForProductFreeDelivery(items)) {
    return 0
  }

  const totalGrams = calculateCartWeightGrams(items)
  const rawAmount = calculateRawShippingAmount(
    destinationState,
    totalGrams,
    fallbackBaseRate,
  )

  return applyShippingFeesAndRound(rawAmount)
}
