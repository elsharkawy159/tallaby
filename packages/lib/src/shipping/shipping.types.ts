export interface ShippingCartItem {
  quantity: number
  /** Seller owning this line item, used to group items for per-seller free delivery. */
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

export interface LocationShippingOptions {
  items: ShippingCartItem[]
  destinationState?: string | null
  fallbackBaseRate?: number
}
