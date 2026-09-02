/**
 * Fires the order-confirmation email via the Hono backend. Best-effort by
 * design: the order is already committed by the time this runs, so a failure
 * here is logged and swallowed — it must never surface as a failed checkout.
 *
 * The backend owns the idempotency claim (unique email_type + reference_id in
 * `email_deliveries`), so calling this twice for the same order — retries,
 * refreshes, duplicated requests — still sends exactly one email.
 */
export async function sendOrderConfirmationEmail(params: {
  orderId: string
  locale?: string
}): Promise<{ success: boolean; error?: string }> {
  const backendUrl = process.env.BACKEND_API_URL
  const apiSecret = process.env.INTERNAL_API_SECRET

  if (!backendUrl || !apiSecret) {
    console.error(
      'sendOrderConfirmationEmail: BACKEND_API_URL or INTERNAL_API_SECRET not configured; skipping email',
    )
    return { success: false, error: 'Email backend not configured' }
  }

  try {
    const res = await fetch(`${backendUrl}/api/emails/order-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiSecret}`,
      },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(
        'sendOrderConfirmationEmail: backend returned error:',
        res.status,
        body,
      )
      return { success: false, error: `Backend error ${res.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error(
      'sendOrderConfirmationEmail: failed to reach backend:',
      error,
    )
    return { success: false, error: 'Failed to reach email backend' }
  }
}
