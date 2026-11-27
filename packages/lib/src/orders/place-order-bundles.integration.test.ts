import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as DB_SCHEMA from '@workspace/db/schema'

/**
 * Product bundles (ROADMAP.md F-07f, 0188; docs/plans/bundles.md §5 task 5)
 * through the real placeOrderFromCart and the real stock primitives: a bundle
 * line takes stock from each item, atomically, writes the snapshot, links the
 * items' movements to the order, and a restore from the snapshot puts back
 * what was sold even after the bundle changed. Runs on an existing seller and
 * store of the database (users need an auth row since 0134), as
 * place-order-unlimited-stock.integration.test.ts does; adds only its own
 * products, carts, orders and address and removes them. Needs 0188 applied.
 * Skipped when TEST_DATABASE_URL is unset; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

type PlaceOrder = typeof import('./place-order').placeOrderFromCart
type Inventory = typeof import('@workspace/db/inventory')
type AppDb = typeof import('@workspace/db').db

describe.skipIf(!TEST_DATABASE_URL)('product bundles at checkout (integration)', { timeout: 60_000 }, () => {
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

  async function makeProduct (quantity: number, { trackStock = true, isBundle = false } = {}) {
    const [row] = await db
      .insert(s.products)
      .values({
        sellerId,
        storeId,
        categoryId,
        status: 'active',
        quantity: String(quantity),
        trackStock,
        isBundle,
        sku: `bn-${randomUUID().slice(0, 12)}`,
        price: { base: 100, list: 100, final: 100 },
      })
      .returning({ id: s.products.id })
    productIds.push(row!.id)
    return row!.id
  }

  async function makeVariant (productId: string, stock: number) {
    const [row] = await db
      .insert(s.productVariants)
      .values({ productId, title: 'Size', stock, price: { base: 100, list: 100, final: 100 } })
      .returning({ id: s.productVariants.id })
    return row!.id
  }

  async function makeBundle (items: { productId: string; variantId?: string; quantity: number }[]) {
    const bundleId = await makeProduct(0, { isBundle: true })
    await db.insert(s.productBundleItems).values(
      items.map((item, position) => ({
        sellerId,
        storeId,
        bundleProductId: bundleId,
        itemProductId: item.productId,
        itemVariantId: item.variantId ?? null,
        quantity: item.quantity,
        position,
      })),
    )
    return bundleId
  }

  async function place (
    lines: { productId: string; quantity: number; variantId?: string }[],
    { testOrder = false }: { testOrder?: boolean } = {},
  ) {
    const [cart] = await db
      .insert(s.carts)
      .values({ userId: sellerId, currency: 'EGP', storeId, storeSellerId: sellerId })
      .returning({ id: s.carts.id })
    cartIds.push(cart!.id)
    await db.insert(s.cartItems).values(
      lines.map((line) => ({
        cartId: cart!.id,
        productId: line.productId,
        sellerId,
        price: '100.00',
        quantity: line.quantity,
        ...(line.variantId && { variant: { id: line.variantId, title: 'Size' } }),
      })),
    )
    return placeOrderFromCart({
      userId: sellerId,
      cartId: cart!.id,
      shippingAddressId: addressId,
      paymentMethod: testOrder ? 'cash_on_delivery' : 'online_payment',
      orderSource: 'storefront',
      sendConfirmationEmail: false,
      testOrder,
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
  const orderLinesOf = (orderId: string) =>
    db
      .select({
        productId: s.orderItems.productId,
        variantId: s.orderItems.variantId,
        quantity: s.orderItems.quantity,
        bundleItems: s.orderItems.bundleItems,
      })
      .from(s.orderItems)
      .where(eq(s.orderItems.orderId, orderId))
  /** The restore every cancel path runs: the lines read back from order_items. */
  const restoreOrder = async (orderId: string) => {
    const lines = await orderLinesOf(orderId)
    return appDb.transaction((tx) =>
      inventory.restoreStock(tx, inventory.orderStockLinesOf(lines), { reason: 'cancel', orderId }),
    )
  }

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
        fullName: 'Bundle Test',
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
      await db.delete(s.productBundleItems).where(inArray(s.productBundleItems.bundleProductId, productIds))
      await db.delete(s.products).where(inArray(s.products.id, productIds))
    }
    if (addressId) await db.delete(s.userAddresses).where(and(eq(s.userAddresses.id, addressId), eq(s.userAddresses.userId, sellerId)))
    await client.end()
  })

  it('takes each item, times the line, and writes the snapshot', async () => {
    const a = await makeProduct(10)
    const b = await makeProduct(0)
    const bv = await makeVariant(b, 9)
    const bundle = await makeBundle([{ productId: a, quantity: 2 }, { productId: b, variantId: bv, quantity: 3 }])

    const result = await place([{ productId: bundle, quantity: 2 }])
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(await quantityOf(a)).toBe(6)
    expect(await stockOf(bv)).toBe(3)
    expect(await quantityOf(bundle)).toBe(0)

    const [line] = result.data.orderItems
    expect(line!.productId).toBe(bundle)
    expect(line!.bundleItems).toMatchObject([
      { productId: a, variantId: null, quantity: 2 },
      { productId: b, variantId: bv, quantity: 3 },
    ])
  })

  it('one item short refuses the order and moves nothing', async () => {
    const a = await makeProduct(10)
    const b = await makeProduct(1)
    const bundle = await makeBundle([{ productId: a, quantity: 1 }, { productId: b, quantity: 2 }])

    const result = await place([{ productId: bundle, quantity: 1 }])
    expect(result.success).toBe(false)
    expect(await quantityOf(a)).toBe(10)
    expect(await quantityOf(b)).toBe(1)
  })

  it('counts an item bought on its own and inside a bundle together', async () => {
    const a = await makeProduct(5)
    const bundle = await makeBundle([{ productId: a, quantity: 2 }])

    // 3 on its own + 2 in the bundle = 5: fits exactly, then 5 > 4 is refused.
    expect((await place([{ productId: a, quantity: 3 }, { productId: bundle, quantity: 1 }])).success).toBe(true)
    expect(await quantityOf(a)).toBe(0)

    await db.update(s.products).set({ quantity: '4' }).where(eq(s.products.id, a))
    expect((await place([{ productId: a, quantity: 3 }, { productId: bundle, quantity: 1 }])).success).toBe(false)
    expect(await quantityOf(a)).toBe(4)
  })

  it('an unlimited item never limits the bundle', async () => {
    const a = await makeProduct(0, { trackStock: false })
    const b = await makeProduct(3)
    const bundle = await makeBundle([{ productId: a, quantity: 5 }, { productId: b, quantity: 1 }])

    expect((await place([{ productId: bundle, quantity: 3 }])).success).toBe(true)
    expect(await quantityOf(a)).toBe(0)
    expect(await quantityOf(b)).toBe(0)
  })

  it('links the items\' stock movements to the order', async () => {
    const a = await makeProduct(4)
    const bundle = await makeBundle([{ productId: a, quantity: 2 }])

    const result = await place([{ productId: bundle, quantity: 1 }])
    expect(result.success).toBe(true)
    if (!result.success) return
    const movements = await db
      .select({ delta: s.stockMovements.delta, orderId: s.stockMovements.orderId })
      .from(s.stockMovements)
      .where(and(eq(s.stockMovements.productId, a), eq(s.stockMovements.reason, 'order')))
    expect(movements).toEqual([{ delta: -2, orderId: result.data.order.id }])
  })

  it('a cancel restores from the snapshot after the bundle was edited', async () => {
    const a = await makeProduct(6)
    const c = await makeProduct(6)
    const bundle = await makeBundle([{ productId: a, quantity: 2 }])

    const result = await place([{ productId: bundle, quantity: 2 }])
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(await quantityOf(a)).toBe(2)

    // The seller swaps the item: the order still holds what was sold.
    await db.delete(s.productBundleItems).where(eq(s.productBundleItems.bundleProductId, bundle))
    await db.insert(s.productBundleItems).values({ sellerId, storeId, bundleProductId: bundle, itemProductId: c, quantity: 1 })

    await restoreOrder(result.data.order.id)
    expect(await quantityOf(a)).toBe(6)
    expect(await quantityOf(c)).toBe(6)
  })

  it('refuses a bundle with no items or a trashed item', async () => {
    const empty = await makeProduct(0, { isBundle: true })
    expect(await place([{ productId: empty, quantity: 1 }])).toMatchObject({ success: false, error: 'bundleUnavailable' })

    const a = await makeProduct(5)
    const bundle = await makeBundle([{ productId: a, quantity: 1 }])
    await db.update(s.products).set({ deletedAt: new Date().toISOString(), status: 'draft' }).where(eq(s.products.id, a))
    expect(await place([{ productId: bundle, quantity: 1 }])).toMatchObject({ success: false, error: 'bundleUnavailable' })
    expect(await quantityOf(a)).toBe(5)
  })

  it('a test order takes no stock', async () => {
    const a = await makeProduct(3)
    const bundle = await makeBundle([{ productId: a, quantity: 1 }])

    const result = await place([{ productId: bundle, quantity: 2 }], { testOrder: true })
    expect(result.success).toBe(true)
    expect(await quantityOf(a)).toBe(3)
  })
})
