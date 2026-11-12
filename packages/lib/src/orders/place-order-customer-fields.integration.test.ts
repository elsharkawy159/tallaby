import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as DB_SCHEMA from '@workspace/db/schema'
import { validateCustomerInputs, unitPriceWithExtras, type CustomerField, type CustomerInputValue } from '../products/customer-fields.lib'

/**
 * Customer requirements (0167, ROADMAP.md F-91) through the real
 * placeOrderFromCart on staging: the cart line's price already holds the
 * extras, the order item keeps the snapshot, a percent offer applies to the
 * extras like the base, and a field changed after the add stops the order for
 * a review. Every order is an online payment still waiting, so no fee or ledger
 * row is written; it removes everything it adds. Skipped when TEST_DATABASE_URL
 * is unset; never point it at production.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

type PlaceOrder = typeof import('./place-order').placeOrderFromCart

const FIELDS: CustomerField[] = [
  { id: 'name1', type: 'text', label: { ar: 'الاسم', en: 'Name' }, required: true, extraPrice: 10, maxLength: 30 },
  {
    id: 'print1',
    type: 'choice',
    label: { ar: 'الطباعة', en: 'Print' },
    required: true,
    options: [
      { id: 'silver', label: { ar: 'فضي', en: 'Silver' }, extraPrice: null },
      { id: 'gold', label: { ar: 'ذهبي', en: 'Gold' }, extraPrice: 30 },
    ],
  },
]

describe.skipIf(!TEST_DATABASE_URL)('customer requirements at checkout (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const productIds: string[] = []
  const cartIds: string[] = []
  let sellerId = ''
  let storeId = ''
  let categoryId = ''
  let addressId = ''
  let placeOrderFromCart: PlaceOrder

  async function makeProduct (fields: CustomerField[] | null) {
    const [row] = await db
      .insert(s.products)
      .values({
        sellerId,
        storeId,
        categoryId,
        status: 'active',
        quantity: '50',
        sku: `cf-${randomUUID().slice(0, 12)}`,
        price: { base: 100, list: 100, final: 100 },
        customerFields: fields,
      })
      .returning({ id: s.products.id })
    productIds.push(row!.id)
    return row!.id
  }

  function snapshotOf (values: CustomerInputValue[]) {
    const result = validateCustomerInputs(FIELDS, values, { uploadPrefix: null })
    if (!result.ok) throw new Error('invalid test inputs')
    return result.snapshot
  }

  async function place (productId: string, quantity: number, values: CustomerInputValue[] | null, orderSource: 'storefront' | 'manual' = 'storefront') {
    const snapshot = values ? snapshotOf(values) : null
    const [cart] = await db
      .insert(s.carts)
      .values({ userId: sellerId, currency: 'EGP', storeId, storeSellerId: sellerId })
      .returning({ id: s.carts.id })
    cartIds.push(cart!.id)
    await db.insert(s.cartItems).values({
      cartId: cart!.id,
      productId,
      sellerId,
      quantity,
      price: unitPriceWithExtras(100, snapshot?.extrasPiastres ?? 0).toFixed(2),
      customerInputs: snapshot,
    })
    return placeOrderFromCart({
      userId: sellerId,
      cartId: cart!.id,
      shippingAddressId: addressId,
      paymentMethod: 'online_payment',
      paymentOverrides: { paymentMethod: 'online_payment', paymentStatus: 'pending', status: 'payment_processing' },
      orderSource,
      sendConfirmationEmail: false,
      ...(orderSource === 'manual' && { allowBelowMinOrderQuantity: true }),
    })
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ;({ placeOrderFromCart } = await import('./place-order'))
    // A QA store only, never a real seller's (CF_TEST_STORE overrides the subdomain).
    const [store] = await db
      .select({ id: s.stores.id, sellerId: s.stores.sellerId })
      .from(s.stores)
      .where(eq(s.stores.subdomain, process.env.CF_TEST_STORE ?? process.env.MOQ_TEST_STORE ?? 'qa-f9de6575'))
      .limit(1)
    if (!store) throw new Error('QA store not found: set CF_TEST_STORE to a QA store subdomain')
    storeId = store.id
    sellerId = store.sellerId
    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    categoryId = category!.id
    const [address] = await db
      .insert(s.userAddresses)
      .values({
        userId: sellerId,
        fullName: 'Customer Fields Test',
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
      await db.delete(s.productQuantityOffers).where(inArray(s.productQuantityOffers.productId, productIds))
    }
    if (cartIds.length) await db.delete(s.carts).where(inArray(s.carts.id, cartIds))
    if (productIds.length) {
      await db.delete(s.stockMovements).where(inArray(s.stockMovements.productId, productIds))
      await db.delete(s.products).where(inArray(s.products.id, productIds))
    }
    if (addressId) await db.delete(s.userAddresses).where(and(eq(s.userAddresses.id, addressId), eq(s.userAddresses.userId, sellerId)))
    await client.end()
  })

  it('charges the extras in the unit price and keeps the snapshot on the order item', async () => {
    const id = await makeProduct(FIELDS)
    const result = await place(id, 2, [{ fieldId: 'name1', text: 'Omar' }, { fieldId: 'print1', optionId: 'gold' }])
    expect(result.success).toBe(true)
    if (!result.success) return
    const item = result.data.orderItems[0]!
    expect(item.price).toBe('140.00')
    expect(item.subtotal).toBe('280.00')
    expect(item.customerInputs).toMatchObject({
      extrasPiastres: 4000,
      lines: [
        { fieldId: 'name1', text: 'Omar', label: { ar: 'الاسم', en: 'Name' }, extraPiastres: 1000 },
        { fieldId: 'print1', option: { id: 'gold', label: { ar: 'ذهبي', en: 'Gold' } }, extraPiastres: 3000 },
      ],
    })
  })

  it('a percent quantity offer applies to the extras like the base', async () => {
    const id = await makeProduct(FIELDS)
    await db.insert(s.productQuantityOffers).values({ sellerId, productId: id, minQuantity: 2, discountType: 'percent', discountValue: '10', isActive: true })
    const result = await place(id, 2, [{ fieldId: 'name1', text: 'Omar' }, { fieldId: 'print1', optionId: 'gold' }])
    expect(result.success).toBe(true)
    // 10 % of 2 × 140
    if (result.success) expect(Number(result.data.orderItems[0]!.discountAmount)).toBe(28)
  })

  it('stops the order when the seller changed a field after the add, before any stock moves', async () => {
    const id = await makeProduct(FIELDS)
    // The seller raises Gold to 40 after the customer added it at 30.
    const pricier = FIELDS.map((field) =>
      field.type === 'choice'
        ? { ...field, options: field.options.map((option) => (option.id === 'gold' ? { ...option, extraPrice: 40 } : option)) }
        : field,
    )
    const values = [{ fieldId: 'name1', text: 'Omar' }, { fieldId: 'print1', optionId: 'gold' }]
    const snapshotBefore = snapshotOf(values)
    await db.update(s.products).set({ customerFields: pricier }).where(eq(s.products.id, id))
    const [cart] = await db.insert(s.carts).values({ userId: sellerId, currency: 'EGP', storeId, storeSellerId: sellerId }).returning({ id: s.carts.id })
    cartIds.push(cart!.id)
    await db.insert(s.cartItems).values({ cartId: cart!.id, productId: id, sellerId, quantity: 1, price: '140.00', customerInputs: snapshotBefore })
    const result = await placeOrderFromCart({
      userId: sellerId,
      cartId: cart!.id,
      shippingAddressId: addressId,
      paymentMethod: 'online_payment',
      paymentOverrides: { paymentMethod: 'online_payment', paymentStatus: 'pending', status: 'payment_processing' },
      orderSource: 'storefront',
      sendConfirmationEmail: false,
    })
    expect(result).toMatchObject({ success: false, error: 'customerInputsChanged' })
    expect(!result.success && result.customerInputLines?.[0]?.productId).toBe(id)
    const [row] = await db.select({ q: s.products.quantity }).from(s.products).where(eq(s.products.id, id))
    expect(Number(row!.q)).toBe(50)
  })

  it('a line without inputs on a product with a required field is stopped too', async () => {
    const id = await makeProduct(FIELDS)
    expect(await place(id, 1, null)).toMatchObject({ success: false, error: 'customerInputsChanged' })
  })

  it('a manual order keeps what the line holds', async () => {
    const id = await makeProduct(FIELDS)
    const result = await place(id, 1, null, 'manual')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.orderItems[0]!.customerInputs).toBeNull()
  })

  it('a product without fields is unchanged', async () => {
    const id = await makeProduct(null)
    const result = await place(id, 1, null)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.orderItems[0]!.price).toBe('100.00')
  })
})
