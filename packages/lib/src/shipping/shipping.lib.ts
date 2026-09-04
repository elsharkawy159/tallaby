import { normalizeGovernorate } from './governorate.lib'
import {
  CAIRO_ORIGIN_RATES,
  EXTRA_KG_RATE,
  FALLBACK_BASE_RATE,
  FEE_MULTIPLIER,
  FREE_DELIVERY_MIN_SUBTOTAL,
  ROUND_TO,
} from './shipping-rates'
import type { LocationShippingOptions, ShippingCartItem } from './shipping.types'

export { FREE_DELIVERY_MIN_SUBTOTAL }

const DEFAULT_ITEM_WEIGHT_GRAMS = 1000

export function resolveCartSubtotal (
  items: ShippingCartItem[],
  cartSubtotal?: number,
): number {
  if (typeof cartSubtotal === 'number' && Number.isFinite(cartSubtotal)) {
    return cartSubtotal
  }

  return items.reduce((sum, item) => {
    const price = Number(item.price)
    if (!Number.isFinite(price)) {
      return sum
    }
    return sum + price * item.quantity
  }, 0)
}

/**
 * True when a seller group has a free-delivery *offer* (seller flag or all
 * products free). Does not check the cart subtotal threshold.
 */
export function sellerGroupHasFreeDeliveryOffer (
  items: ShippingCartItem[],
): boolean {
  const physicalItems = items.filter(
    (item) => item.product?.productType !== 'digital',
  )

  if (physicalItems.length === 0) {
    return false
  }

  if (physicalItems.some((item) => item.product?.seller?.freeDelivery === true)) {
    return true
  }

  return physicalItems.every((item) => item.product?.freeDelivery === true)
}

/** True when any physical line in the cart could unlock free delivery. */
export function cartHasFreeDeliveryOffer (items: ShippingCartItem[]): boolean {
  const physicalItems = items.filter(
    (item) => item.product?.productType !== 'digital',
  )

  if (physicalItems.length === 0) {
    return false
  }

  return physicalItems.some(
    (item) =>
      item.product?.seller?.freeDelivery === true ||
      item.product?.freeDelivery === true,
  )
}

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

const UNASSIGNED_SELLER_KEY = '__unassigned__'

function getItemSellerId(item: ShippingCartItem): string {
  return item.sellerId ?? item.product?.sellerId ?? UNASSIGNED_SELLER_KEY
}

/** Groups cart items by seller so free delivery can be evaluated per seller. */
export function groupShippingItemsBySeller(
  items: ShippingCartItem[],
): Map<string, ShippingCartItem[]> {
  const groups = new Map<string, ShippingCartItem[]>()

  for (const item of items) {
    const sellerId = getItemSellerId(item)
    const group = groups.get(sellerId)
    if (group) {
      group.push(item)
    } else {
      groups.set(sellerId, [item])
    }
  }

  return groups
}

/**
 * A seller's items ship free when they have a free-delivery offer and the
 * whole-cart subtotal meets FREE_DELIVERY_MIN_SUBTOTAL. Digital-only groups
 * always ship free (no physical goods to deliver).
 */
export function sellerGroupQualifiesForFreeDelivery (
  items: ShippingCartItem[],
  cartSubtotal = 0,
): boolean {
  const physicalItems = items.filter(
    (item) => item.product?.productType !== 'digital',
  )

  if (physicalItems.length === 0) {
    return true
  }

  if (!sellerGroupHasFreeDeliveryOffer(items)) {
    return false
  }

  return cartSubtotal >= FREE_DELIVERY_MIN_SUBTOTAL
}

/**
 * Whole-cart check: true only when every seller represented in the cart
 * qualifies for free delivery (used for "your whole order ships free" UI).
 */
export function cartQualifiesForProductFreeDelivery (
  items: ShippingCartItem[],
  cartSubtotal = 0,
): boolean {
  const physicalItems = items.filter(
    (item) => item.product?.productType !== 'digital',
  )

  if (physicalItems.length === 0) {
    return false
  }

  const sellerGroups = groupShippingItemsBySeller(items)
  for (const groupItems of sellerGroups.values()) {
    if (!sellerGroupQualifiesForFreeDelivery(groupItems, cartSubtotal)) {
      return false
    }
  }

  return true
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

/**
 * Shipping cost is computed per seller (so one seller's free-delivery status
 * never affects another seller's items in the same order) and summed.
 */
export function calculateLocationShippingCost (
  options: LocationShippingOptions,
): number | null {
  const {
    items,
    destinationState,
    fallbackBaseRate = FALLBACK_BASE_RATE,
    cartSubtotal: cartSubtotalOption,
  } = options

  const cartSubtotal = resolveCartSubtotal(items, cartSubtotalOption)

  const physicalItems = items.filter(
    (item) => item.product?.productType !== 'digital',
  )

  if (physicalItems.length === 0) {
    return 0
  }

  // No destination yet — shipping is unknown until an address is selected,
  // but only matters once we know at least one seller isn't free.
  const hasDestination =
    typeof destinationState === 'string' && destinationState.trim().length > 0

  const sellerGroups = groupShippingItemsBySeller(items)
  let total = 0
  let missingDestinationForBillableGroup = false

  for (const groupItems of sellerGroups.values()) {
    const groupPhysicalItems = groupItems.filter(
      (item) => item.product?.productType !== 'digital',
    )

    if (groupPhysicalItems.length === 0) {
      continue
    }

    if (sellerGroupQualifiesForFreeDelivery(groupItems, cartSubtotal)) {
      continue
    }

    if (!hasDestination) {
      missingDestinationForBillableGroup = true
      continue
    }

    const totalGrams = calculateCartWeightGrams(groupItems)
    const rawAmount = calculateRawShippingAmount(
      destinationState,
      totalGrams,
      fallbackBaseRate,
    )
    total += applyShippingFeesAndRound(rawAmount)
  }

  if (missingDestinationForBillableGroup) {
    return null
  }

  return total
}
