import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as DB_SCHEMA from '@workspace/db/schema'

/**
 * Platform fee at order placement (PLAN.md §13.2, §14, P6-04) through the real
 * placeOrderFromCart against a Postgres with 0059 applied (the staging copy).
 * Skipped when TEST_DATABASE_URL is unset. Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

type PlaceOrder = typeof import('./place-order').placeOrderFromCart

describe.skipIf(!TEST_DATABASE_URL)('platform fee at order placement (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const tag = randomUUID().slice(0, 8)

  const buyer = randomUUID()
  const sellerA = randomUUID() // regular, no trial
  const sellerB = randomUUID() // in trial
  const sellerC = randomUUID() // exempt
  const sellerD = randomUUID() // order under EGP 5
  const sellers = [sellerA, sellerB, sellerC, sellerD]
  const products: Record<string, string> = {}
  const couponIds: string[] = []
  let addressId: string
  let categoryId: string
  let placeOrderFromCart: PlaceOrder

  async function addSeller (id: string, extra: Partial<typeof s.sellers.$inferInsert>) {
    const sub = `pf-${tag}-${id.slice(0, 4)}`
    await db.insert(s.users).values({ id, isGuest: false, role: 'seller' })
    await db.insert(s.sellers).values({
      id,
      businessName: sub,
      displayName: sub,
      slug: sub,
      subdomain: sub,
      businessType: 'individual',
      legalAddress: { country: 'EG' },
      supportEmail: 'pf@example.com',
      status: 'approved',
      feeTrialEligible: false,
      ...extra,
    })
  }

  async function addProduct (key: string, sellerId: string) {
    const [row] = await db
      .insert(s.products)
      .values({ sellerId, categoryId, status: 'active', quantity: '100', sku: `pf-${tag}-${key}` })
      .returning({ id: s.products.id })
    products[key] = row!.id
  }

  /** A fresh cart for the buyer with [productKey, sellerId, price, qty] lines. */
  async function cart (lines: Array<[string, string, string, number]>) {
    const [row] = await db.insert(s.carts).values({ userId: buyer, currency: 'EGP' }).returning({ id: s.carts.id })
    await db.insert(s.cartItems).values(
      lines.map(([key, sellerId, price, quantity]) => ({
        cartId: row!.id,
        productId: products[key]!,
        sellerId,
        price,
        quantity,
      })),
    )
    return row!.id
  }

  async function place (cartId: string, couponCode?: string) {
    const result = await placeOrderFromCart({
      userId: buyer,
      cartId,
      shippingAddressId: addressId,
      // Several sellers ship separately, so COD (shipping ≤ 90) may not apply.
      paymentMethod: 'online_payment',
      couponCode,
      sendConfirmationEmail: false,
    })
    if (!result.success) throw new Error(`placeOrderFromCart failed: ${result.error}`)
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, result.data.order.id))
    const items = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, order!.id))
    const line = (key: string) => items.find((item) => item.productId === products[key])!
    return { order: order!, line }
  }

  async function coupon (code: string, values: Partial<typeof s.coupons.$inferInsert>) {
    const [row] = await db
      .insert(s.coupons)
      .values({
        code,
        name: code,
        discountType: 'percentage',
        discountValue: '0',
        startsAt: new Date(Date.now() - 86_400_000).toISOString(),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        ...values,
      })
      .returning({ id: s.coupons.id })
    couponIds.push(row!.id)
  }

  beforeAll(async () => {
    // placeOrderFromCart uses the shared @workspace/db client, which reads
    // DATABASE_URL when first imported.
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ;({ placeOrderFromCart } = await import('./place-order'))

    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    categoryId = category!.id

    await db.insert(s.users).values({ id: buyer, isGuest: false, role: 'customer' })
    const [address] = await db
      .insert(s.userAddresses)
      .values({
        userId: buyer,
        fullName: 'Fee Test',
        phone: '01012345678',
        addressLine1: '1 Test St',
        city: 'Nasr City',
        state: 'Cairo',
        postalCode: '11765',
      })
      .returning({ id: s.userAddresses.id })
    addressId = address!.id

    const now = Date.now()
    await addSeller(sellerA, {})
    await addSeller(sellerB, {
      feeTrialEligible: true,
      feeTrialStartedAt: new Date(now - 86_400_000).toISOString(),
      feeTrialEndsAt: new Date(now + 29 * 86_400_000).toISOString(),
    })
    await addSeller(sellerC, { isCommissionExempt: true })
    await addSeller(sellerD, {})

    await addProduct('a1', sellerA)
    await addProduct('a2', sellerA)
    await addProduct('b1', sellerB)
    await addProduct('c1', sellerC)
    await addProduct('d1', sellerD)
  })

  afterAll(async () => {
    const orderRows = await db.select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.userId, buyer))
    const orderIds = orderRows.map((row) => row.id)
    if (orderIds.length) {
      await db.delete(s.couponUsage).where(inArray(s.couponUsage.orderId, orderIds))
      await db.delete(s.orderItems).where(inArray(s.orderItems.orderId, orderIds))
      await db.delete(s.orders).where(inArray(s.orders.id, orderIds))
    }
    if (couponIds.length) await db.delete(s.coupons).where(inArray(s.coupons.id, couponIds))
    await db.delete(s.carts).where(eq(s.carts.userId, buyer))
    await db.delete(s.products).where(inArray(s.products.sellerId, sellers))
    await db.delete(s.sellerSubdomainRedirects).where(inArray(s.sellerSubdomainRedirects.sellerId, sellers))
    await db.delete(s.userAddresses).where(eq(s.userAddresses.userId, buyer))
    await db.delete(s.users).where(inArray(s.users.id, [buyer, ...sellers]))
    await client.end()
  })

  it('charges each seller its own fee: regular, trial, exempt and under EGP 5 (D22)', async () => {
    const { order, line } = await place(
      await cart([
        ['a1', sellerA, '150.00', 2],
        ['a2', sellerA, '50.00', 1],
        ['b1', sellerB, '1000.00', 1],
        ['c1', sellerC, '40.00', 1],
        ['d1', sellerD, '3.00', 1],
      ]),
    )

    // Non-commission maths is unchanged by the fee: these figures were taken
    // from the pre-P6-04 code (5% commission) with the same cart.
    expect(order).toMatchObject({
      subtotal: '1393.00',
      shippingCost: '255.00',
      tax: '0.00',
      discountAmount: '0.00',
      totalAmount: '1648.00',
    })
    for (const key of ['a1', 'a2', 'b1', 'c1', 'd1']) {
      expect(line(key).discountAmount).toBe('0.00')
      expect(line(key).total).toBe(line(key).subtotal)
    }

    // A: flat 5.00, split 300:50.
    expect(line('a1')).toMatchObject({ commissionAmount: '4.29', sellerEarning: '295.71', commissionRate: 0.0143 })
    expect(line('a2')).toMatchObject({ commissionAmount: '0.71', sellerEarning: '49.29', commissionRate: 0.0143 })
    expect(line('a1').metadata).toMatchObject({
      platformFee: { plan: 'flat_5', eligiblePiastres: 35_000, feePiastres: 500, trial: false, exempt: false },
    })
    // B: trial → 0.
    expect(line('b1')).toMatchObject({ commissionAmount: '0.00', sellerEarning: '1000.00', commissionRate: 0 })
    expect(line('b1').metadata).toMatchObject({ platformFee: { trial: true, feePiastres: 0 } })
    // C: exempt → 0.
    expect(line('c1')).toMatchObject({ commissionAmount: '0.00', sellerEarning: '40.00' })
    expect(line('c1').metadata).toMatchObject({ platformFee: { exempt: true, feePiastres: 0 } })
    // D: EGP 3 order → fee capped at 3.00.
    expect(line('d1')).toMatchObject({ commissionAmount: '3.00', sellerEarning: '0.00', commissionRate: 1 })
  })

  it("takes the fee on the seller's price after the seller's own coupon (D2)", async () => {
    const code = `PFS${tag}`.toUpperCase()
    await coupon(code, { sellerId: sellerA, discountType: 'percentage', discountValue: '20' })
    const { order, line } = await place(await cart([['a1', sellerA, '150.00', 2], ['a2', sellerA, '50.00', 1]]), code)

    expect(order.subtotal).toBe('350.00')
    expect(order.discountAmount).toBe('70.00')
    expect(line('a1')).toMatchObject({ discountAmount: '60.00', total: '240.00' })
    expect(line('a2')).toMatchObject({ discountAmount: '10.00', total: '40.00' })
    // Flat 5.00 on the seller's price, split 240:40.
    expect(line('a1')).toMatchObject({ commissionAmount: '4.29', sellerEarning: '235.71' })
    expect(line('a2')).toMatchObject({ commissionAmount: '0.71', sellerEarning: '39.29' })
    expect(line('a1').metadata).toMatchObject({ platformFee: { eligiblePiastres: 28_000, feePiastres: 500 } })
  })

  it('does not lower the fee for a Tallaby-funded coupon (D2)', async () => {
    const code = `PFT${tag}`.toUpperCase()
    await coupon(code, { discountType: 'fixed_amount', discountValue: '50' })
    const { order, line } = await place(await cart([['a1', sellerA, '150.00', 2], ['a2', sellerA, '50.00', 1]]), code)

    expect(order.discountAmount).toBe('50.00')
    expect(line('a1')).toMatchObject({ total: '300.00', commissionAmount: '4.29' })
    expect(line('a2')).toMatchObject({ total: '50.00', commissionAmount: '0.71' })
  })
})
