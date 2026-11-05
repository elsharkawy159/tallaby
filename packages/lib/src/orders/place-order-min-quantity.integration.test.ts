import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as DB_SCHEMA from '@workspace/db/schema'

/**
 * Minimum order quantity (0151) through the real placeOrderFromCart on staging.
 * Every placed order is an online payment still waiting to be paid, so no fee or
 * ledger row is written; it adds only its own products, carts, orders and address
 * and removes them. Skipped when TEST_DATABASE_URL is unset; never point it at
 * production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

type PlaceOrder = typeof import('./place-order').placeOrderFromCart
type OrderSource = NonNullable<Parameters<PlaceOrder>[0]['orderSource']>

describe.skipIf(!TEST_DATABASE_URL)('minimum order quantity (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const productIds: string[] = []
  const cartIds: string[] = []
  let sellerId = ''
  let storeId = ''
  let categoryId = ''
  let addressId = ''
  let crossSellWas: boolean | null = null
  let placeOrderFromCart: PlaceOrder

  async function makeProduct (minOrderQuantity: number, quantity = 50) {
    const [row] = await db
      .insert(s.products)
      .values({
        sellerId,
        categoryId,
        status: 'active',
        quantity: String(quantity),
        minOrderQuantity,
        sku: `moq-${randomUUID().slice(0, 12)}`,
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

  type Line = { productId: string, quantity: number, variantId?: string, giftRuleId?: string, crossSellId?: string }

  async function place (lines: Line[], orderSource: OrderSource = 'storefront', allowBelowMinOrderQuantity?: boolean) {
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
        ...(line.crossSellId && { crossSellId: line.crossSellId }),
      })),
    )
    return placeOrderFromCart({
      userId: sellerId,
      cartId: cart!.id,
      shippingAddressId: addressId,
      paymentMethod: 'online_payment',
      paymentOverrides: { paymentMethod: 'online_payment', paymentStatus: 'pending', status: 'payment_processing' },
      orderSource,
      sendConfirmationEmail: false,
      allowBelowMinOrderQuantity,
    })
  }

  const quantityOf = async (id: string) => {
    const [row] = await db.select({ q: s.products.quantity }).from(s.products).where(eq(s.products.id, id))
    return Number(row!.q)
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ;({ placeOrderFromCart } = await import('./place-order'))
    // A QA store only, never a real seller's (MOQ_TEST_STORE overrides the subdomain).
    const [store] = await db
      .select({ id: s.stores.id, sellerId: s.stores.sellerId, crossSellEnabled: s.stores.crossSellEnabled })
      .from(s.stores)
      .where(eq(s.stores.subdomain, process.env.MOQ_TEST_STORE ?? 'qa-f9de6575'))
      .limit(1)
    if (!store) throw new Error('QA store not found: set MOQ_TEST_STORE to a QA store subdomain')
    storeId = store.id
    sellerId = store.sellerId
    crossSellWas = store.crossSellEnabled
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    categoryId = category!.id
    const [address] = await db
      .insert(s.userAddresses)
      .values({
        userId: sellerId,
        fullName: 'Min Order Test',
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
    if (storeId && crossSellWas !== null) await db.update(s.stores).set({ crossSellEnabled: crossSellWas }).where(eq(s.stores.id, storeId))
    if (addressId) await db.delete(s.userAddresses).where(and(eq(s.userAddresses.id, addressId), eq(s.userAddresses.userId, sellerId)))
    await client.end()
  })

  it('the default of 1 changes nothing', async () => {
    const id = await makeProduct(1)
    expect((await place([{ productId: id, quantity: 1 }])).success).toBe(true)
  })

  it('refuses under the minimum before touching stock, naming the product', async () => {
    const id = await makeProduct(3)
    const result = await place([{ productId: id, quantity: 2 }])
    expect(result).toMatchObject({ success: false, error: 'belowMinOrderQuantity' })
    expect(!result.success && result.minOrderShortfalls).toMatchObject([{ productId: id, minimum: 3, current: 2, missing: 1, sellerId }])
    expect(await quantityOf(id)).toBe(50)
  })

  it('succeeds at the minimum and takes the stock', async () => {
    const id = await makeProduct(3)
    expect((await place([{ productId: id, quantity: 3 }])).success).toBe(true)
    expect(await quantityOf(id)).toBe(47)
  })

  it('sums the variants: 2 red and 1 blue meet 3, 1 and 1 do not', async () => {
    const id = await makeProduct(3)
    const red = await makeVariant(id, 10)
    const blue = await makeVariant(id, 10)
    expect((await place([{ productId: id, quantity: 1, variantId: red }, { productId: id, quantity: 1, variantId: blue }])).success).toBe(false)
    expect((await place([{ productId: id, quantity: 2, variantId: red }, { productId: id, quantity: 1, variantId: blue }])).success).toBe(true)
  })

  it('a client can not bring the override to a customer order', async () => {
    const id = await makeProduct(3)
    for (const source of ['storefront', 'website'] as const) {
      expect(await place([{ productId: id, quantity: 1 }], source, true)).toMatchObject({ success: false, error: 'belowMinOrderQuantity' })
    }
  })

  it('a manual order is refused without the seller\'s yes, and goes through with it', async () => {
    const id = await makeProduct(3)
    expect(await place([{ productId: id, quantity: 1 }], 'manual')).toMatchObject({ success: false, error: 'belowMinOrderQuantity' })
    expect((await place([{ productId: id, quantity: 1 }], 'manual', true)).success).toBe(true)
  })

  it('an order taken outside is never refused', async () => {
    const id = await makeProduct(3)
    expect((await place([{ productId: id, quantity: 1 }], 'external')).success).toBe(true)
  })

  it('a cross-sell line whose offer no longer applies does not escape the minimum', async () => {
    const main = await makeProduct(1)
    const offered = await makeProduct(3)
    const [offer] = await db
      .insert(s.productCrossSells)
      .values({ sellerId, storeId, productId: main, offerProductId: offered, discountType: 'percent', discountValue: '10', isActive: true })
      .returning({ id: s.productCrossSells.id })
    await db.update(s.stores).set({ crossSellEnabled: true }).where(eq(s.stores.id, storeId))
    // The main product left the cart: the offer doesn't apply, so it is a normal line.
    expect(await place([{ productId: offered, quantity: 1, crossSellId: offer!.id }])).toMatchObject({ success: false, error: 'belowMinOrderQuantity' })
    // With it, the offer applies and the unit stays outside the minimum.
    expect((await place([{ productId: main, quantity: 1 }, { productId: offered, quantity: 1, crossSellId: offer!.id }])).success).toBe(true)
    await db.delete(s.productCrossSells).where(eq(s.productCrossSells.id, offer!.id))
  })

  it('a quantity offer still works at the minimum', async () => {
    const id = await makeProduct(3)
    await db.insert(s.productQuantityOffers).values({ sellerId, productId: id, minQuantity: 2, discountType: 'percent', discountValue: '10', isActive: true })
    const result = await place([{ productId: id, quantity: 3 }])
    expect(result.success).toBe(true)
    if (result.success) expect(Number(result.data.orderItems[0]!.discountAmount)).toBe(30)
    await db.delete(s.productQuantityOffers).where(eq(s.productQuantityOffers.productId, id))
  })
})
