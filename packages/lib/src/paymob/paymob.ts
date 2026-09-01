import {
  PAYMOB_EGYPT_BASE_URL,
} from './paymob.lib'
import type {
  CreateIntentionInput,
  PaymobIntentionResponse,
} from './paymob.types'

export interface PaymobConfig {
  secretKey: string
  publicKey: string
  cardIntegrationId: number
  webhookUrl?: string
  ecommerceUrl?: string
}

export function getPaymobConfig(): PaymobConfig | null {
  const secretKey = process.env.PAYMOB_SECRET_KEY
  const publicKey = process.env.PAYMOB_PUBLIC_KEY
  const integrationId = process.env.PAYMOB_CARD_INTEGRATION_ID

  if (!secretKey || !publicKey || !integrationId) {
    return null
  }

  return {
    secretKey,
    publicKey,
    cardIntegrationId: Number.parseInt(integrationId, 10),
    webhookUrl: process.env.PAYMOB_WEBHOOK_URL,
    ecommerceUrl: process.env.ECOMMERCE_URL,
  }
}

export function isPaymobConfigured(): boolean {
  const config = getPaymobConfig()
  return Boolean(config && Number.isFinite(config.cardIntegrationId))
}

export async function createPaymobIntention(
  input: CreateIntentionInput
): Promise<PaymobIntentionResponse> {
  const secretKey = process.env.PAYMOB_SECRET_KEY
  if (!secretKey) {
    throw new Error('PAYMOB_SECRET_KEY is not configured')
  }

  const response = await fetch(`${PAYMOB_EGYPT_BASE_URL}/v1/intention/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      payment_methods: input.paymentMethods,
      items: input.items,
      billing_data: input.billingData,
      special_reference: input.specialReference,
      notification_url: input.notificationUrl,
      redirection_url: input.redirectionUrl,
    }),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const detail =
      typeof body?.detail === 'string'
        ? body.detail
        : JSON.stringify(body)
    throw new Error(`Paymob intention failed (${response.status}): ${detail}`)
  }

  if (!body?.client_secret) {
    throw new Error('Paymob intention response missing client_secret')
  }

  return body as PaymobIntentionResponse
}

export function buildPaymobCheckoutUrl(publicKey: string, clientSecret: string): string {
  const params = new URLSearchParams({
    publicKey,
    clientSecret,
  })

  return `${PAYMOB_EGYPT_BASE_URL}/unifiedcheckout/?${params.toString()}`
}

export function buildPaymobPixelScriptUrl(): string {
  return `${PAYMOB_EGYPT_BASE_URL}/unifiedcheckout/static/scripts/paymob-sdk.js`
}
