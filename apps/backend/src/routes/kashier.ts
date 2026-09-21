import { Hono } from 'hono'
import { db, orders, payments, eq, and, inArray, sql } from '@workspace/db'
import {
  parseKashierOrderReference,
  verifyKashierWebhookSignature,
} from '@workspace/lib/kashier'
import type { KashierWebhookBody } from '@workspace/lib/kashier'
import { fulfillDigitalOrderItems } from '@workspace/lib/digital'

/**
 * Kashier accepts 200 (processed) or 409 (already processed) as an ack; any
 * other status makes it retry. Signature failures return 401 so a forged call
 * is never acknowledged.
 */
type Outcome = 'processed' | 'duplicate' | 'ignored' | 'not_found'

const app = new Hono()

app.post('/webhook', async (c) => {
  try {
    const paymentApiKey = process.env.KASHIER_PAYMENT_API_KEY
    if (!paymentApiKey) {
      return c.json({ error: 'Kashier is not configured' }, 500)
    }

    const body = (await c.req.json().catch(() => null)) as KashierWebhookBody | null
    const data = body?.data

    if (!body?.event || !data?.transactionId) {
      return c.json({ error: 'Invalid webhook payload' }, 400)
    }

    if (
      !verifyKashierWebhookSignature(
        data,
        c.req.header('x-kashier-signature'),
        paymentApiKey
      )
    ) {
      console.error('Kashier webhook signature verification failed', {
        transactionId: data.transactionId,
      })
      return c.json({ error: 'Invalid signature' }, 401)
    }

    const orderId = parseKashierOrderReference(data.merchantOrderId)
    if (!orderId) {
      // Not one of ours (or not an order payment). Ack so Kashier stops retrying.
      return c.json({ received: true, outcome: 'ignored' })
    }

    const outcome = await processKashierEvent(orderId, body)

    if (outcome === 'not_found') {
      return c.json({ error: 'Order not found' }, 404)
    }
    if (outcome === 'duplicate') {
      return c.json({ received: true, duplicate: true }, 409)
    }
    return c.json({ received: true, outcome })
  } catch (error) {
    console.error('Kashier webhook error:', error)
    return c.json({ error: 'Webhook processing failed' }, 500)
  }
})

async function processKashierEvent(
  orderId: string,
  body: KashierWebhookBody
): Promise<Outcome> {
  const { event, data } = body

  if (event === 'refund' || event === 'partial_refund') {
    return processRefund(orderId, body)
  }

  // Authorize/capture/void/reject/reversal are not part of the Tallaby order
  // lifecycle yet; acknowledge them rather than trigger endless retries.
  if (event !== 'pay') {
    return 'ignored'
  }

  const transactionId = String(data.transactionId)
  const now = new Date().toISOString()
  const paymentData = { provider: 'kashier', ...body }
  const amount = Number(data.amount).toFixed(2)

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })
  if (!order) return 'not_found'

  let outcome: Outcome = 'processed'
  let paid = false

  await db.transaction(async (tx) => {
    // Kashier retries and can deliver the same event concurrently, and the
    // payments table has no unique constraint on transaction_id. Serialise on
    // the transaction id so the check-then-write below is race free.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`kashier:${transactionId}`}))`
    )

    const existing = await tx.query.payments.findFirst({
      where: eq(payments.transactionId, transactionId),
    })

    // Idempotency is on transactionId + status: a PENDING row may legitimately
    // move to SUCCESS/FAILURE, but a settled row never changes again.
    if (existing && (existing.status === 'paid' || existing.status === 'failed')) {
      outcome = 'duplicate'
      return
    }
    if (existing && data.status === 'PENDING') {
      outcome = 'duplicate'
      return
    }

    const writePayment = async (values: {
      status: 'paid' | 'failed' | 'pending'
      errorMessage?: string
      capturedAt?: string
    }) => {
      const row = {
        orderId,
        amount,
        method: 'online_payment',
        currency: data.currency || order.currency || 'EGP',
        transactionId,
        paymentData,
        ...values,
      }
      if (existing) {
        await tx
          .update(payments)
          .set({ ...row, updatedAt: now })
          .where(eq(payments.id, existing.id))
      } else {
        await tx.insert(payments).values(row)
      }
    }

    if (data.status === 'SUCCESS') {
      const expected = Number(order.totalAmount).toFixed(2)
      if (
        amount !== expected ||
        (order.currency && data.currency !== order.currency)
      ) {
        // The provider says paid, but not the amount we asked for. Never
        // confirm the order on a mismatch; keep the record for manual review.
        console.error('Kashier amount/currency mismatch', {
          orderId,
          expected,
          received: amount,
          currency: data.currency,
        })
        await writePayment({
          status: 'pending',
          errorMessage: `Amount mismatch: expected ${expected} ${order.currency}, received ${amount} ${data.currency}`,
        })
        return
      }

      // Already settled by another transaction: record nothing, like Paymob.
      const [claimed] = await tx
        .update(orders)
        .set({
          paymentStatus: 'paid',
          status: 'confirmed',
          paidAt: now,
          processedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(orders.id, orderId),
            inArray(orders.paymentStatus, ['pending', 'failed'])
          )
        )
        .returning({ id: orders.id })

      if (!claimed) {
        outcome = 'duplicate'
        return
      }

      await writePayment({ status: 'paid', capturedAt: now })
      paid = true
      return
    }

    if (data.status === 'FAILURE') {
      await tx
        .update(orders)
        .set({ paymentStatus: 'failed', updatedAt: now })
        .where(and(eq(orders.id, orderId), eq(orders.paymentStatus, 'pending')))

      await writePayment({
        status: 'failed',
        errorMessage: data.transactionResponseCode
          ? `Payment failed (code ${data.transactionResponseCode})`
          : 'Payment failed',
      })
      return
    }

    // PENDING: keep the order payable/pending and remember the transaction.
    await writePayment({ status: 'pending' })
  })

  if (paid) {
    await fulfillDigitalOrderItems(orderId).catch((error) => {
      console.error('Digital fulfillment after Kashier payment failed:', error)
    })
  }

  return outcome
}

/**
 * Refunds only move the order's payment status; the guarded transition makes
 * redelivery a no-op. Order status (refunded/returned) stays an admin flow.
 */
async function processRefund(
  orderId: string,
  body: KashierWebhookBody
): Promise<Outcome> {
  if (body.data.status !== 'SUCCESS') return 'ignored'

  const next = body.event === 'refund' ? 'refunded' : 'partially_refunded'
  const from = next === 'refunded' ? ['paid', 'partially_refunded'] : ['paid']

  const updated = await db
    .update(orders)
    .set({
      paymentStatus: next,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(orders.id, orderId),
        inArray(orders.paymentStatus, from as ('paid' | 'partially_refunded')[])
      )
    )
    .returning({ id: orders.id })

  return updated.length > 0 ? 'processed' : 'duplicate'
}

export default app
