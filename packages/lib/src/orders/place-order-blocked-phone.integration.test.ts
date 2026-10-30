import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as DB_SCHEMA from '@workspace/db/schema'
import type { IsolationWorld } from '../stores/isolation.fixtures'

/**
 * Store phone blocklist (ROADMAP.md F-02, 0118) through the real
 * placeOrderFromCart against staging: a blocked phone cannot order on that
 * store's website, in any spelling, while other stores and the marketplace
 * are unaffected. Skipped when TEST_DATABASE_URL is unset. Cleans up.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

type PlaceOrder = typeof import('./place-order').placeOrderFromCart
type BlockedServer = typeof import('../stores/blocked-phones.server')

describe.skipIf(!TEST_DATABASE_URL)('store phone blocklist at order placement (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const buyer = randomUUID()
  let w: IsolationWorld
  let placeOrderFromCart: PlaceOrder
  let blocked: BlockedServer
  let productId = ''
  let addressId = ''

  async function cart (storeId: string) {
    const [row] = await db
      .insert(s.carts)
      .values({ userId: buyer, currency: 'EGP', storeId, storeSellerId: w.a.sellerId })
      .returning({ id: s.carts.id })
    await db.insert(s.cartItems).values({ cartId: row!.id, productId, sellerId: w.a.sellerId, price: '100.00', quantity: 1 })
    return row!.id
  }

  const place = async (storeId: string, orderSource: 'storefront' | 'website' = 'storefront') =>
    placeOrderFromCart({
      userId: buyer,
      cartId: await cart(storeId),
      shippingAddressId: addressId,
      paymentMethod: 'online_payment',
      orderSource,
      sendConfirmationEmail: false,
    })

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ;({ placeOrderFromCart } = await import('./place-order'))
    blocked = await import('../stores/blocked-phones.server')
    const { createIsolationWorld } = await import('../stores/isolation.fixtures')
    w = await createIsolationWorld(db)

    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: w.a.sellerId, categoryId: category!.id, status: 'active', quantity: '1000', sku: `bp-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id })
    productId = product!.id

    await db.insert(s.users).values({ id: buyer, isGuest: false, role: 'customer' })
    const [address] = await db
      .insert(s.userAddresses)
      .values({
        userId: buyer,
        fullName: 'Block Test',
        // The customer typed it in international form; the seller blocks the local form.
        phone: '+20 101 234 5678',
        addressLine1: '1 Test St',
        city: 'مدينة نصر',
        state: 'القاهرة',
        postalCode: '11765',
      })
      .returning({ id: s.userAddresses.id })
    addressId = address!.id
  }, 120_000)

  afterAll(async () => {
    const orderRows = await db.select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.userId, buyer))
    const orderIds = orderRows.map((row) => row.id)
    if (orderIds.length) {
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

  it('refuses a blocked phone on that store only, before creating an order', async () => {
    await blocked.blockStorePhone({ storeId: w.a.a1, phone: '01012345678', reason: 'refused twice', createdBy: w.a.sellerId })
    expect(await blocked.isStorePhoneBlocked(w.a.a1, '201012345678')).toBe(true)
    expect(await blocked.isStorePhoneBlocked(w.a.a2, '01012345678')).toBe(false)

    const refused = await place(w.a.a1)
    expect(refused).toEqual({ success: false, error: 'storeCustomerBlocked' })
    const none = await db.select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.userId, buyer))
    expect(none).toHaveLength(0)

    // Another store of the same seller, and the marketplace, still take the order.
    expect((await place(w.a.a2)).success).toBe(true)
    expect((await place(w.a.a1, 'website')).success).toBe(true)
  })

  it('keeps each store’s list separate and unblocks only within the store', async () => {
    expect(await blocked.listStoreBlockedPhones(w.b.b1)).toEqual([])
    // Another seller's store id cannot remove store a1's row.
    expect(await blocked.unblockStorePhone(w.b.b1, { phone: '01012345678' })).toBe(false)
    expect(await blocked.listStoreBlockedPhones(w.a.a1)).toHaveLength(1)

    // Blocking again only updates the reason.
    await blocked.blockStorePhone({ storeId: w.a.a1, phone: '01012345678', reason: 'again', createdBy: w.a.sellerId })
    const [row] = await blocked.listStoreBlockedPhones(w.a.a1)
    expect(row).toMatchObject({ phone: '01012345678', reason: 'again' })

    expect(await blocked.unblockStorePhone(w.a.a1, { id: row!.id })).toBe(true)
    expect((await place(w.a.a1)).success).toBe(true)
  })
})
