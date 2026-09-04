export interface ShippingCartItem {
  quantity: number
  /** Line unit price — used to derive cartSubtotal when not passed explicitly. */
  price?: string | number | null
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
  /** Whole-cart subtotal in EGP; required for free-delivery threshold checks. */
  cartSubtotal?: number
}
