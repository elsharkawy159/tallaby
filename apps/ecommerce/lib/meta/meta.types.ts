export type MetaStandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'

export interface MetaContentParams {
  content_ids: string[]
  content_type: 'product'
  value?: number
  currency?: string
  num_items?: number
  contents?: Array<{
    id: string
    quantity: number
    item_price?: number
  }>
}

export interface TrackMetaEventOptions {
  eventId?: string
}

export type FbqCommand = 'init' | 'track' | 'trackCustom' | 'consent'

export interface FbqFunction {
  (command: 'init', pixelId: string, userData?: Record<string, unknown>): void
  (
    command: 'track' | 'trackCustom',
    eventName: string,
    params?: Record<string, unknown>,
    options?: { eventID?: string }
  ): void
  (command: 'consent', action: 'grant' | 'revoke'): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  loaded: boolean
  version: string
  push: (...args: unknown[]) => number
}

declare global {
  interface Window {
    fbq?: FbqFunction
    _fbq?: FbqFunction
  }
}

export interface MetaCapiUserDataInput {
  email?: string | null
  phone?: string | null
  externalId?: string | null
  clientIpAddress?: string | null
  clientUserAgent?: string | null
  fbp?: string | null
  fbc?: string | null
}

export interface MetaCapiCustomData {
  content_ids?: string[]
  content_type?: 'product'
  value?: number
  currency?: string
  num_items?: number
  contents?: Array<{
    id: string
    quantity: number
    item_price?: number
  }>
  order_id?: string
}

export interface SendMetaCapiEventParams {
  eventName: MetaStandardEvent
  eventId: string
  eventSourceUrl?: string
  customData?: MetaCapiCustomData
  userData?: MetaCapiUserDataInput
  actionSource?: 'website'
}
