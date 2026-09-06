import { hashMetaPhone, hashMetaPii } from './meta.hash'
import type {
  MetaCapiUserDataInput,
  SendMetaCapiEventParams,
} from './meta.types'

function getPixelId (): string | undefined {
  return process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID
}

function getAccessToken (): string | undefined {
  return process.env.META_CONVERSIONS_API_ACCESS_TOKEN
}

function getGraphVersion (): string {
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

/**
 * Send a server-side Conversions API event.
 * Quietly no-ops when pixel ID or access token are unset (local/dev).
 */
export async function sendMetaCapiEvent (
  params: SendMetaCapiEventParams
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const pixelId = getPixelId()
  const accessToken = getAccessToken()

  if (!pixelId || !accessToken) {
    return { success: true, skipped: true }
  }

  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: params.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        event_source_url: params.eventSourceUrl,
        action_source: params.actionSource ?? 'website',
        user_data: buildUserData(params.userData),
        custom_data: params.customData ?? {},
      },
    ],
  }

  if (testEventCode) {
    body.test_event_code = testEventCode
  }

  try {
    const url = `https://graph.facebook.com/${getGraphVersion()}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error('Meta CAPI error:', response.status, text)
      return { success: false, error: `Meta CAPI HTTP ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Meta CAPI request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Meta CAPI request failed',
    }
  }
}
