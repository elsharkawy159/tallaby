import {
  calculateLocationShippingCost,
  calculateSellerFreeDeliveryDiscount,
  cartFullyCoveredBySellerFreeDelivery,
  cartHasFreeDeliveryOffer,
  cartHasPhysicalItems,
  cartQualifiesForProductFreeDelivery,
  cartQualifiesForThresholdFreeShipping,
  FREE_DELIVERY_MIN_SUBTOTAL,
  getThresholdShippingDiscount,
  resolveCartSubtotal,
} from '@workspace/lib/shipping'

export {
  calculateSellerFreeDeliveryDiscount,
  cartFullyCoveredBySellerFreeDelivery,
  cartHasFreeDeliveryOffer,
  cartHasPhysicalItems,
  cartQualifiesForProductFreeDelivery,
  cartQualifiesForThresholdFreeShipping,
  FREE_DELIVERY_MIN_SUBTOTAL,
  getThresholdShippingDiscount,
}

export function getFlatShippingCost (): number {
  return Number(process.env.NEXT_PUBLIC_SHIPPING_COST) || 50
}

export interface CalculateOrderShippingOptions {
  destinationState?: string | null
  cartSubtotal?: number
}

export interface OrderShippingCartItem {
  quantity: number
  price?: string | number | null
  sellerId?: string | null
  product?: {
    productType?: string | null
    freeDelivery?: boolean | null
    dimensions?: unknown
    sellerId?: string | null
    seller?: {
      freeDelivery?: boolean | null
    } | null
  } | null
}

function buildShippingOptions (
  items: OrderShippingCartItem[],
  options: CalculateOrderShippingOptions,
) {
  const envFallback = Number(process.env.NEXT_PUBLIC_SHIPPING_FALLBACK_BASE)
  const fallbackBaseRate = Number.isFinite(envFallback) ? envFallback : undefined
  const cartSubtotal = resolveCartSubtotal(items, options.cartSubtotal)

  return {
    items,
    destinationState: options.destinationState,
    cartSubtotal,
    ...(fallbackBaseRate !== undefined ? { fallbackBaseRate } : {}),
  }
}

export function calculateOrderShippingCost (
  items: OrderShippingCartItem[],
  options: CalculateOrderShippingOptions = {},
): number | null {
  return calculateLocationShippingCost(buildShippingOptions(items, options))
}

/**
 * Shipping waived for sellers flagged sellers.free_delivery — their shipment is
 * discounted 100% so the buyer pays only the product price. Applied as a
 * shippingDiscount, so the shipping line stays visible next to its waiver.
 */
export function calculateOrderSellerFreeDeliveryDiscount (
  items: OrderShippingCartItem[],
  options: CalculateOrderShippingOptions = {},
): number {
  return calculateSellerFreeDeliveryDiscount(
    buildShippingOptions(items, options),
  )
}
