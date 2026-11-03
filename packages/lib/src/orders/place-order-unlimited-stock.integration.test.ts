import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as DB_SCHEMA from '@workspace/db/schema'

/**
 * Unlimited stock (ROADMAP.md F-51, 0138) through the real placeOrderFromCart
 * and the real stock primitives against staging: an untracked product never
 * loses stock, never sells out and writes no history; a tracked one behaves as
 * before. Runs on an existing seller and store of the database (users need an
 * auth row since 0134), as order-stock.integration.test.ts does; adds only its
 * own products, carts, orders and address and removes them. Skipped when
 * TEST_DATABASE_URL is unset; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

type PlaceOrder = typeof import('./place-order').placeOrderFromCart
type Inventory = typeof import('@workspace/db/inventory')
type AppDb = typeof import('@workspace/db').db

describe.skipIf(!TEST_DATABASE_URL)('unlimited stock (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const productIds: string[] = []
  const cartIds: string[] = []
  let sellerId = ''
  let storeId = ''
  let placeOrderFromCart: PlaceOrder
  let inventory: Inventory
  let appDb: AppDb
  let categoryId = ''
  let addressId = ''

  async function makeProduct (quantity: number, trackStock: boolean) {
    const [row] = await db
      .insert(s.products)
      .values({
        sellerId,
        categoryId,
        status: 'active',
        quantity: String(quantity),
        trackStock,
        sku: `us-${randomUUID().slice(0, 12)}`,
        price: { base: 100, list: 100, final: 100 },
      })
      .returning({ id: s.products.id })
    productIds.push(row!.id)
    return row!.id
  }

  async function makeVariant (productId: string, stock: number | null) {
    const [row] = await db
      .insert(s.productVariants)
      .values({ productId, title: 'Size', stock, price: { base: 100, list: 100, final: 100 } })
      .returning({ id: s.productVariants.id })
    return row!.id
  }

  async function place (productId: string, quantity: number, variantId?: string) {
    const [cart] = await db
      .insert(s.carts)
      .values({ userId: sellerId, currency: 'EGP', storeId, storeSellerId: sellerId })
      .returning({ id: s.carts.id })
    cartIds.push(cart!.id)
    await db.insert(s.cartItems).values({
      cartId: cart!.id,
      productId,
      sellerId,
      price: '100.00',
      quantity,
      ...(variantId && { variant: { id: variantId, title: 'Size' } }),
    })
    return placeOrderFromCart({
      userId: sellerId,
      cartId: cart!.id,
      shippingAddressId: addressId,
      paymentMethod: 'online_payment',
      orderSource: 'storefront',
      sendConfirmationEmail: false,
    })
  }

  const quantityOf = async (id: string) => {
    const [row] = await db.select({ q: s.products.quantity }).from(s.products).where(eq(s.products.id, id))
    return Number(row!.q)
  }
  const stockOf = async (id: string) => {
    const [row] = await db.select({ stock: s.productVariants.stock }).from(s.productVariants).where(eq(s.productVariants.id, id))
    return row!.stock
  }
  const movementsOf = async (productId: string) =>
    db.select({ id: s.stockMovements.id, delta: s.stockMovements.delta }).from(s.stockMovements).where(eq(s.stockMovements.productId, productId))

  const restore = (line: Parameters<Inventory['restoreStock']>[1][number]) =>
    appDb.transaction((tx) => inventory.restoreStock(tx, [line]))

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ;({ placeOrderFromCart } = await import('./place-order'))
    inventory = await import('@workspace/db/inventory')
    appDb = (await import('@workspace/db')).db
    const [store] = await db.select({ id: s.stores.id, sellerId: s.stores.sellerId }).from(s.stores).limit(1)
    storeId = store!.id
    sellerId = store!.sellerId
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    categoryId = category!.id
    const [address] = await db
      .insert(s.userAddresses)
      .values({
        userId: sellerId,
        fullName: 'Unlimited Test',
        phone: '01012345678',
        addressLine1: '1 Test St',
        city: 'مدينة نصر',
        state: 'القاهرة',
        postalCode: '11765',
      })
      .returning({ id: s.userAddresses.id })
    addressId = address!.id
  }, 120_000)

  afterAll(async () => {
    if (productIds.length) {
      const rows = await db.select({ orderId: s.orderItems.orderId }).from(s.orderItems).where(inArray(s.orderItems.productId, productIds))
      const orderIds = [...new Set(rows.map((row) => row.orderId))]
      if (orderIds.length) {
        await db.execute(sql`DELETE FROM seller_notifications WHERE seller_id = ${sellerId} AND data->>'orderId' = ANY(${orderIds})`).catch(() => {})
        await db.delete(s.orderItems).where(inArray(s.orderItems.orderId, orderIds))
        await db.delete(s.orders).where(inArray(s.orders.id, orderIds))
      }
    }
    if (cartIds.length) await db.delete(s.carts).where(inArray(s.carts.id, cartIds))
    if (productIds.length) {
      await db.delete(s.stockMovements).where(inArray(s.stockMovements.productId, productIds))
      await db.delete(s.products).where(inArray(s.products.id, productIds))
    }
    if (addressId) await db.delete(s.userAddresses).where(and(eq(s.userAddresses.id, addressId), eq(s.userAddresses.userId, sellerId)))
    await client.end()
  })

  it('an untracked product with no stored stock can be ordered, and nothing moves', async () => {
    const id = await makeProduct(0, false)
    expect((await place(id, 3)).success).toBe(true)
    expect((await place(id, 500)).success).toBe(true)
    expect(await quantityOf(id)).toBe(0)
    expect(await restore({ kind: 'product', id, quantity: 3 })).toEqual([])
    expect(await quantityOf(id)).toBe(0)
    expect(await movementsOf(id)).toEqual([])
  })

  it('an untracked product keeps its stored count, for when tracking is switched back on', async () => {
    const id = await makeProduct(7, false)
    expect((await place(id, 100)).success).toBe(true)
    expect(await quantityOf(id)).toBe(7)
    await db.update(s.products).set({ trackStock: true }).where(eq(s.products.id, id))
    expect((await place(id, 2)).success).toBe(true)
    expect(await quantityOf(id)).toBe(5)
    expect((await place(id, 6)).success).toBe(false)
    expect(await quantityOf(id)).toBe(5)
  })

  it('a variant inherits it: stock stays put on order and cancel, null stock included', async () => {
    const id = await makeProduct(0, false)
    const counted = await makeVariant(id, 0)
    const noCount = await makeVariant(id, null)
    expect((await place(id, 4, counted)).success).toBe(true)
    expect((await place(id, 4, noCount)).success).toBe(true)
    expect(await restore({ kind: 'variant', id: counted, quantity: 4 })).toEqual([])
    expect(await stockOf(counted)).toBe(0)
    expect(await stockOf(noCount)).toBeNull()
    // The seller's own edit of the stored count writes no history either.
    await db.update(s.productVariants).set({ stock: 9 }).where(eq(s.productVariants.id, counted))
    expect(await movementsOf(id)).toEqual([])
  })

  it('a tracked product is unchanged: it decrements, refuses to oversell, restores and logs', async () => {
    const id = await makeProduct(5, true)
    expect((await place(id, 2)).success).toBe(true)
    expect(await quantityOf(id)).toBe(3)
    const short = await place(id, 4)
    expect(short.success).toBe(false)
    expect(await quantityOf(id)).toBe(3)
    const [restored] = await restore({ kind: 'product', id, quantity: 2 })
    expect(restored?.quantity).toBe(5)
    expect(await quantityOf(id)).toBe(5)
    // 5 on insert, -2 on the order, +2 on the restore.
    expect((await movementsOf(id)).map((m) => m.delta).sort((a, b) => a - b)).toEqual([-2, 2, 5])
  })

  it('a tracked variant is unchanged, and a null-stock one still refuses', async () => {
    const id = await makeProduct(0, true)
    const counted = await makeVariant(id, 3)
    const noCount = await makeVariant(id, null)
    expect((await place(id, 2, counted)).success).toBe(true)
    expect(await stockOf(counted)).toBe(1)
    expect((await place(id, 2, counted)).success).toBe(false)
    expect(await stockOf(counted)).toBe(1)
    expect((await place(id, 1, noCount)).success).toBe(false)
    const [restored] = await restore({ kind: 'variant', id: counted, quantity: 2 })
    expect(restored?.quantity).toBe(3)
  })

  it('ensureStockAtLeast leaves an untracked product alone and raises a tracked one', async () => {
    const untracked = await makeProduct(1, false)
    const tracked = await makeProduct(1, true)
    await appDb.transaction((tx) =>
      inventory.ensureStockAtLeast(tx, [
        { kind: 'product', id: untracked, quantity: 9 },
        { kind: 'product', id: tracked, quantity: 9 },
      ]),
    )
    expect(await quantityOf(untracked)).toBe(1)
    expect(await quantityOf(tracked)).toBe(9)
  })
})
