import {
  getStoreMetaCapiCredentials,
  recordMetaCapiResult,
} from '@workspace/lib/integrations/server'
import { sendMetaCapiEvent } from './meta.server'
import { getMetaCapiUserData } from './meta.user'
import { toMetaContentIds } from './meta.product'
import { DEFAULT_CURRENCY } from '@/lib/constants'

/** Upper bound for the Graph call; it runs after the response, never in checkout. */
export const STORE_CAPI_TIMEOUT_MS = 5_000

export type StorePurchaseInput = {
  storeId: string
  order: { id: string; totalAmount: string | number; currency?: string | null }
  items: Array<{ productId: string; quantity: number | string | null }>
}

/**
 * The store's own server Purchase (PLAN.md §9.2, P7-05): sent to the Pixel
 * connected on that store, with `event_id = order id` so Meta dedupes it with
 * the browser Purchase. Credentials are loaded here, on the server, for the
 * store id the caller resolved from the request host; nothing is logged but
 * a redacted error. Never throws: the order is already committed.
 */
export async function sendStorePurchaseEvent ({ storeId, order, items }: StorePurchaseInput): Promise<void> {
  try {
    const credentials = await getStoreMetaCapiCredentials(storeId)
    if (!credentials) return

    const { userData, eventSourceUrl } = await getMetaCapiUserData()
    const result = await sendMetaCapiEvent(
      {
        eventName: 'Purchase',
        eventId: order.id,
        eventSourceUrl: eventSourceUrl ?? undefined,
        userData,
        customData: {
          content_ids: toMetaContentIds(items.map((item) => item.productId)),
          content_type: 'product',
          value: Number(order.totalAmount),
          currency: order.currency || DEFAULT_CURRENCY,
          num_items: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
          order_id: order.id,
        },
      },
      { credentials, timeoutMs: STORE_CAPI_TIMEOUT_MS }
    )

    if (!result.skipped) {
      await recordMetaCapiResult(
        storeId,
        result.success ? { ok: true } : { ok: false, error: result.error ?? 'Meta CAPI failed' }
      )
    }
  } catch {
    console.error('Store Meta CAPI Purchase failed')
  }
}
