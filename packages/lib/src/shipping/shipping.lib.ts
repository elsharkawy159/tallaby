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

/** True when the cart contains at least one physical (shippable) item. */
export function cartHasPhysicalItems (items: ShippingCartItem[]): boolean {
  return items.some((item) => item.product?.productType !== 'digital')
}

/**
 * True when a seller group has a free-delivery *offer* (seller flag or all
 * products free). Kept for admin/product UI; checkout free shipping is
 * threshold-based via getThresholdShippingDiscount.
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

/**
 * @deprecated Prefer cartHasPhysicalItems — free shipping is now cart-wide
 * when subtotal >= FREE_DELIVERY_MIN_SUBTOTAL, not seller-flag gated.
 */
export function cartHasFreeDeliveryOffer (items: ShippingCartItem[]): boolean {
  return cartHasPhysicalItems(items)
}

/**
 * Shipping discount applied when cart subtotal meets FREE_DELIVERY_MIN_SUBTOTAL.
 * Mirrors a free-shipping promocode: shipping cost stays visible, discount waives it.
 */
export function getThresholdShippingDiscount (
  cartSubtotal: number,
  shippingCost: number | null | undefined,
): number {
  if (shippingCost == null || shippingCost <= 0) {
    return 0
  }

  if (cartSubtotal < FREE_DELIVERY_MIN_SUBTOTAL) {
    return 0
  }

  return shippingCost
}

export function cartQualifiesForThresholdFreeShipping (
  cartSubtotal: number,
): boolean {
  return cartSubtotal >= FREE_DELIVERY_MIN_SUBTOTAL
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
 * Digital-only groups always "qualify" (nothing to ship). Physical groups
 * no longer waive via seller flags — free shipping is applied as a cart-wide
 * threshold discount in checkout / place-order.
 */
export function sellerGroupQualifiesForFreeDelivery (
  items: ShippingCartItem[],
  _cartSubtotal = 0,
): boolean {
  const physicalItems = items.filter(
    (item) => item.product?.productType !== 'digital',
  )

  return physicalItems.length === 0
}

/**
 * True when the cart has physical items and subtotal meets the free-shipping
 * threshold (used for progress / unlocked messaging).
 */
export function cartQualifiesForProductFreeDelivery (
  items: ShippingCartItem[],
  cartSubtotal = 0,
): boolean {
  if (!cartHasPhysicalItems(items)) {
    return false
  }

  return cartQualifiesForThresholdFreeShipping(cartSubtotal)
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
 * Shipping cost is computed per seller (weight/rate per shipment) and summed.
 * Free shipping at FREE_DELIVERY_MIN_SUBTOTAL is applied separately as a
 * shippingDiscount (see getThresholdShippingDiscount) — this always returns
 * the calculated rate so checkout can show cost + discount.
 */
export function calculateLocationShippingCost (
  options: LocationShippingOptions,
): number | null {
  const {
    items,
    destinationState,
    fallbackBaseRate = FALLBACK_BASE_RATE,
  } = options

  const physicalItems = items.filter(
    (item) => item.product?.productType !== 'digital',
  )

  if (physicalItems.length === 0) {
    return 0
  }

  const hasDestination =
    typeof destinationState === 'string' && destinationState.trim().length > 0

  if (!hasDestination) {
    return null
  }

  const sellerGroups = groupShippingItemsBySeller(items)
  let total = 0

  for (const groupItems of sellerGroups.values()) {
    const groupPhysicalItems = groupItems.filter(
      (item) => item.product?.productType !== 'digital',
    )

    if (groupPhysicalItems.length === 0) {
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

  return total
}
