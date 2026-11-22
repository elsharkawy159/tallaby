import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuthUsers } from '../../../db/src/testing/auth-users'
import * as DB_SCHEMA from '@workspace/db/schema'
import type { IsolationWorld } from '../stores/isolation.fixtures'
import type { StorefrontCheckoutPayments } from '../payments/store-methods'
import { amountToPiastres, customerTallabyPayFee } from '../tallaby-pay/fee.lib'

/**
 * Who pays the Tallaby Pay fee (ROADMAP.md F-100j) through placeOrderFromCart
 * against a real database: a customer-pays store's Tallaby Pay order is stored
 * at base + fee with the fee in orders.payment_fee_amount and the snapshot; a
 * seller-pays store's order is unchanged; COD (even with a Tallaby Pay deposit)
 * never gets the fee. The rate is read from billing_settings, like checkout.
 * Skipped when TEST_DATABASE_URL is unset (needs 0175 and 0178). Creates and
 * deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

describe.skipIf(!TEST_DATABASE_URL)('Tallaby Pay fee payer at placement (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const buyer = randomUUID()
  const integrationId = randomUUID()
  let w: IsolationWorld
  let placeOrderFromCart: typeof import('./place-order').placeOrderFromCart
  let feeBps = 0
  let productId = ''
  let addressId = ''

  const payments = (feePayer: 'seller' | 'customer', deposit: { percent: 20 } | null = null): StorefrontCheckoutPayments => ({
    methods: ['cash_on_delivery', 'online_payment'],
    gateway: { provider: 'tallaby_pay', integrationId, feePayer },
    currency: 'EGP',
    codMaxOrder: null,
    codNote: null,
    transfers: {},
    deposit,
  })

  async function place (paymentMethod: string, checkout: StorefrontCheckoutPayments) {
    const [cart] = await db
      .insert(s.carts)
      .values({ userId: buyer, currency: 'EGP', storeId: w.a.a1, storeSellerId: w.a.sellerId })
      .returning({ id: s.carts.id })
    await db.insert(s.cartItems).values({ cartId: cart!.id, productId, sellerId: w.a.sellerId, price: '123.45', quantity: 1 })
    const result = await placeOrderFromCart({
      userId: buyer,
      cartId: cart!.id,
      shippingAddressId: addressId,
      paymentMethod,
      orderSource: 'storefront',
      sendConfirmationEmail: false,
      storefrontPayments: checkout,
    })
    if (!result.success) throw new Error(`placeOrderFromCart failed: ${result.error}`)
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, result.data.order.id))
    return order!
  }

  /** subtotal + shipping + tax − discounts: what the order costs before any Tallaby Pay fee. */
  const basePiastres = (order: typeof s.orders.$inferSelect) =>
    amountToPiastres(order.subtotal) + amountToPiastres(order.shippingCost ?? '0') + amountToPiastres(order.tax ?? '0') -
    amountToPiastres(order.discountAmount ?? '0')

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ;({ placeOrderFromCart } = await import('./place-order'))
    const { getTallabyPaySettings } = await import('../tallaby-pay/settings.server')
    feeBps = (await getTallabyPaySettings()).feeBps
    const { createIsolationWorld } = await import('../stores/isolation.fixtures')
    w = await createIsolationWorld(db)

    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: w.a.sellerId, storeId: w.a.a1, categoryId: category!.id, status: 'active', quantity: '100', sku: `tpf-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id })
    productId = product!.id

    await createAuthUsers(buyer)
    await db.insert(s.users).values({ id: buyer, isGuest: false, role: 'customer' })
    const [address] = await db
      .insert(s.userAddresses)
      .values({ userId: buyer, fullName: 'Fee Payer Test', phone: '01012345678', addressLine1: '1 Test St', city: 'Nasr City', state: 'Cairo', postalCode: '11765' })
      .returning({ id: s.userAddresses.id })
    addressId = address!.id
  }, 120_000)

  afterAll(async () => {
    const orderIds = (await db.select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.userId, buyer))).map((r) => r.id)
    if (orderIds.length) {
      await db.delete(s.sellerNotifications).where(sql`${s.sellerNotifications.data} ->> 'orderId' = ANY(${orderIds})`)
      await db.delete(s.orderItems).where(inArray(s.orderItems.orderId, orderIds))
      await db.delete(s.orders).where(inArray(s.orders.id, orderIds))
    }
    await db.delete(s.carts).where(eq(s.carts.userId, buyer))
    if (productId) await db.delete(s.products).where(eq(s.products.id, productId))
    await db.delete(s.userAddresses).where(eq(s.userAddresses.userId, buyer))
    await db.delete(s.users).where(eq(s.users.id, buyer))
    await w?.cleanup()
    await client.end()
  })

  it('customer pays: total = base + round_half_up(base × bps), fee stored and snapshotted', async () => {
    const order = await place('online_payment', payments('customer'))
    const base = basePiastres(order)
    const { feePiastres, chargedPiastres } = customerTallabyPayFee(base, feeBps)
    expect(amountToPiastres(order.totalAmount)).toBe(chargedPiastres)
    expect(amountToPiastres(order.paymentFeeAmount)).toBe(feePiastres)
    expect(order.status).toBe('payment_processing')
    expect((order.metadata as { tallabyPay: unknown }).tallabyPay).toMatchObject({
      feeBps,
      feePayer: 'customer',
      customerFeePiastres: feePiastres,
    })
    // The gateway snapshot never carries the checkout's feePayer.
    expect((order.metadata as { paymentGateway: unknown }).paymentGateway).toEqual({ provider: 'tallaby_pay', integrationId })
  })

  it('seller pays: the order is exactly as before (no fee, no feePayer)', async () => {
    const order = await place('online_payment', payments('seller'))
    expect(amountToPiastres(order.totalAmount)).toBe(basePiastres(order))
    expect(order.paymentFeeAmount).toBe('0.00')
    const snapshot = (order.metadata as { tallabyPay: Record<string, unknown> }).tallabyPay
    expect(snapshot).toEqual({ feeBps, holdDays: expect.any(Number), termsVersion: expect.any(String) })
  })

  it('COD never gets the fee, even with a Tallaby Pay deposit on a customer-pays store', async () => {
    const cod = await place('cash_on_delivery', payments('customer'))
    expect(cod.paymentFeeAmount).toBe('0.00')
    expect(amountToPiastres(cod.totalAmount)).toBe(basePiastres(cod))

    const withDeposit = await place('cash_on_delivery', payments('customer', { percent: 20 }))
    expect(withDeposit.paymentFeeAmount).toBe('0.00')
    expect(amountToPiastres(withDeposit.totalAmount)).toBe(basePiastres(withDeposit))
    expect(withDeposit.depositStatus).toBe('awaiting')
    expect((withDeposit.metadata as { tallabyPay: Record<string, unknown> }).tallabyPay).not.toHaveProperty('feePayer')
  })
})
