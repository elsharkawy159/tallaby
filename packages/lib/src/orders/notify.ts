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
