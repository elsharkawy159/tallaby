/**
 * Transactional email triggers. Each one asks the Hono backend
 * (`apps/backend/src/routes/emails.ts`) to send, AFTER the caller's
 * transaction has committed. Best-effort by design: a failure is logged and
 * swallowed, never surfaced as a failed checkout, status change or top-up.
 *
 * The backend owns the idempotency claim (unique email_type + reference_id in
 * `email_deliveries`), so calling a trigger twice for the same event —
 * retries, refreshes, two code paths reaching the same status — still sends
 * one email.
 */

type EmailResult = { success: boolean; error?: string }

async function postEmail(
  path: string,
  body: Record<string, unknown>,
): Promise<EmailResult> {
  const backendUrl = process.env.BACKEND_API_URL
  const apiSecret = process.env.INTERNAL_API_SECRET

  if (!backendUrl || !apiSecret) {
    console.error(
      `email ${path}: BACKEND_API_URL or INTERNAL_API_SECRET not configured; skipping email`,
    )
    return { success: false, error: 'Email backend not configured' }
  }

  try {
    const res = await fetch(`${backendUrl}/api/emails/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiSecret}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`email ${path}: backend returned error:`, res.status, text)
      return { success: false, error: `Backend error ${res.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error(`email ${path}: failed to reach backend:`, error)
    return { success: false, error: 'Failed to reach email backend' }
  }
}

/** Customer order confirmation. */
export async function sendOrderConfirmationEmail(params: {
  orderId: string
  locale?: string
}): Promise<EmailResult> {
  return postEmail('order-confirmation', params)
}

export type OrderEmailEvent = 'placed' | 'shipped' | 'delivered' | 'cancelled'
export type OrderCancelledBy = 'customer' | 'seller' | 'system'

/**
 * One order lifecycle step:
 * - `placed`: seller "new order" + low-stock alert (call again when an online
 *   payment confirms the order; `payment_processing` orders are skipped)
 * - `shipped` / `delivered`: customer mail
 * - `cancelled`: customer mail + seller mail (unless the seller cancelled)
 */
export async function sendOrderEventEmail(
  orderId: string,
  event: OrderEmailEvent,
  cancelledBy?: OrderCancelledBy,
): Promise<EmailResult> {
  return postEmail('order-event', { orderId, event, ...(cancelledBy ? { cancelledBy } : {}) })
}

/** Money actually returned to the customer (wallet credit or card refund). */
export async function sendRefundIssuedEmail(params: {
  orderId: string
  method: 'wallet' | 'original' | 'manual'
  amount?: string | number
}): Promise<EmailResult> {
  return postEmail('refund-issued', params)
}

/** Store-wallet top-up credited. */
export async function sendStoreWalletTopUpEmail(params: {
  topUpId: string
  balanceAfter?: string | number
}): Promise<EmailResult> {
  return postEmail('store-wallet-top-up', params)
}

/** Seller onboarding mail for a new store. */
export async function sendStoreCreatedEmail(storeId: string): Promise<EmailResult> {
  return postEmail('store-created', { storeId })
}

/** Abandoned-cart reminder (the daily cron). */
export async function sendAbandonedCartEmail(cartId: string): Promise<EmailResult> {
  return postEmail('abandoned-cart', { cartId })
}

/** Back-in-stock alert for one claimed subscription (the stock-alerts cron, 0126). */
export async function sendBackInStockEmail(subscriptionId: string): Promise<EmailResult> {
  return postEmail('back-in-stock', { subscriptionId })
}

/**
 * A theme request is ready or declined (ROADMAP.md F-77): the seller's mail.
 * The backend reads the request's current status and claims one email per
 * (status, request), so a repeat call sends nothing.
 */
export async function sendThemeRequestUpdateEmail(requestId: string): Promise<EmailResult> {
  return postEmail('theme-request-update', { requestId })
}

/**
 * A Tallaby Pay withdrawal was paid or rejected (ROADMAP.md F-100g). The
 * backend reads the payout's current status and claims one email per
 * (outcome, payout).
 */
export async function sendTallabyPayPayoutEmail(payoutId: string): Promise<EmailResult> {
  return postEmail('tallaby-pay-payout', { payoutId })
}

/** A seller's Tallaby Pay identity was not verified (F-100g): one email per rejection. */
export async function sendTallabyPayKycRejectedEmail(sellerId: string): Promise<EmailResult> {
  return postEmail('tallaby-pay-kyc-rejected', { sellerId })
}

// ── WhatsApp order messages (ROADMAP.md F-109, docs/whatsapp.md §4) ──────

export type OrderWhatsAppEvent =
  | 'order_placed'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'

/** A failed read (0180 not applied, DB hiccup) keeps WhatsApp off this long, so order paths don't retry it. */
const WHATSAPP_OFF_BACKOFF_MS = 5 * 60_000
const WHATSAPP_POST_TIMEOUT_MS = 3_000
let whatsAppOffUntil = 0
let whatsAppWarned = false

/**
 * Admin's WhatsApp switch (`whatsapp_settings.enabled`), one primary-key read.
 * Uncached on purpose (rule 8); a failure counts as off and is logged once
 * per process.
 */
async function isWhatsAppSwitchedOn(): Promise<boolean> {
  if (Date.now() < whatsAppOffUntil) return false
  try {
    const { db, eq, whatsappSettings } = await import('@workspace/db')
    const [row] = await db
      .select({ enabled: whatsappSettings.enabled })
      .from(whatsappSettings)
      .where(eq(whatsappSettings.id, 1))
      .limit(1)
    return row?.enabled === true
  } catch (error) {
    whatsAppOffUntil = Date.now() + WHATSAPP_OFF_BACKOFF_MS
    if (!whatsAppWarned) {
      whatsAppWarned = true
      console.error('whatsapp: settings unavailable, treating WhatsApp as off', (error as Error)?.name)
    }
    return false
  }
}

/**
 * Queue a WhatsApp message for an order event, AFTER the caller's commit.
 * Best-effort and cheap: while Admin's switch is off (the default) it is one
 * small read and no network call; it never throws, and the backend call is
 * capped at 3 s. The backend applies every other gate and the dedupe (one
 * message per order and event), so calling it twice is harmless.
 */
export async function notifyOrderWhatsApp(
  orderId: string,
  event: OrderWhatsAppEvent,
  opts: { byCustomerButton?: boolean } = {},
): Promise<void> {
  try {
    const backendUrl = process.env.BACKEND_API_URL
    const apiSecret = process.env.INTERNAL_API_SECRET
    if (!backendUrl || !apiSecret) return
    if (!(await isWhatsAppSwitchedOn())) return
    const res = await fetch(`${backendUrl}/api/whatsapp/order-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiSecret}` },
      body: JSON.stringify({ orderId, event, ...(opts.byCustomerButton ? { byCustomerButton: true } : {}) }),
      signal: AbortSignal.timeout(WHATSAPP_POST_TIMEOUT_MS),
    })
    if (!res.ok && res.status !== 404) console.error(`whatsapp order-event: backend returned ${res.status}`)
  } catch (error) {
    console.error('whatsapp order-event: failed to reach backend', (error as Error)?.name)
  }
}
