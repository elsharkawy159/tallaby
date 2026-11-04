import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuthUsers } from '../../../db/src/testing/auth-users'
import * as DB_SCHEMA from '@workspace/db/schema'
import type { IsolationWorld } from '../stores/isolation.fixtures'

/**
 * A store selling in its own currency (ROADMAP.md F-61) through the real
 * placeOrderFromCart against staging. Skipped when TEST_DATABASE_URL is unset.
 * Creates and deletes its own rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

type PlaceOrder = typeof import('./place-order').placeOrderFromCart

describe.skipIf(!TEST_DATABASE_URL)('order currency follows the store (integration)', { timeout: 90_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const buyer = randomUUID()
  let w: IsolationWorld
  let placeOrderFromCart: PlaceOrder
  let productId = ''
  let sarStore = ''
  let egpStore = ''
  let riyadhAddress = ''
  let jeddahAddress = ''
  let cairoAddress = ''

  async function setSettings (storeId: string, patch: Record<string, unknown>) {
    await db
      .update(s.stores)
      .set({ settings: sql`coalesce(${s.stores.settings}, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb` })
      .where(eq(s.stores.id, storeId))
  }

  async function addAddress (values: Partial<typeof s.userAddresses.$inferInsert>) {
    const [row] = await db
      .insert(s.userAddresses)
      .values({
        userId: buyer,
        fullName: 'Sara Ahmed',
        phone: '+966512345678',
        addressLine1: '12 King Fahd Road',
        city: 'Riyadh',
        state: 'Riyadh',
        country: 'Saudi Arabia',
        postalCode: '',
        ...values,
      })
      .returning({ id: s.userAddresses.id })
    return row!.id
  }

  /** A cart that says EGP on purpose: a stale or tampered cart must not decide the currency. */
  async function cart (storeId: string, price = '100.00', currency = 'EGP', quantity = 1) {
    const [row] = await db
      .insert(s.carts)
      .values({ userId: buyer, currency, storeId, storeSellerId: w.a.sellerId })
      .returning({ id: s.carts.id })
    await db.insert(s.cartItems).values({ cartId: row!.id, productId, sellerId: w.a.sellerId, price, quantity })
    return row!.id
  }

  const place = (cartId: string, addressId: string, paymentMethod = 'cash_on_delivery') =>
    placeOrderFromCart({
      userId: buyer,
      cartId,
      shippingAddressId: addressId,
      paymentMethod,
      orderSource: 'storefront',
      sendConfirmationEmail: false,
    })

  async function placeOk (cartId: string, addressId: string) {
    const result = await place(cartId, addressId)
    if (!result.success) throw new Error(`placeOrderFromCart failed: ${result.error}`)
    return result.data.order.id
  }

  const walletRows = (orderId: string) =>
    db.select().from(s.walletTransactions).where(eq(s.walletTransactions.orderId, orderId))

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    ;({ placeOrderFromCart } = await import('./place-order'))
    // Imported after DATABASE_URL is set: it loads the shared @workspace/db client.
    const { createIsolationWorld } = await import('../stores/isolation.fixtures')
    w = await createIsolationWorld(db)
    sarStore = w.a.a1
    egpStore = w.a.a2

    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: w.a.sellerId, categoryId: category!.id, status: 'active', quantity: '1000', sku: `cur-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id })
    productId = product!.id

    await createAuthUsers(buyer)
    await db.insert(s.users).values({ id: buyer, isGuest: false, role: 'customer' })
    await db
      .update(s.sellers)
      .set({ feeTrialStartedAt: null, feeTrialEndsAt: null, isCommissionExempt: false })
      .where(eq(s.sellers.id, w.a.sellerId))
    riyadhAddress = await addAddress({})
    jeddahAddress = await addAddress({ state: 'Makkah', city: 'Jeddah', phone: '+966512345679' })
    cairoAddress = await addAddress({ country: 'Egypt', state: 'CAIRO', city: 'Cairo', phone: '01012345678', addressLine1: '1 Tahrir Square' })

    await setSettings(sarStore, {
      currency: 'SAR',
      currencyLabel: 'sar-symbol',
      shipping: { method: 'own', handlingDays: 1, freeShippingOver: null, otherPlaces: 'tallaby_rates' },
      payments: {
        cod: { enabled: true, fee: 0 },
        instapay: { enabled: true, details: { holderName: 'Store Owner', ipa: 'owner@instapay' } },
      },
    })
    await setSettings(egpStore, {
      shipping: { method: 'own', handlingDays: 1, freeShippingOver: null, otherPlaces: 'tallaby_rates' },
    })
    await db.insert(s.storeShippingZones).values({
      storeId: sarStore,
      name: { ar: 'الرياض', en: 'Riyadh' },
      places: ['SA/RIYADH'],
      price: '30',
      deliveryDaysMin: 1,
      deliveryDaysMax: 3,
      codEnabled: true,
    })
  }, 180_000)

  afterAll(async () => {
    const orderRows = await db.select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.userId, buyer))
    const ids = orderRows.map((o) => o.id)
    if (ids.length) {
      await db.delete(s.payments).where(inArray(s.payments.orderId, ids))
      await db.delete(s.orderItems).where(inArray(s.orderItems.orderId, ids))
      await db.delete(s.orders).where(inArray(s.orders.id, ids))
    }
    await db.delete(s.carts).where(eq(s.carts.userId, buyer))
    if (productId) await db.delete(s.products).where(eq(s.products.id, productId))
    await db.delete(s.userAddresses).where(eq(s.userAddresses.userId, buyer))
    await db.delete(s.users).where(eq(s.users.id, buyer))
    await w?.cleanup()
    await client.end()
  }, 120_000)

  it('a SAR store order from a Saudi address is in SAR on the order, items and cart', async () => {
    const cartId = await cart(sarStore)
    const orderId = await placeOk(cartId, riyadhAddress)
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, orderId))
    expect(order).toMatchObject({ currency: 'SAR', subtotal: '100.00', shippingCost: '30.00', totalAmount: '130.00' })
    const items = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId))
    expect(items.map((i) => i.currency)).toEqual(['SAR'])
    const [savedCart] = await db.select().from(s.carts).where(eq(s.carts.id, cartId))
    expect(savedCart!.currency).toBe('SAR')
  })

  it('a recorded payment is in SAR too', async () => {
    const result = await placeOrderFromCart({
      userId: buyer,
      cartId: await cart(sarStore),
      shippingAddressId: riyadhAddress,
      paymentMethod: 'seller_collected',
      orderSource: 'manual',
      sendConfirmationEmail: false,
      paymentOverrides: {
        paymentMethod: 'seller_collected',
        paymentStatus: 'paid',
        status: 'confirmed',
        paidAt: new Date().toISOString(),
        recordPayment: true,
      },
    })
    if (!result.success) throw new Error(result.error)
    const paid = await db.select().from(s.payments).where(eq(s.payments.orderId, result.data.order.id))
    expect(paid.map((p) => p.currency)).toEqual(['SAR'])
  })

  it('takes the fee in the wallet currency, uncapped by a small order, with no SAR ledger row', async () => {
    // Another quantity: the same items again within two hours would hold the fee as a duplicate.
    const orderId = await placeOk(await cart(sarStore, '0.50', 'EGP', 4), riyadhAddress)
    const rows = await walletRows(orderId)
    const [wallet] = await db.select().from(s.sellerWallet).where(eq(s.sellerWallet.sellerId, w.a.sellerId))
    const [item] = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId))

    // Fee per order stays the plan's whatever the order's amount or currency.
    expect(item!.sellerEarning).toBe('2.00')
    expect(rows.map((r) => r.type)).toEqual(['fee'])
    expect(rows[0]!.currency).toBe(wallet!.currency)
    expect(['EGP', 'USD']).toContain(rows[0]!.currency)
    expect(Number(rows[0]!.amount)).toBe(wallet!.currency === 'EGP' ? -5 : -0.03)
    if (wallet!.currency === 'EGP') expect(item!.commissionAmount).toBe('5.00')
  })

  it('never takes the currency from the cart, whatever it says', async () => {
    const orderId = await placeOk(await cart(sarStore, '100.00', 'USD'), riyadhAddress)
    const [order] = await db.select({ currency: s.orders.currency }).from(s.orders).where(eq(s.orders.id, orderId))
    expect(order!.currency).toBe('SAR')
    // And a stale SAR cart on an EGP store is EGP.
    const egpOrderId = await placeOk(await cart(egpStore, '100.00', 'SAR'), cairoAddress)
    const [egpOrder] = await db.select({ currency: s.orders.currency }).from(s.orders).where(eq(s.orders.id, egpOrderId))
    expect(egpOrder!.currency).toBe('EGP')
  })

  it('an EGP store order is unchanged', async () => {
    const orderId = await placeOk(await cart(egpStore, '100.00'), cairoAddress)
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, orderId))
    const [item] = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId))
    expect(order!.currency).toBe('EGP')
    expect(item!.currency).toBe('EGP')
    expect(Number(item!.sellerEarning) + Number(item!.commissionAmount)).toBe(100)
    expect(Number(order!.shippingCost)).toBeGreaterThan(0)
  })

  it.each(['wallet', 'wallet_instapay', 'online_payment', 'instapay', 'vodafone_cash'])(
    'refuses %s on a SAR store',
    async (method) => {
      const result = await place(await cart(sarStore), riyadhAddress, method)
      expect(result).toMatchObject({ success: false, error: 'storePaymentNotInCurrency' })
    },
  )

  it('never touches the customer wallet on a SAR store', async () => {
    await place(await cart(sarStore), riyadhAddress, 'wallet')
    const rows = await db.select().from(s.userWalletTransactions).where(eq(s.userWalletTransactions.userId, buyer))
    expect(rows).toEqual([])
  })

  it('refuses a Saudi address no zone covers, and an Egyptian one on a SAR store', async () => {
    expect(await place(await cart(sarStore), jeddahAddress)).toMatchObject({ success: false, error: 'storeShippingNotCovered' })
    expect(await place(await cart(sarStore), cairoAddress)).toMatchObject({ success: false, error: 'storeShippingNotCovered' })
  })

  it('an EGP store with no zone abroad still says Egypt only', async () => {
    expect(await place(await cart(egpStore), riyadhAddress)).toMatchObject({ success: false, error: 'storeShippingOutsideEgypt' })
  })

  it('an EGP store can sell abroad through a zone, in EGP', async () => {
    const [zone] = await db
      .insert(s.storeShippingZones)
      .values({ storeId: egpStore, name: { ar: 'الرياض', en: 'Riyadh' }, places: ['SA/RIYADH'], price: '400', codEnabled: true })
      .returning({ id: s.storeShippingZones.id })
    const orderId = await placeOk(await cart(egpStore), riyadhAddress)
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, orderId))
    expect(order).toMatchObject({ currency: 'EGP', shippingCost: '400.00' })
    await db.delete(s.storeShippingZones).where(eq(s.storeShippingZones.id, zone!.id))
  })

  it('refuses a Tallaby coupon on a SAR store', async () => {
    const [coupon] = await db
      .insert(s.coupons)
      .values({
        code: `CUR${buyer.slice(0, 8)}`.toUpperCase(),
        name: 'Tallaby coupon',
        discountType: 'fixed_amount',
        discountValue: '50.00',
        startsAt: new Date(Date.now() - 86_400_000).toISOString(),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        applicableTo: { channels: ['marketplace', 'storefront'] },
      })
      .returning()
    const result = await placeOrderFromCart({
      userId: buyer,
      cartId: await cart(sarStore),
      shippingAddressId: riyadhAddress,
      paymentMethod: 'cash_on_delivery',
      orderSource: 'storefront',
      couponCode: coupon!.code,
      sendConfirmationEmail: false,
    })
    expect(result).toMatchObject({ success: false, error: 'couponNotForThisStore' })
    await db.delete(s.coupons).where(eq(s.coupons.id, coupon!.id))
  })

  it('a store cart in another currency is refused outside its store', async () => {
    const result = await placeOrderFromCart({
      userId: buyer,
      cartId: await cart(sarStore),
      shippingAddressId: riyadhAddress,
      paymentMethod: 'cash_on_delivery',
      orderSource: 'website',
      sendConfirmationEmail: false,
    })
    expect(result).toMatchObject({ success: false, error: 'storePaymentNotInCurrency' })
  })

  it('the checkout form saves a Saudi address that prices on the zone', async () => {
    const { parseCheckoutAddress } = await import('../shipping/checkout-address.lib')
    const { saveCheckoutAddressRow } = await import('../shipping/checkout-address.server')
    const parsed = parseCheckoutAddress(
      {
        fullName: 'Sara Ahmed',
        phone: '0512345670',
        address: '7 Olaya Street',
        country: 'SA',
        regionKey: 'SA/RIYADH',
        cityKey: 'SA/RIYADH/riyadh',
      },
      'ar',
    )
    if (!parsed.ok) throw new Error('address refused')
    const { id } = await saveCheckoutAddressRow(buyer, parsed.value, null, db as never)
    const [saved] = await db.select().from(s.userAddresses).where(eq(s.userAddresses.id, id))
    expect(saved).toMatchObject({ phone: '+966512345670', country: 'Saudi Arabia' })
    const orderId = await placeOk(await cart(sarStore, '100.00', 'EGP', 3), id)
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, orderId))
    expect(order).toMatchObject({ currency: 'SAR', shippingCost: '30.00', totalAmount: '330.00' })
  })

  it('blocks a foreign number however it is typed', async () => {
    const { blockStorePhone, unblockStorePhone } = await import('../stores/blocked-phones.server')
    await blockStorePhone({ storeId: sarStore, phone: '+966512345678', createdBy: w.a.sellerId })
    expect(await place(await cart(sarStore), riyadhAddress)).toMatchObject({ success: false, error: 'storeCustomerBlocked' })
    await unblockStorePhone(sarStore, { phone: '+966512345678' })
  })

  it('a lead keeps a foreign number, and the order converts it', async () => {
    const { saveStoreCheckoutLead } = await import('../checkout-leads/checkout-leads.server')
    const cartId = await cart(sarStore)
    const saved = await saveStoreCheckoutLead({
      storeId: sarStore,
      sellerId: w.a.sellerId,
      userId: buyer,
      cartId,
      fullName: 'Sara Ahmed',
      phone: '0512345678',
      email: null,
      governorate: 'Riyadh',
      city: 'Riyadh',
      items: [{ productId, title: 'Mug', quantity: 1, price: '100.00', image: null }],
      subtotal: 100,
      shipping: 30,
      total: 130,
    })
    expect(saved).toBe(true)
    const [lead] = await db
      .select()
      .from(s.storeCheckoutLeads)
      .where(and(eq(s.storeCheckoutLeads.storeId, sarStore), eq(s.storeCheckoutLeads.phone, '+966512345678')))
    expect(lead).toBeTruthy()
    const orderId = await placeOk(cartId, riyadhAddress)
    const [converted] = await db.select().from(s.storeCheckoutLeads).where(eq(s.storeCheckoutLeads.id, lead!.id))
    expect(converted!.orderId).toBe(orderId)
    await db.delete(s.storeCheckoutLeads).where(eq(s.storeCheckoutLeads.id, lead!.id))
  })
})
