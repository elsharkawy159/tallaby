import type { AddressData } from '@workspace/lib/address'
import type { ExternalOrderLineItem } from './external-orders.schema'

export interface CustomerSavedAddress extends AddressData {
  id: string
}

export interface CustomerLookupData {
  id: string
  fullName: string | null
  phone: string | null
  email: string | null
  addresses: CustomerSavedAddress[]
}

export const NEW_ADDRESS_OPTION = '__new_address__'

export interface ExternalOrderCartLine extends ExternalOrderLineItem {
  key: string
  title: string
  image: string | null
  /** Price actually charged — the catalogue price until an admin edits it. */
  unitPrice: number
  /** Catalogue price, kept so an edited line can be reset. */
  catalogPrice: number
  variantLabel?: string
}

export interface ExternalOrderPreview {
  subtotal: number
  shippingCost: number
  discountAmount: number
  total: number
  itemCount: number
  /** Rate-table shipping before any admin override, for the "reset" hint. */
  calculatedShippingCost: number
  /** Automatic discount before any admin override. */
  calculatedDiscountAmount: number
}

export interface PlacedExternalOrderResult {
  order: {
    id: string
    orderNumber: string
    status: string
    paymentStatus: string
    paymentMethod: string
    subtotal: string | number
    shippingCost: string | number | null
    discountAmount: string | number | null
    totalAmount: string | number
    createdAt: string | null
    notes: string | null
  }
  orderItems: Array<{
    id: string
    productName: string
    variantName: string | null
    quantity: number
    price: string | number
    subtotal: string | number
  }>
  customer: {
    fullName: string
    phone: string | null
  }
  address: AddressData | null
}
