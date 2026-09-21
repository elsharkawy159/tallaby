export type KashierMode = 'test' | 'live'

export type KashierTransactionStatus = 'SUCCESS' | 'FAILURE' | 'PENDING'

export interface CreateKashierSessionInput {
  /** Unique per session. See buildKashierOrderReference. */
  orderReference: string
  amount: string | number
  currency: string
  customerEmail?: string | null
  customerReference?: string | null
  merchantRedirect: string
  display?: 'en' | 'ar'
  description?: string
  metaData?: Record<string, string>
}

export interface KashierSession {
  sessionId: string
  sessionUrl: string
}

export interface KashierWebhookData {
  amount: number | string
  channel?: string
  currency: string
  kashierOrderId?: string
  merchantOrderId: string
  method?: string
  orderReference?: string
  status: KashierTransactionStatus
  transactionId: string
  transactionResponseCode?: string
  signatureKeys: string[]
  [key: string]: unknown
}

export interface KashierWebhookBody {
  event: string
  data: KashierWebhookData
}
