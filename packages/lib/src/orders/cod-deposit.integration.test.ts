import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuthUsers } from '../../../db/src/testing/auth-users'
import * as DB_SCHEMA from '@workspace/db/schema'
import type { IsolationWorld } from '../stores/isolation.fixtures'
import type { StorefrontCheckoutPayments } from '../payments/store-methods'

/**
 * COD deposit (ROADMAP.md F-21) end to end against a real database: the deposit
 * placeOrderFromCart stores, the seller's confirm / reject (store-scoped,
 * idempotent) and the 48 h expiry, which cancels and puts the stock back.
 * Skipped when TEST_DATABASE_URL is unset (needs 0166). Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

describe.skipIf(!TEST_DATABASE_URL)('COD deposit (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const buyer = randomUUID()
  let w: IsolationWorld
  let lib: typeof import('./cod-deposit.server')
  let placeOrderFromCart: typeof import('./place-order').placeOrderFromCart
  let productId = ''
  let addressId = ''

  const storefrontPayments: StorefrontCheckoutPayments = {
    methods: ['cash_on_delivery', 'vodafone_cash'],
    gateway: null,
    currency: 'EGP',
    codMaxOrder: null,
    codNote: null,
    transfers: { vodafone_cash: { method: 'vodafone_cash', holderName: 'Seller', phone: '01012345678' } },
    deposit: { percent: 20 },
  }

  async function cart (price: string, qty = 1) {
    const [row] = await db
      .insert(s.carts)
      .values({ userId: buyer, currency: 'EGP', storeId: w.a.a1, storeSellerId: w.a.sellerId })
      .returning({ id: s.carts.id })
    await db.insert(s.cartItems).values({ cartId: row!.id, productId, sellerId: w.a.sellerId, price, quantity: qty })
    return row!.id
  }

  async function placeCod (price: string, payments: StorefrontCheckoutPayments = storefrontPayments) {
    const result = await placeOrderFromCart({
      userId: buyer,
      cartId: await cart(price),
      shippingAddressId: addressId,
      paymentMethod: 'cash_on_delivery',
      orderSource: 'storefront',
      sendConfirmationEmail: false,
      storefrontPayments: payments,
    })
    if (!result.success) throw new Error(`placeOrderFromCart failed: ${result.error}`)
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, result.data.order.id))
    return order!
  }

  const stock = async () =>
    Number((await db.select({ q: s.products.quantity }).from(s.products).where(eq(s.products.id, productId)))[0]!.q)

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ;({ placeOrderFromCart } = await import('./place-order'))
    lib = await import('./cod-deposit.server')
    const { createIsolationWorld } = await import('../stores/isolation.fixtures')
    w = await createIsolationWorld(db)

    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: w.a.sellerId, storeId: w.a.a1, categoryId: category!.id, status: 'active', quantity: '100', sku: `dep-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id })
    productId = product!.id

    await createAuthUsers(buyer)
    await db.insert(s.users).values({ id: buyer, isGuest: false, role: 'customer' })
    const [address] = await db
      .insert(s.userAddresses)
      .values({ userId: buyer, fullName: 'Deposit Test', phone: '01012345678', addressLine1: '1 Test St', city: 'Nasr City', state: 'Cairo', postalCode: '11765' })
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

  it('stores the deposit from the server total, rounded up to 5, with the seller snapshot', async () => {
    const order = await placeCod('1213.00')
    const total = Number(order.totalAmount)
    const expected = Math.min(total, Math.ceil((Math.round(total * 100) * 20) / 50_000) * 5)
    expect(order).toMatchObject({ depositStatus: 'awaiting', depositPercent: 20, paymentMethod: 'cash_on_delivery', status: 'pending' })
    expect(Number(order.depositAmount)).toBe(expected)
    expect((order.metadata as { deposit: { transfers: unknown[] } }).deposit.transfers).toHaveLength(1)
  })

  it('asks no deposit when the store has none', async () => {
    const order = await placeCod('100.00', { ...storefrontPayments, deposit: null })
    expect(order.depositStatus).toBeNull()
    expect(order.depositAmount).toBeNull()
  })

  it('lets only the store owner confirm, once', async () => {
    const order = await placeCod('500.00')
    expect(await lib.confirmOrderDeposit(w.b.sellerId, order.id)).toEqual({ success: false, error: 'not_found' })
    expect(await lib.markDepositReported(order.id)).toBe(true)
    expect(await lib.confirmOrderDeposit(w.a.sellerId, order.id)).toEqual({ success: true, alreadyPaid: false })
    expect(await lib.confirmOrderDeposit(w.a.sellerId, order.id)).toEqual({ success: true, alreadyPaid: true })
    const [row] = await db.select().from(s.orders).where(eq(s.orders.id, order.id))
    expect(row).toMatchObject({ depositStatus: 'paid', status: 'pending' })
    expect(row!.depositPaidAt).not.toBeNull()
    expect(await lib.rejectOrderDeposit(w.a.sellerId, order.id)).toEqual({ success: false, error: 'already_paid' })
  })

  it('puts a rejected transfer back to awaiting', async () => {
    const order = await placeCod('300.00')
    await lib.markDepositReported(order.id)
    expect(await lib.rejectOrderDeposit(w.a.sellerId, order.id)).toEqual({ success: true })
    const [row] = await db.select({ depositStatus: s.orders.depositStatus }).from(s.orders).where(eq(s.orders.id, order.id))
    expect(row!.depositStatus).toBe('awaiting')
  })

  it('cancels an unpaid deposit after 48 h and returns the stock, idempotently', async () => {
    const before = await stock()
    const order = await placeCod('200.00')
    expect(await stock()).toBe(before - 1)
    await db.update(s.orders).set({ createdAt: sql`now() - interval '49 hours'` }).where(eq(s.orders.id, order.id))
    const first = await lib.expireUnpaidDeposits()
    expect(first.expired).toBeGreaterThanOrEqual(1)
    const [row] = await db.select({ status: s.orders.status }).from(s.orders).where(eq(s.orders.id, order.id))
    expect(row!.status).toBe('cancelled')
    expect(await stock()).toBe(before)
    await lib.expireUnpaidDeposits()
    expect(await stock()).toBe(before)
  })

  it('leaves a reported deposit for the seller', async () => {
    const order = await placeCod('200.00')
    await lib.markDepositReported(order.id)
    await db.update(s.orders).set({ createdAt: sql`now() - interval '49 hours'` }).where(eq(s.orders.id, order.id))
    await lib.expireUnpaidDeposits()
    const [row] = await db.select({ status: s.orders.status }).from(s.orders).where(eq(s.orders.id, order.id))
    expect(row!.status).toBe('pending')
  })
})
