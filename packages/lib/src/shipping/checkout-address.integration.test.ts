import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuthUsers } from '../../../db/src/testing/auth-users'
import * as DB_SCHEMA from '@workspace/db/schema'
import type { IsolationWorld } from '../stores/isolation.fixtures'
import { parseCheckoutAddress } from './checkout-address.lib'

/**
 * The simple checkout form (ROADMAP.md F-64): saving its address, and placing an
 * order from it through the real placeOrderFromCart, against staging. Skipped when
 * TEST_DATABASE_URL is unset. Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

type SaveRow = typeof import('./checkout-address.server').saveCheckoutAddressRow
type PlaceOrder = typeof import('../orders/place-order').placeOrderFromCart

const form = (address: string, extra: Record<string, unknown> = {}) => ({
  fullName: 'سارة أحمد',
  phone: '01012345678',
  address,
  ...extra,
})

describe.skipIf(!TEST_DATABASE_URL)('simple checkout address (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const buyer = randomUUID()
  const other = randomUUID()
  let w: IsolationWorld
  let save: SaveRow
  let placeOrderFromCart: PlaceOrder
  let productId = ''

  const valid = (address: string, extra?: Record<string, unknown>) => {
    const parsed = parseCheckoutAddress(form(address, extra), 'ar')
    if (!parsed.ok) throw new Error(`form refused: ${parsed.errors.join()}`)
    return parsed.value
  }
  const rowsOf = (userId: string) => db.select().from(s.userAddresses).where(eq(s.userAddresses.userId, userId))

  async function freshBuyerRows() {
    await db.delete(s.orders).where(eq(s.orders.userId, buyer))
    await db.delete(s.carts).where(eq(s.carts.userId, buyer))
    await db.delete(s.userAddresses).where(inArray(s.userAddresses.userId, [buyer, other]))
  }

  async function cart() {
    const [row] = await db
      .insert(s.carts)
      .values({ userId: buyer, currency: 'EGP', storeId: w.a.a1, storeSellerId: w.a.sellerId })
      .returning({ id: s.carts.id })
    await db.insert(s.cartItems).values({ cartId: row!.id, productId, sellerId: w.a.sellerId, price: '200.00', quantity: 1 })
    return row!.id
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ;({ saveCheckoutAddressRow: save } = await import('./checkout-address.server'))
    ;({ placeOrderFromCart } = await import('../orders/place-order'))
    const { createIsolationWorld } = await import('../stores/isolation.fixtures')
    w = await createIsolationWorld(db)

    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: w.a.sellerId, categoryId: category!.id, status: 'active', quantity: '100', price: 200, images: [], sku: `F64-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id })
    productId = product!.id

    await createAuthUsers(buyer, other)
    await db.insert(s.users).values([
      { id: buyer, isGuest: false, role: 'customer' },
      { id: other, isGuest: false, role: 'customer' },
    ])
    await db
      .update(s.stores)
      .set({ settings: sql`jsonb_set(coalesce(${s.stores.settings}, '{}'::jsonb), '{shipping}', ${JSON.stringify({ method: 'own', handlingDays: 1, freeShippingOver: null })}::jsonb, true)` })
      .where(eq(s.stores.id, w.a.a1))
    await db.insert(s.storeShippingZones).values([
      { storeId: w.a.a1, name: { ar: 'القاهرة', en: 'Cairo' }, places: ['EG/CAIRO'], price: '55.00', codEnabled: true },
      { storeId: w.a.a1, name: { ar: 'الجيزة', en: 'Giza' }, places: ['EG/GIZA'], price: '40.00', codEnabled: true },
    ])
  }, 120_000)

  afterAll(async () => {
    await db.delete(s.orders).where(eq(s.orders.userId, buyer))
    await db.delete(s.carts).where(eq(s.carts.userId, buyer))
    if (productId) await db.delete(s.products).where(eq(s.products.id, productId))
    await db.delete(s.userAddresses).where(inArray(s.userAddresses.userId, [buyer, other]))
    await db.delete(s.users).where(inArray(s.users.id, [buyer, other]))
    await w?.cleanup()
    await client.end()
  })

  it('saves the first address as the default, with the governorate and a city', async () => {
    await freshBuyerRows()
    const { id, created } = await save(buyer, valid('15 شارع النصر، مدينة نصر، القاهرة'), null)
    expect(created).toBe(true)
    const [row] = await db.select().from(s.userAddresses).where(eq(s.userAddresses.id, id))
    expect(row).toMatchObject({ userId: buyer, state: 'CAIRO', city: 'مدينة نصر', country: 'Egypt', isDefault: true, postalCode: '' })
  })

  it('does not create duplicates', async () => {
    await freshBuyerRows()
    const first = await save(buyer, valid('15 شارع النصر، القاهرة'), null)
    const again = await save(buyer, valid('15 شارع النصر، القاهرة'), null)
    expect(again).toEqual({ id: first.id, created: false })
    expect(await rowsOf(buyer)).toHaveLength(1)
  })

  it('updates the row while it is being typed', async () => {
    await freshBuyerRows()
    const first = await save(buyer, valid('15 شارع النصر، القاهرة'), null)
    const next = await save(buyer, valid('15 شارع النصر الدور 3، الجيزة'), first.id)
    expect(next).toEqual({ id: first.id, created: false })
    const rows = await rowsOf(buyer)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.state).toBe('GIZA')
  })

  it("never touches another user's address", async () => {
    await freshBuyerRows()
    const theirs = await save(other, valid('9 شارع الهرم، الجيزة'), null)
    const mine = await save(buyer, valid('15 شارع النصر، القاهرة'), theirs.id)
    expect(mine.id).not.toBe(theirs.id)
    const [row] = await db.select().from(s.userAddresses).where(eq(s.userAddresses.id, theirs.id))
    expect(row).toMatchObject({ userId: other, state: 'GIZA' })
  })

  it('places an order at the zone price of the governorate read from the address', async () => {
    await freshBuyerRows()
    const { id } = await save(buyer, valid('15 شارع النصر، القاهرة'), null)
    const result = await placeOrderFromCart({
      userId: buyer,
      cartId: await cart(),
      shippingAddressId: id,
      paymentMethod: 'cash_on_delivery',
      orderSource: 'storefront',
      sendConfirmationEmail: false,
    })
    if (!result.success) throw new Error(result.error)
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, result.data.order.id))
    expect(Number(order!.shippingCost)).toBe(55)
    expect(order!.shippingAddressId).toBe(id)
  })

  it('uses the picker when the address is unclear, at that zone price', async () => {
    await freshBuyerRows()
    const { id } = await save(buyer, valid('عمارة 5 الدور الثالث', { governorate: 'GIZA' }), null)
    const result = await placeOrderFromCart({
      userId: buyer,
      cartId: await cart(),
      shippingAddressId: id,
      paymentMethod: 'cash_on_delivery',
      orderSource: 'storefront',
      sendConfirmationEmail: false,
    })
    if (!result.success) throw new Error(result.error)
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, result.data.order.id))
    expect(Number(order!.shippingCost)).toBe(40)
  })

  it('keeps a past order\'s address: editing makes a new row, which stays the default', async () => {
    await freshBuyerRows()
    const { id } = await save(buyer, valid('15 شارع النصر، القاهرة'), null)
    const result = await placeOrderFromCart({
      userId: buyer,
      cartId: await cart(),
      shippingAddressId: id,
      paymentMethod: 'cash_on_delivery',
      orderSource: 'storefront',
      sendConfirmationEmail: false,
    })
    if (!result.success) throw new Error(result.error)

    const next = await save(buyer, valid('7 شارع التحرير، الجيزة'), id)
    expect(next.created).toBe(true)
    expect(next.id).not.toBe(id)
    const rows = await rowsOf(buyer)
    expect(rows.find((r) => r.id === id)).toMatchObject({ addressLine1: '15 شارع النصر، القاهرة', isDefault: false })
    expect(rows.find((r) => r.id === next.id)).toMatchObject({ state: 'GIZA', isDefault: true })
  })

  it('cannot save a bad governorate, so an order can never reach the missing-state rate', async () => {
    const parsed = parseCheckoutAddress(form('عمارة 5 الدور الثالث', { governorate: '__missing_state__' }), 'ar')
    expect(parsed).toEqual({ ok: false, errors: ['governorate'], needsGovernorate: true })
  })
})
