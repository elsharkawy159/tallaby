import {
  postMetaCapiEvents,
  type MetaCapiCredentials,
} from '@workspace/lib/integrations'
import { hashMetaPhone, hashMetaPii } from './meta.hash'
import type {
  MetaCapiUserDataInput,
  SendMetaCapiEventParams,
} from './meta.types'

function getPixelId (): string | undefined {
  return process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID
}

function getAccessToken (): string | undefined {
  return process.env.META_CAPI_TOKEN
}

export function getGraphVersion (): string {
  return process.env.META_GRAPH_API_VERSION || 'v21.0'
}

function buildUserData (input?: MetaCapiUserDataInput): Record<string, unknown> {
  if (!input) return {}

  const userData: Record<string, unknown> = {}

  const email = hashMetaPii(input.email)
  if (email) userData.em = [email]

  const phone = hashMetaPhone(input.phone)
  if (phone) userData.ph = [phone]

  const externalId = hashMetaPii(input.externalId)
  if (externalId) userData.external_id = [externalId]

  if (input.clientIpAddress) {
    userData.client_ip_address = input.clientIpAddress
  }
  if (input.clientUserAgent) {
    userData.client_user_agent = input.clientUserAgent
  }
  if (input.fbp) userData.fbp = input.fbp
  if (input.fbc) userData.fbc = input.fbc

  return userData
}

/** The single CAPI event body, shared by Tallaby's and the stores' CAPI. */
export function buildMetaCapiEvent (
  params: SendMetaCapiEventParams,
  now = Date.now()
): Record<string, unknown> {
  return {
    event_name: params.eventName,
    event_time: Math.floor(now / 1000),
    event_id: params.eventId,
    event_source_url: params.eventSourceUrl,
    action_source: params.actionSource ?? 'website',
    user_data: buildUserData(params.userData),
    custom_data: params.customData ?? {},
  }
}

/**
 * Send a server-side Conversions API event.
 *
 * Without `credentials` this is Tallaby's marketplace CAPI (env Pixel + token)
 * and quietly no-ops when they are unset (local/dev). With `credentials` (a
 * store's own Pixel and token, PLAN.md P7-05) the env is never used. The
 * token travels in the request body; errors are redacted before logging.
 */
export async function sendMetaCapiEvent (
  params: SendMetaCapiEventParams,
  options: { credentials?: MetaCapiCredentials; timeoutMs?: number } = {}
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const credentials: MetaCapiCredentials | null = options.credentials ?? (() => {
    const pixelId = getPixelId()
    const accessToken = getAccessToken()
    return pixelId && accessToken
      ? { pixelId, accessToken, testEventCode: process.env.META_CAPI_TEST_EVENT_CODE || null }
      : null
  })()

  if (!credentials) {
    return { success: true, skipped: true }
  }

  const result = await postMetaCapiEvents(credentials, [buildMetaCapiEvent(params)], {
    graphVersion: getGraphVersion(),
    timeoutMs: options.timeoutMs,
  })

  if (!result.ok) {
    console.error(options.credentials ? 'Store Meta CAPI error:' : 'Meta CAPI error:', result.error)
    return { success: false, error: result.error }
  }

  return { success: true }
}
