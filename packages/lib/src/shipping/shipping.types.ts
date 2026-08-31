export interface ShippingCartItem {
  quantity: number
  product?: {
    productType?: string | null
    freeDelivery?: boolean | null
    dimensions?: unknown
  } | null
}

export interface LocationShippingOptions {
  items: ShippingCartItem[]
  destinationState?: string | null
  fallbackBaseRate?: number
}
