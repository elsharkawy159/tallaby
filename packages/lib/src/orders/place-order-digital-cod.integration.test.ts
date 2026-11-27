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
 * Digital products take no cash on delivery (ROADMAP.md F-108b): placeOrderFromCart
 * refuses a COD storefront order, even a forged one whose store payments still list
 * COD and a deposit, for a cart with a digital product, before any stock or order
 * row; another method still places it, and a physical cart keeps COD.
 * Skipped when TEST_DATABASE_URL is unset. Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

describe.skipIf(!TEST_DATABASE_URL)('digital products and cash on delivery (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const buyer = randomUUID()
  let w: IsolationWorld
  let placeOrderFromCart: typeof import('./place-order').placeOrderFromCart
  let physicalId = ''
  let digitalId = ''
  let addressId = ''

  // As a forged request would see them: COD offered, with a deposit.
  const payments: StorefrontCheckoutPayments = {
    methods: ['cash_on_delivery', 'vodafone_cash'],
    gateway: null,
    currency: 'EGP',
    codMaxOrder: null,
    codNote: null,
    transfers: { vodafone_cash: { method: 'vodafone_cash', holderName: 'Seller', phone: '01012345678' } },
    deposit: { percent: 20 },
  }

  async function cart (productIds: string[]) {
    const [row] = await db
      .insert(s.carts)
      .values({ userId: buyer, currency: 'EGP', storeId: w.a.a1, storeSellerId: w.a.sellerId })
      .returning({ id: s.carts.id })
    for (const productId of productIds) {
      await db.insert(s.cartItems).values({ cartId: row!.id, productId, sellerId: w.a.sellerId, price: '100.00', quantity: 1 })
    }
    return row!.id
  }

  const place = async (productIds: string[], paymentMethod: string) =>
    placeOrderFromCart({
      userId: buyer,
      cartId: await cart(productIds),
      shippingAddressId: addressId,
      paymentMethod,
      orderSource: 'storefront',
      sendConfirmationEmail: false,
      storefrontPayments: payments,
    })

  const orderCount = async () => (await db.select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.userId, buyer))).length

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ;({ placeOrderFromCart } = await import('./place-order'))
    const { createIsolationWorld } = await import('../stores/isolation.fixtures')
    w = await createIsolationWorld(db)

    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    const base = { sellerId: w.a.sellerId, storeId: w.a.a1, categoryId: category!.id, status: 'active' as const }
    const [physical] = await db
      .insert(s.products)
      .values({ ...base, quantity: '100', sku: `dcp-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id })
    const [digital] = await db
      .insert(s.products)
      .values({ ...base, productType: 'digital', trackStock: false, quantity: '0', sku: `dcd-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id })
    physicalId = physical!.id
    digitalId = digital!.id

    await createAuthUsers(buyer)
    await db.insert(s.users).values({ id: buyer, isGuest: false, role: 'customer' })
    const [address] = await db
      .insert(s.userAddresses)
      .values({ userId: buyer, fullName: 'Digital Test', phone: '01012345678', addressLine1: '1 Test St', city: 'Nasr City', state: 'Cairo', postalCode: '11765' })
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
    const ids = [physicalId, digitalId].filter(Boolean)
    if (ids.length) await db.delete(s.products).where(inArray(s.products.id, ids))
    await db.delete(s.userAddresses).where(eq(s.userAddresses.userId, buyer))
    await db.delete(s.users).where(eq(s.users.id, buyer))
    await w?.cleanup()
    await client.end()
  })

  it('refuses cash on delivery for a digital-only cart, with no order', async () => {
    const before = await orderCount()
    expect(await place([digitalId], 'cash_on_delivery')).toEqual({ success: false, error: 'digitalNoCashOnDelivery' })
    expect(await orderCount()).toBe(before)
  })

  it('refuses cash on delivery for a mixed cart, and leaves the physical stock alone', async () => {
    const stock = async () => Number((await db.select({ q: s.products.quantity }).from(s.products).where(eq(s.products.id, physicalId)))[0]!.q)
    const before = await stock()
    expect(await place([physicalId, digitalId], 'cash_on_delivery')).toEqual({ success: false, error: 'digitalNoCashOnDelivery' })
    expect(await stock()).toBe(before)
  })

  it('still places a digital cart paid by a seller transfer, with no deposit', async () => {
    const result = await place([digitalId], 'vodafone_cash')
    expect(result.success).toBe(true)
    if (!result.success) return
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, result.data.order.id))
    expect(order).toMatchObject({ paymentMethod: 'vodafone_cash', depositStatus: null })
  })

  it('keeps cash on delivery for a physical-only cart', async () => {
    const result = await place([physicalId], 'cash_on_delivery')
    expect(result.success).toBe(true)
  })
})
