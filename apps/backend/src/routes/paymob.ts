import { Hono } from 'hono'
import { z } from 'zod'
import {
  db,
  orders,
  payments,
  eq,
  and,
  inArray,
} from '@workspace/db'
import {
  amountToCents,
  buildBillingData,
  buildPaymobCheckoutUrl,
  createPaymobIntention,
  getPaymobConfig,
  isPaymobConfigured,
  verifyPaymobTransactionHmac,
} from '@workspace/lib/paymob'
import { fulfillDigitalOrderItems } from '@workspace/lib/digital'
import type { PaymobWebhookBody } from '@workspace/lib/paymob'

const intentionSchema = z.object({
  orderId: z.string().uuid(),
})

const app = new Hono()

app.post('/intention', async (c) => {
  try {
    if (!isPaymobConfigured()) {
      return c.json({ error: 'Paymob is not configured' }, 503)
    }

    const body = await c.req.json()
    const parsed = intentionSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
    }

    const config = getPaymobConfig()
    if (!config) {
      return c.json({ error: 'Paymob is not configured' }, 503)
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parsed.data.orderId),
      with: {
        orderItems: true,
        userAddress_shippingAddressId: true,
        userAddress_billingAddressId: true,
        user: true,
      },
    })

    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    if (order.paymentMethod !== 'online_payment') {
      return c.json({ error: 'Order is not an online payment order' }, 400)
    }

    if (!['pending', 'failed'].includes(order.paymentStatus ?? 'pending')) {
      return c.json({ error: 'Order payment is not payable' }, 400)
    }

    const address =
      order.userAddress_shippingAddressId || order.userAddress_billingAddressId
    const user = order.user

    const billingData = buildBillingData({
      fullName: address?.fullName || user?.fullName || 'Customer',
      phone: address?.phone || user?.phone || '+201000000000',
      email: user?.email || 'customer@tallaby.com',
      addressLine1: address?.addressLine1 || 'NA',
      addressLine2: address?.addressLine2,
      city: address?.city || 'Cairo',
      state: address?.state || 'Cairo',
      country: address?.country,
      postalCode: address?.postalCode,
    })

    const totalCents = amountToCents(order.totalAmount)
    const items =
      order.orderItems.length > 0
        ? order.orderItems.map((item) => ({
            name: item.productName,
            amount: amountToCents(item.total),
            description: item.productName,
            quantity: item.quantity,
          }))
        : [
            {
              name: `Order ${order.orderNumber}`,
              amount: totalCents,
              description: `Order ${order.orderNumber}`,
              quantity: 1,
            },
          ]

    const ecommerceUrl = config.ecommerceUrl || 'http://localhost:3000'
    const intention = await createPaymobIntention({
      amount: totalCents,
      currency: order.currency || 'EGP',
      paymentMethods: [config.cardIntegrationId],
      items,
      billingData,
      specialReference: order.id,
      notificationUrl: config.webhookUrl,
      redirectionUrl: `${ecommerceUrl}/orders/${order.id}`,
    })

    return c.json({
      clientSecret: intention.client_secret,
      publicKey: config.publicKey,
      checkoutUrl: buildPaymobCheckoutUrl(
        config.publicKey,
        intention.client_secret
      ),
      intentionId: intention.id,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Paymob intention error:', error)
    return c.json({ error: 'Failed to create payment intention' }, 500)
  }
})

app.post('/webhook', async (c) => {
  try {
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET
    if (!hmacSecret) {
      return c.json({ error: 'HMAC secret not configured' }, 500)
    }

    const hmac = c.req.query('hmac')
    if (!hmac) {
      return c.json({ error: 'Missing HMAC' }, 400)
    }

    const body = (await c.req.json()) as PaymobWebhookBody
    const transaction = body?.obj

    if (!transaction?.id) {
      return c.json({ error: 'Invalid webhook payload' }, 400)
    }

    if (!verifyPaymobTransactionHmac(transaction, hmac, hmacSecret)) {
      console.error('Paymob webhook HMAC verification failed', {
        transactionId: transaction.id,
      })
      return c.json({ error: 'Invalid HMAC' }, 400)
    }

    const orderId = transaction.merchant_order_id
    if (!orderId) {
      return c.json({ error: 'Missing merchant order reference' }, 400)
    }

    const transactionId = String(transaction.id)
    const now = new Date().toISOString()

    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.transactionId, transactionId),
    })

    if (existingPayment) {
      return c.json({ received: true, duplicate: true })
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    })

    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    if (transaction.success) {
      await db.transaction(async (tx) => {
        const duplicate = await tx.query.payments.findFirst({
          where: eq(payments.transactionId, transactionId),
        })

        if (duplicate) {
          return
        }

        const currentOrder = await tx.query.orders.findFirst({
          where: eq(orders.id, orderId),
        })

        if (!currentOrder) {
          return
        }

        if (currentOrder.paymentStatus === 'paid') {
          return
        }

        await tx
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

        await tx.insert(payments).values({
          orderId,
          amount: (transaction.amount_cents / 100).toFixed(2),
          method: 'online_payment',
          currency: transaction.currency || order.currency || 'EGP',
          status: 'paid',
          transactionId,
          paymentData: body,
          capturedAt: now,
        })
      })

      await fulfillDigitalOrderItems(orderId).catch((error) => {
        console.error('Digital fulfillment after Paymob payment failed:', error)
      })
    } else {
      const duplicateFailed = await db.query.payments.findFirst({
        where: eq(payments.transactionId, transactionId),
      })

      if (!duplicateFailed) {
        await db
          .update(orders)
          .set({
            paymentStatus: 'failed',
            updatedAt: now,
          })
          .where(
            and(
              eq(orders.id, orderId),
              inArray(orders.paymentStatus, ['pending'])
            )
          )

        await db.insert(payments).values({
          orderId,
          amount: (transaction.amount_cents / 100).toFixed(2),
          method: 'online_payment',
          currency: transaction.currency || order.currency || 'EGP',
          status: 'failed',
          transactionId,
          paymentData: body,
          errorMessage: transaction.error_occured ? 'Payment failed' : 'Payment declined',
        })
      }
    }

    return c.json({ received: true })
  } catch (error) {
    console.error('Paymob webhook error:', error)
    return c.json({ error: 'Webhook processing failed' }, 500)
  }
})

export default app
