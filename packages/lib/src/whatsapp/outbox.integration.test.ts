import { randomInt, randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createAuthUsers } from '../../../db/src/testing/auth-users'
import * as DB_SCHEMA from '@workspace/db/schema'
import type { IsolationWorld } from '../stores/isolation.fixtures'

/**
 * WhatsApp outbox end to end against a real database (ROADMAP.md F-109): the
 * enqueue dedupe, the dispatcher claim, forward-only webhook statuses and an
 * idempotent confirm by button. Graph is mocked (no request leaves). Needs
 * 0180; runs only when TEST_DATABASE_URL is set. Creates and deletes its own
 * rows and puts whatsapp_settings back as it found it.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

const ENV = {
  WHATSAPP_ACCESS_TOKEN: 'test-token',
  WHATSAPP_PHONE_NUMBER_ID: '100000000001',
  WHATSAPP_WABA_ID: '200000000002',
  WHATSAPP_APP_SECRET: 'test-app-secret',
  WHATSAPP_VERIFY_TOKEN: 'test-verify',
  WHATSAPP_PAYLOAD_SECRET: 'p'.repeat(40),
}

describe.skipIf(!TEST_DATABASE_URL)('WhatsApp outbox (integration)', { timeout: 60_000 }, () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { prepare: false, max: 4 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA
  const buyer = randomUUID()
  const localPhone = `010${String(randomInt(10_000_000, 99_999_999))}`
  const phone = `20${localPhone.slice(1)}`
  let w: IsolationWorld
  let orderId = ''
  let productId = ''
  let savedSettings: typeof s.whatsappSettings.$inferSelect | undefined
  let wa: typeof import('./server')
  let payload: typeof import('./payload.lib')

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    Object.assign(process.env, ENV)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ messages: [{ id: `wamid.reply-${randomUUID()}` }] }), { status: 200 })))
    wa = await import('./server')
    payload = await import('./payload.lib')
    const { createIsolationWorld } = await import('../stores/isolation.fixtures')
    const { placeOrderFromCart } = await import('../orders/place-order')
    w = await createIsolationWorld(db)

    ;[savedSettings] = await db.select().from(s.whatsappSettings).where(eq(s.whatsappSettings.id, 1))
    await db
      .insert(s.whatsappSettings)
      .values({ id: 1, enabled: true })
      .onConflictDoUpdate({ target: s.whatsappSettings.id, set: { enabled: true, eventsEnabled: ['order_placed', 'order_confirmed', 'order_shipped', 'order_out_for_delivery', 'order_delivered', 'order_cancelled'] } })
    await db.insert(s.storeWhatsappSettings).values({ storeId: w.a.a1, sellerId: w.a.sellerId, enabled: true })

    const [category] = await db.select({ id: s.categories.id }).from(s.categories).limit(1)
    const [product] = await db
      .insert(s.products)
      .values({ sellerId: w.a.sellerId, storeId: w.a.a1, categoryId: category!.id, status: 'active', quantity: '100', sku: `wa-${buyer.slice(0, 8)}` })
      .returning({ id: s.products.id })
    productId = product!.id
    await createAuthUsers(buyer)
    await db.insert(s.users).values({ id: buyer, isGuest: false, role: 'customer' })
    const [address] = await db
      .insert(s.userAddresses)
      .values({ userId: buyer, fullName: 'WA Test', phone: localPhone, addressLine1: '1 Test St', city: 'Nasr City', state: 'Cairo', postalCode: '11765' })
      .returning({ id: s.userAddresses.id })
    const [cart] = await db
      .insert(s.carts)
      .values({ userId: buyer, currency: 'EGP', storeId: w.a.a1, storeSellerId: w.a.sellerId })
      .returning({ id: s.carts.id })
    await db.insert(s.cartItems).values({ cartId: cart!.id, productId, sellerId: w.a.sellerId, price: '250.00', quantity: 1 })
    const placed = await placeOrderFromCart({
      userId: buyer,
      cartId: cart!.id,
      shippingAddressId: address!.id,
      paymentMethod: 'cash_on_delivery',
      orderSource: 'storefront',
      sendConfirmationEmail: false,
      storefrontPayments: { methods: ['cash_on_delivery'], gateway: null, currency: 'EGP', codMaxOrder: null, codNote: null, transfers: {}, deposit: null },
    })
    if (!placed.success) throw new Error(`placeOrderFromCart failed: ${placed.error}`)
    orderId = placed.data.order.id
    await db
      .update(s.orders)
      .set({ metadata: sql`coalesce(${s.orders.metadata}, '{}'::jsonb) || ${JSON.stringify({ whatsapp: { optIn: true, locale: 'en', at: new Date().toISOString() } })}::jsonb` })
      .where(eq(s.orders.id, orderId))
  }, 120_000)

  afterAll(async () => {
    vi.unstubAllGlobals()
    if (orderId) {
      await db.delete(s.whatsappInbound).where(eq(s.whatsappInbound.orderId, orderId))
      await db.delete(s.whatsappMessages).where(eq(s.whatsappMessages.toPhone, phone))
      await db.delete(s.sellerNotifications).where(sql`${s.sellerNotifications.data} ->> 'orderId' = ${orderId}`)
      await db.delete(s.orderItems).where(eq(s.orderItems.orderId, orderId))
      await db.delete(s.orders).where(eq(s.orders.id, orderId))
    }
    await db.delete(s.whatsappContacts).where(eq(s.whatsappContacts.phone, phone))
    await db.delete(s.storeWhatsappSettings).where(eq(s.storeWhatsappSettings.storeId, w.a.a1))
    if (savedSettings) await db.update(s.whatsappSettings).set(savedSettings).where(eq(s.whatsappSettings.id, 1))
    await db.delete(s.carts).where(eq(s.carts.userId, buyer))
    if (productId) await db.delete(s.products).where(eq(s.products.id, productId))
    await db.delete(s.userAddresses).where(eq(s.userAddresses.userId, buyer))
    await db.delete(s.users).where(eq(s.users.id, buyer))
    await w?.cleanup()
    await client.end()
  })

  const messages = () => db.select().from(s.whatsappMessages).where(eq(s.whatsappMessages.orderId, orderId))

  let messageId = ''

  it('queues an order event once, with the confirm buttons for a pending order', async () => {
    const first = await wa.enqueueOrderWhatsApp(orderId, 'order_placed')
    expect(first.queued).toBe(true)
    expect(await wa.enqueueOrderWhatsApp(orderId, 'order_placed')).toEqual({ queued: false, reason: 'duplicate' })
    const rows = await messages()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ toPhone: phone, locale: 'en', templateName: 'tallaby_order_placed', status: 'queued', priceUsdCents: 0 })
    messageId = rows[0]!.id
  })

  it('skips the confirmed template when the shopper confirmed by button', async () => {
    expect(await wa.enqueueOrderWhatsApp(orderId, 'order_confirmed', { byCustomerButton: true })).toEqual({ queued: false, reason: 'by_customer' })
  })

  it('claims a row once', async () => {
    const claimed = await wa.claimWhatsAppMessages({ ids: [messageId], limit: 10 })
    expect(claimed.map((r) => r.id)).toEqual([messageId])
    expect(await wa.claimWhatsAppMessages({ ids: [messageId], limit: 10 })).toEqual([])
    const [row] = await db.select().from(s.whatsappMessages).where(eq(s.whatsappMessages.id, messageId))
    expect(row).toMatchObject({ status: 'sending', attempts: 1 })
    // As if Graph accepted it.
    await db.update(s.whatsappMessages).set({ status: 'sent', wamid: `wamid.out-${messageId}`, sentAt: sql`now()` }).where(eq(s.whatsappMessages.id, messageId))
  })

  const envelope = (value: Record<string, unknown>) => ({
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { phone_number_id: ENV.WHATSAPP_PHONE_NUMBER_ID }, ...value } }] }],
  })
  const statusBody = (status: string, ts: number) =>
    envelope({ statuses: [{ id: `wamid.out-${messageId}`, status, timestamp: String(ts), recipient_id: phone, pricing: { billable: true, category: 'utility', type: 'regular' } }] })

  it('moves statuses forward only, and prices the message once', async () => {
    const config = wa.getWhatsAppConfig()!
    const now = Math.floor(Date.now() / 1000)
    await wa.handleWhatsAppWebhook(statusBody('read', now + 2), config)
    await wa.handleWhatsAppWebhook(statusBody('delivered', now + 1), config)
    await wa.handleWhatsAppWebhook(statusBody('failed', now + 3), config)
    const [row] = await db.select().from(s.whatsappMessages).where(eq(s.whatsappMessages.id, messageId))
    expect(row!.status).toBe('read')
    expect(row!.readAt).not.toBeNull()
    expect(row!.deliveredAt).not.toBeNull()
    expect(row!.failedAt).toBeNull()
    expect(row!.pricingCategory).toBe('utility')
    expect(row!.metaCostMicros).toBeGreaterThanOrEqual(0)
  })

  it('ignores changes for another phone number', async () => {
    const config = wa.getWhatsAppConfig()!
    const body = statusBody('read', 1)
    ;(body.entry[0]!.changes[0]!.value as { metadata: { phone_number_id: string } }).metadata.phone_number_id = '999999999999'
    expect(await wa.handleWhatsAppWebhook(body, config)).toMatchObject({ otherNumber: 1, statuses: 0 })
  })

  const tap = (inboundWamid: string) =>
    envelope({
      contacts: [{ wa_id: phone, profile: { name: 'WA Test' } }],
      messages: [
        {
          id: inboundWamid,
          from: phone,
          type: 'button',
          timestamp: String(Math.floor(Date.now() / 1000)),
          context: { id: `wamid.out-${messageId}` },
          button: { payload: payload.signQuickReplyPayload('confirm', messageId, ENV.WHATSAPP_PAYLOAD_SECRET), text: 'Confirm order' },
        },
      ],
    })

  it('confirms by button once; a replay does nothing and a second tap is "already"', async () => {
    const config = wa.getWhatsAppConfig()!
    const firstTap = `wamid.in-${randomUUID()}`
    expect(await wa.handleWhatsAppWebhook(tap(firstTap), config)).toMatchObject({ inbound: 1, duplicates: 0 })
    const [order] = await db.select({ status: s.orders.status }).from(s.orders).where(eq(s.orders.id, orderId))
    expect(order!.status).toBe('confirmed')

    expect(await wa.handleWhatsAppWebhook(tap(firstTap), config)).toMatchObject({ inbound: 0, duplicates: 1 })

    const secondTap = `wamid.in-${randomUUID()}`
    await wa.handleWhatsAppWebhook(tap(secondTap), config)
    const inbound = await db.select().from(s.whatsappInbound).where(inArray(s.whatsappInbound.wamid, [firstTap, secondTap]))
    expect(Object.fromEntries(inbound.map((r) => [r.wamid, r.result]))).toEqual({ [firstTap]: 'confirmed', [secondTap]: 'already' })

    const bells = await db
      .select()
      .from(s.sellerNotifications)
      .where(sql`${s.sellerNotifications.type} = 'whatsapp_order_confirmed' AND ${s.sellerNotifications.data} ->> 'orderId' = ${orderId}`)
    expect(bells).toHaveLength(1)
    const replies = await db.select().from(s.whatsappMessages).where(sql`${s.whatsappMessages.event} = 'reply' AND ${s.whatsappMessages.toPhone} = ${phone}`)
    expect(replies).toHaveLength(2)
  })

  it('refuses a tap from another phone', async () => {
    const config = wa.getWhatsAppConfig()!
    const body = tap(`wamid.in-${randomUUID()}`)
    const msg = (body.entry[0]!.changes[0]!.value as { messages: { from: string }[] }).messages[0]!
    msg.from = '201099999999'
    await wa.handleWhatsAppWebhook(body, config)
    const [row] = await db.select().from(s.whatsappInbound).where(eq(s.whatsappInbound.fromPhone, '201099999999'))
    expect(row?.result).toBe('ignored')
    await db.delete(s.whatsappInbound).where(eq(s.whatsappInbound.fromPhone, '201099999999'))
    await db.delete(s.whatsappContacts).where(eq(s.whatsappContacts.phone, '201099999999'))
  })
})
