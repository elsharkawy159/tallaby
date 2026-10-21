import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as DB_SCHEMA from '@workspace/db/schema'
import type { IsolationWorld } from '../stores/isolation.fixtures'
import { calculateLocationShippingCost } from '../shipping/shipping.lib'

/**
 * Store-website checkout charges the seller's shipping zones (store shipping
 * spec §6.5) through the real placeOrderFromCart against staging. Skipped when
 * TEST_DATABASE_URL is unset. Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

type PlaceOrder = typeof import('./place-order').placeOrderFromCart

describe.skipIf(!TEST_DATABASE_URL)('storefront shipping at order placement (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const buyer = randomUUID()
  let w: IsolationWorld
  let placeOrderFromCart: PlaceOrder
  let productId = ''
  let cairoZone = ''
  const addr: Record<'cairo' | 'aswan' | 'saudi' | 'giza' | 'alex', string> = {
    cairo: '',
    aswan: '',
    saudi: '',
    giza: '',
    alex: '',
  }

  async function setShipping (storeId: string, shipping: Record<string, unknown>) {
    await db
      .update(s.stores)
      .set({ settings: sql`jsonb_set(coalesce(${s.stores.settings}, '{}'::jsonb), '{shipping}', ${JSON.stringify(shipping)}::jsonb)` })
      .where(eq(s.stores.id, storeId))
  }

  async function addZone (storeId: string, values: Partial<typeof s.storeShippingZones.$inferInsert>) {
    const [row] = await db
      .insert(s.storeShippingZones)
      .values({ storeId, name: { ar: 'منطقة', en: 'Zone' }, price: '0', ...values })
      .returning({ id: s.storeShippingZones.id })
    return row!.id
  }

  async function addAddress (values: Partial<typeof s.userAddresses.$inferInsert>) {
    const [row] = await db
      .insert(s.userAddresses)
      .values({
        userId: buyer,
        fullName: 'Ship Test',
        phone: '01012345678',
        addressLine1: '1 Test St',
        city: '',
        state: '',
        postalCode: '11765',
        ...values,
      })
      .returning({ id: s.userAddresses.id })
    return row!.id
  }

  /** A fresh cart of `qty` × the test product at `price`, on `storeId`. */
  async function cart (storeId: string, price: string, qty = 1) {
    const [row] = await db
      .insert(s.carts)
      .values({ userId: buyer, currency: 'EGP', storeId, storeSellerId: w.a.sellerId })
      .returning({ id: s.carts.id })
    await db.insert(s.cartItems).values({ cartId: row!.id, productId, sellerId: w.a.sellerId, price, quantity: qty })
    return row!.id
  }

  async function place (
    cartId: string,
    addressId: string,
    opts: { paymentMethod?: string; orderSource?: 'storefront' | 'website' } = {},
  ) {
    return placeOrderFromCart({
      userId: buyer,
      cartId,
      shippingAddressId: addressId,
      paymentMethod: opts.paymentMethod ?? 'online_payment',
      orderSource: opts.orderSource ?? 'storefront',
      sendConfirmationEmail: false,
    })
  }

  async function placeOk (...args: Parameters<typeof place>) {
    const result = await place(...args)
    if (!result.success) throw new Error(`placeOrderFromCart failed: ${result.error}`)
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, result.data.order.id))
    return order!
  }

  /** What Tallaby's rate table bills for one physical line of this product. */
  function tallabyRate (state: string, price: number, qty = 1) {
    return calculateLocationShippingCost({
      items: [
        {
          quantity: qty,
          price: price.toFixed(2),
          sellerId: w.a.sellerId,
          product: {
            productType: 'physical',
            freeDelivery: false,
            dimensions: null,
            sellerId: w.a.sellerId,
            seller: { freeDelivery: false },
          },
        },
      ],
      destinationState: state,
      cartSubtotal: price * qty,
    })!
  }

  const orderCount = async () =>
    (await db.select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.userId, buyer))).length

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ;({ placeOrderFromCart } = await import('./place-order'))
    // Imported after DATABASE_URL is set: it loads the shared @workspace/db client.
    const { createIsolationWorld } = await import('../stores/isolation.fixtures')
    w = await createIsolationWorld(db)

    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: w.a.sellerId, categoryId: category!.id, status: 'active', quantity: '1000', sku: `ss-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id })
    productId = product!.id

    await db.insert(s.users).values({ id: buyer, isGuest: false, role: 'customer' })
    // Default country column (the address form's Egypt default).
    addr.cairo = await addAddress({ state: 'القاهرة', city: 'مدينة نصر' })
    addr.aswan = await addAddress({ state: 'Aswan', city: 'Aswan', country: 'Egypt' })
    addr.saudi = await addAddress({ state: 'Riyadh', city: 'Riyadh', country: 'Saudi Arabia' })
    addr.giza = await addAddress({ state: 'Giza', city: 'Dokki', country: 'Egypt' })
    addr.alex = await addAddress({ state: 'Alexandria', city: 'Smouha', country: 'Egypt' })

    // Stored before `otherPlaces` existed: reads as "tallaby_rates".
    await setShipping(w.a.a1, { method: 'own', handlingDays: 1, freeShippingOver: null })
    cairoZone = await addZone(w.a.a1, {
      name: { ar: 'القاهرة', en: 'Cairo' },
      places: ['EG/CAIRO'],
      price: '55.00',
      freeOver: '1000.00',
      codEnabled: true,
    })
    await addZone(w.a.a1, { places: ['EG/GIZA'], price: '40.00', codEnabled: false })
    await addZone(w.a.a1, { places: ['EG/ALEXANDRIA'], price: '120.00', codEnabled: true })
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

  it('(a) charges the zone price and snapshots it', async () => {
    const order = await placeOk(await cart(w.a.a1, '100.00'), addr.cairo)
    expect(order).toMatchObject({ subtotal: '100.00', shippingCost: '55.00', totalAmount: '155.00' })
    const snap = (order.metadata as { storeShipping: Record<string, unknown> }).storeShipping
    expect(snap).toMatchObject({
      method: 'own',
      pricedBy: 'zone',
      zoneId: cairoZone,
      zoneName: { ar: 'القاهرة', en: 'Cairo' },
      billedPiastres: 5500,
    })
    expect(String(snap.place)).toMatch(/^EG\/CAIRO/)
  })

  it('(b) is free at or over the zone free-over', async () => {
    const order = await placeOk(await cart(w.a.a1, '500.00', 2), addr.cairo)
    expect(order.shippingCost).toBe('0.00')
    expect(order.totalAmount).toBe('1000.00')
    expect((order.metadata as { storeShipping: Record<string, unknown> }).storeShipping).toMatchObject({
      pricedBy: 'zone',
      billedPiastres: 0,
    })
  })

  it('(c) bills Tallaby rates for an uncovered place when otherPlaces is missing', async () => {
    const expected = tallabyRate('Aswan', 100)
    const order = await placeOk(await cart(w.a.a1, '100.00'), addr.aswan)
    expect(Number(order.shippingCost)).toBe(expected)
    expect((order.metadata as { storeShipping: Record<string, unknown> }).storeShipping).toMatchObject({
      method: 'own',
      pricedBy: 'tallaby_rates',
      billedPiastres: Math.round(expected * 100),
    })
    const snap = (order.metadata as { storeShipping: Record<string, unknown> }).storeShipping
    expect(snap.zoneId).toBeUndefined()
  })

  it('(d) refuses an uncovered place when otherPlaces is refuse, before writing', async () => {
    await setShipping(w.a.a1, { method: 'own', handlingDays: 1, freeShippingOver: null, otherPlaces: 'refuse' })
    try {
      const before = await orderCount()
      const result = await place(await cart(w.a.a1, '100.00'), addr.aswan)
      expect(result).toEqual({ success: false, error: 'storeShippingNotCovered' })
      expect(await orderCount()).toBe(before)
    } finally {
      await setShipping(w.a.a1, { method: 'own', handlingDays: 1, freeShippingOver: null })
    }
  })

  it('(e) refuses an address outside Egypt', async () => {
    const before = await orderCount()
    const result = await place(await cart(w.a.a1, '100.00'), addr.saudi)
    expect(result).toEqual({ success: false, error: 'storeShippingOutsideEgypt' })
    expect(await orderCount()).toBe(before)
  })

  it('(f) refuses COD on a zone with COD off', async () => {
    const result = await place(await cart(w.a.a1, '100.00'), addr.giza, { paymentMethod: 'cash_on_delivery' })
    expect(result).toEqual({ success: false, error: 'storeShippingNoCod' })
  })

  it('(g) accepts COD on a zone priced above the 90 EGP rider cap', async () => {
    const order = await placeOk(await cart(w.a.a1, '100.00'), addr.alex, { paymentMethod: 'cash_on_delivery' })
    expect(order).toMatchObject({ shippingCost: '120.00', paymentMethod: 'cash_on_delivery' })
  })

  it('(h) leaves a marketplace order of the same cart on Tallaby rates with no snapshot', async () => {
    const expected = tallabyRate('القاهرة', 100)
    const order = await placeOk(await cart(w.a.a1, '100.00'), addr.cairo, { orderSource: 'website' })
    expect(Number(order.shippingCost)).toBe(expected)
    expect((order.metadata as Record<string, unknown> | null)?.storeShipping).toBeUndefined()
  })

  it('(i) bills Tallaby rates for a store with no zones', async () => {
    const expected = tallabyRate('القاهرة', 100)
    const order = await placeOk(await cart(w.a.a2, '100.00'), addr.cairo)
    expect(Number(order.shippingCost)).toBe(expected)
    expect((order.metadata as { storeShipping: Record<string, unknown> }).storeShipping).toMatchObject({
      method: 'own',
      pricedBy: 'tallaby_rates',
      billedPiastres: Math.round(expected * 100),
    })
  })
})
