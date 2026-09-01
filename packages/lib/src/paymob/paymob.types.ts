export interface PaymobBillingData {
  first_name: string
  last_name: string
  phone_number: string
  email: string
  street: string
  building: string
  floor: string
  apartment: string
  city: string
  country: string
  state: string
  postal_code: string
  shipping_method: string
}

export interface PaymobIntentionItem {
  name: string
  amount: number
  description?: string
  quantity?: number
}

export interface CreateIntentionInput {
  amount: number
  currency: string
  paymentMethods: Array<number | string>
  items: PaymobIntentionItem[]
  billingData: PaymobBillingData
  specialReference: string
  notificationUrl?: string
  redirectionUrl?: string
}

export interface PaymobIntentionResponse {
  id: string
  client_secret: string
  intention_order_id?: number
  status?: string
  confirmed?: boolean
  payment_methods?: Array<number | string>
}

export interface PaymobTransactionObj {
  id: number
  amount_cents: number
  created_at: string
  currency: string
  error_occured: boolean
  has_parent_transaction: boolean
  integration_id: number
  is_3d_secure: boolean
  is_auth: boolean
  is_capture: boolean
  is_refunded: boolean
  is_standalone_payment: boolean
  is_voided: boolean
  order: { id: number }
  owner: number
  pending: boolean
  source_data: {
    pan?: string
    sub_type?: string
    type?: string
  }
  success: boolean
  merchant_order_id?: string
}

export interface PaymobWebhookBody {
  type?: string
  obj: PaymobTransactionObj
}
