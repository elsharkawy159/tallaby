import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuthUsers } from '../../../db/src/testing/auth-users'
import * as DB_SCHEMA from '@workspace/db/schema'
import type { IsolationWorld } from '../stores/isolation.fixtures'
import { orderEmailRecipient } from './order-notification-email.lib'

/**
 * The optional checkout email (ROADMAP.md F-64) through the real placeOrderFromCart,
 * against staging. Skipped when TEST_DATABASE_URL is unset. Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
const APP = 'customer_notifications'

describe.skipIf(!TEST_DATABASE_URL)('order notification email (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const guest = randomUUID()
  const account = randomUUID()
  const placeholder = `guest-${guest}@temp.local`
  const accountEmail = `real-${account}@example.com`
  let w: IsolationWorld
  let productId = ''
  let addressId = ''
  let lib: typeof import('./order-notification-email.server')
  let placeOrderFromCart: typeof import('./place-order').placeOrderFromCart

  const subscribe = () =>
    db
      .insert(s.storeAppInstalls)
      .values({ sellerId: w.a.sellerId, storeId: w.a.a1, appKey: APP, pricingModel: 'per_order', priceUsdCents: 1 })
  const unsubscribe = () => db.delete(s.storeAppInstalls).where(eq(s.storeAppInstalls.storeId, w.a.a1))

  async function placeWith(email: string | null) {
    const [cart] = await db
      .insert(s.carts)
      .values({ userId: guest, currency: 'EGP', storeId: w.a.a1, storeSellerId: w.a.sellerId })
      .returning({ id: s.carts.id })
    await db
      .insert(s.cartItems)
      .values({ cartId: cart!.id, productId, sellerId: w.a.sellerId, price: '200.00', quantity: 1 })
    const result = await placeOrderFromCart({
      userId: guest,
      cartId: cart!.id,
      shippingAddressId: addressId,
      paymentMethod: 'cash_on_delivery',
      orderSource: 'storefront',
      sendConfirmationEmail: false,
      ...(email && { orderMetadata: { notificationEmail: email } }),
    })
    if (!result.success) throw new Error(result.error)
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, result.data.order.id))
    return order!
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    lib = await import('./order-notification-email.server')
    ;({ placeOrderFromCart } = await import('./place-order'))
    const { createIsolationWorld } = await import('../stores/isolation.fixtures')
    w = await createIsolationWorld(db)
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: w.a.sellerId, categoryId: category!.id, status: 'active', quantity: '100', price: 200, images: [], sku: `QA-${guest.slice(0, 8)}` })
      .returning({ id: s.products.id })
    productId = product!.id
    await createAuthUsers(account)
    // A guest row has no auth user, as in real guest checkout (0136).
    await db.insert(s.users).values([
      { id: guest, isGuest: true, role: 'customer', email: placeholder },
      { id: account, isGuest: false, role: 'customer' },
    ])
    await db.update(s.users).set({ email: accountEmail }).where(eq(s.users.id, account))
    const [address] = await db
      .insert(s.userAddresses)
      .values({ userId: guest, addressType: 'shipping', fullName: 'سارة', phone: '01012345678', addressLine1: '15 شارع النصر', city: 'القاهرة', state: 'CAIRO', postalCode: '', country: 'Egypt', isDefault: true })
      .returning({ id: s.userAddresses.id })
    addressId = address!.id
    await db
      .update(s.stores)
      .set({ settings: sql`jsonb_set(coalesce(${s.stores.settings}, '{}'::jsonb), '{shipping}', ${JSON.stringify({ tallabyRatesEnabled: false })}::jsonb)` })
      .where(eq(s.stores.id, w.a.a1))
    await db.insert(s.storeShippingZones).values({ storeId: w.a.a1, name: { ar: 'القاهرة', en: 'Cairo' }, places: ['EG/CAIRO'], price: '55.00', codEnabled: true })
  }, 120_000)

  afterAll(async () => {
    await db.delete(s.orders).where(eq(s.orders.userId, guest))
    await db.delete(s.carts).where(eq(s.carts.userId, guest))
    if (productId) await db.delete(s.products).where(eq(s.products.id, productId))
    await db.delete(s.userAddresses).where(eq(s.userAddresses.userId, guest))
    await db.delete(s.users).where(inArray(s.users.id, [guest, account]))
    await w?.cleanup()
    await client.end()
  })

  it('asks a guest on a store that is not subscribed too (the confirmation is in every plan)', async () => {
    await unsubscribe()
    expect(await lib.getOrderEmailField(guest, w.a.a1)).toEqual({ show: true, lastEmail: null })
    expect(await lib.resolveOrderNotificationEmail(guest, w.a.a1, 'sara@example.com')).toEqual({ ok: true, email: 'sara@example.com' })
    expect((await lib.getOrderEmailField(account, w.a.a1)).show).toBe(false)
  })

  it('asks a guest on a subscribed store, but not a customer with a real email', async () => {
    await unsubscribe()
    await subscribe()
    expect((await lib.getOrderEmailField(guest, w.a.a1)).show).toBe(true)
    expect((await lib.getOrderEmailField(account, w.a.a1)).show).toBe(false)
    expect(await lib.resolveOrderNotificationEmail(account, w.a.a1, 'other@example.com')).toEqual({ ok: true, email: null })
  })

  it('refuses a bad address and accepts blank', async () => {
    await unsubscribe()
    await subscribe()
    expect(await lib.resolveOrderNotificationEmail(guest, w.a.a1, 'nope')).toEqual({ ok: false })
    expect(await lib.resolveOrderNotificationEmail(guest, w.a.a1, '')).toEqual({ ok: true, email: null })
  })

  it('sends to the typed address, changes no user row, and fills it in next time', async () => {
    await unsubscribe()
    await subscribe()
    const typed = `typed-${guest}@example.com`
    const resolved = await lib.resolveOrderNotificationEmail(guest, w.a.a1, typed)
    expect(resolved).toEqual({ ok: true, email: typed })
    const order = await placeWith(typed)
    const [user] = await db.select().from(s.users).where(eq(s.users.id, guest))
    expect(user!.email).toBe(placeholder)
    expect(orderEmailRecipient({ metadata: order.metadata, accountEmail: user!.email })).toBe(typed)
    expect((await lib.getOrderEmailField(guest, w.a.a1)).lastEmail).toBe(typed)
    // Another customer never sees it.
    expect((await lib.getOrderEmailField(account, w.a.a1)).lastEmail).toBeNull()
  })

  it('has no recipient when the field is left blank', async () => {
    const order = await placeWith(null)
    const [user] = await db.select().from(s.users).where(eq(s.users.id, guest))
    expect(orderEmailRecipient({ metadata: order.metadata, accountEmail: user!.email })).toBeNull()
  })

  it('never puts the typed address in the store customer list', async () => {
    const { listStoreCustomers } = await import('../customers/customers.server')
    const customers = await listStoreCustomers(w.a.sellerId, w.a.a1)
    expect(JSON.stringify(customers)).not.toContain('typed-')
  })
})
