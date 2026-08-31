export function getFlatShippingCost(): number {
  return Number(process.env.NEXT_PUBLIC_SHIPPING_COST) || 50
}

export interface ShippingCartItem {
  product?: {
    productType?: string | null
    freeDelivery?: boolean | null
  } | null
}

export function calculateOrderShippingCost(
  items: ShippingCartItem[],
  baseCost = getFlatShippingCost(),
): number {
  const physicalItems = items.filter(
    (item) => item.product?.productType !== 'digital',
  )

  if (physicalItems.length === 0) {
    return 0
  }

  return physicalItems.every((item) => item.product?.freeDelivery === true)
    ? 0
    : baseCost
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
