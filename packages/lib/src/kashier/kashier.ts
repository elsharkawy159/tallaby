import { formatKashierAmount } from './kashier.lib'
import type {
  CreateKashierSessionInput,
  KashierMode,
  KashierSession,
} from './kashier.types'

export interface KashierConfig {
  secretKey: string
  paymentApiKey: string
  merchantId: string
  mode: KashierMode
  webhookUrl: string
  allowedMethods: string
}

const API_BASE_URL: Record<KashierMode, string> = {
  test: 'https://test-api.kashier.io',
  live: 'https://api.kashier.io',
}

/** Server-only: reads secrets. Never import from client components. */
export function getKashierConfig(): KashierConfig | null {
  const secretKey = process.env.KASHIER_SECRET_KEY
  const paymentApiKey = process.env.KASHIER_PAYMENT_API_KEY
  const merchantId = process.env.KASHIER_MERCHANT_ID
  const webhookUrl = process.env.KASHIER_WEBHOOK_URL

  if (!secretKey || !paymentApiKey || !merchantId || !webhookUrl) {
    return null
  }

  return {
    secretKey,
    paymentApiKey,
    merchantId,
    webhookUrl,
    mode: process.env.KASHIER_MODE === 'live' ? 'live' : 'test',
    allowedMethods: process.env.KASHIER_ALLOWED_METHODS || 'card,wallet',
  }
}

export function isKashierConfigured(): boolean {
  return getKashierConfig() !== null
}

export async function createKashierSession(
  config: KashierConfig,
  input: CreateKashierSessionInput
): Promise<KashierSession> {
  const response = await fetch(
    `${API_BASE_URL[config.mode]}/v3/payment/sessions`,
    {
      method: 'POST',
      headers: {
        Authorization: config.secretKey,
        'api-key': config.paymentApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: config.merchantId,
        order: input.orderReference,
        amount: formatKashierAmount(input.amount),
        currency: input.currency,
        type: 'one-time',
        allowedMethods: config.allowedMethods,
        merchantRedirect: input.merchantRedirect,
        serverWebhook: config.webhookUrl,
        display: input.display ?? 'en',
        description: input.description,
        customer: {
          email: input.customerEmail || undefined,
          reference: input.customerReference || undefined,
        },
        metaData: input.metaData,
      }),
    }
  )

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      `Kashier session failed (${response.status}): ${JSON.stringify(body)}`
    )
  }

  const payload = body?.data ?? body
  if (!payload?.sessionUrl || !payload?.sessionId) {
    throw new Error('Kashier session response missing sessionUrl/sessionId')
  }

  return { sessionId: payload.sessionId, sessionUrl: payload.sessionUrl }
}
