import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as DB_SCHEMA from '@workspace/db/schema'
import {
  activateSellerService,
  listOpenFulfillmentRequests,
  setSellerServiceStatus,
  upsertSellerFulfillmentRequest,
} from './server'
import type { FulfillmentServiceType } from './constants'

/**
 * P8-01: the dashboard request flow against a REAL Postgres (migration 0040
 * catalog required). Skipped when TEST_DATABASE_URL is unset. Creates and
 * deletes its own users/sellers rows; sellers start WITHOUT fulfillment rows,
 * like every seller signed up since signup stopped creating them.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

describe.skipIf(!TEST_DATABASE_URL)('seller fulfillment request (integration)', () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused', { max: 2 })
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA

  const sellerA = randomUUID()
  const sellerB = randomUUID()
  const adminId = randomUUID()
  let plans: Record<string, string>

  const rowsOf = (sellerId: string) =>
    db.select().from(s.sellerFulfillmentServices).where(eq(s.sellerFulfillmentServices.sellerId, sellerId))
  const rowOf = async (sellerId: string, serviceType: FulfillmentServiceType) =>
    (await db
      .select()
      .from(s.sellerFulfillmentServices)
      .where(and(eq(s.sellerFulfillmentServices.sellerId, sellerId), eq(s.sellerFulfillmentServices.serviceType, serviceType))))[0]!

  const request = (overrides: Record<string, unknown> = {}) => ({
    model: 'seller_managed',
    services: {
      storage: { provider: 'tallaby', planId: plans.storage_growth },
      packaging: { provider: 'seller', planId: null },
      delivery: { provider: 'tallaby', planId: plans.delivery_standard },
      customer_service: { provider: 'seller', planId: null },
      returns: { provider: 'seller', planId: null },
    },
    details: {
      estimatedSkus: '11_50',
      estimatedDailyOrders: '6_20',
      sizeCategory: 'small',
      hasFragileProducts: false,
      estimatedInventoryUnits: '101_500',
    },
    pickupAddress: null,
    ...overrides,
  })

  beforeAll(async () => {
    await db.insert(s.users).values([
      { id: sellerA, isGuest: false, role: 'seller' },
      { id: sellerB, isGuest: false, role: 'seller' },
      { id: adminId, isGuest: false, role: 'admin' },
    ])
    await db.insert(s.sellers).values(
      [sellerA, sellerB].map((id) => ({
        id,
        businessName: `Fulfillment Request ${id.slice(0, 8)}`,
        displayName: 'Fulfillment Request',
        slug: `fulfillment-request-${id}`,
        businessType: 'individual',
        legalAddress: {},
        supportEmail: 'test@example.com',
        status: 'approved',
      })),
    )
    const rows = await db.select({ id: s.fulfillmentPlans.id, code: s.fulfillmentPlans.code }).from(s.fulfillmentPlans)
    plans = Object.fromEntries(rows.map((r) => [r.code, r.id]))
  })

  afterAll(async () => {
    await db.delete(s.users).where(inArray(s.users.id, [sellerA, sellerB, adminId]))
    await client.end()
  })

  it('a seller with no rows can request: requested_* written, active_* is the baseline', async () => {
    expect(await rowsOf(sellerA)).toHaveLength(0)
    const result = await upsertSellerFulfillmentRequest({ sellerId: sellerA, request: request() }, db as never)
    expect(result).toEqual({ success: true, changed: true, needsContact: true })

    const rows = await rowsOf(sellerA)
    expect(rows).toHaveLength(5)
    expect(await rowOf(sellerA, 'storage')).toMatchObject({
      status: 'requested',
      requestedProvider: 'tallaby',
      requestedPlanId: plans.storage_growth,
      activeProvider: 'seller',
      activePlanId: null,
      activatedAt: null,
    })
    expect(await rowOf(sellerA, 'delivery')).toMatchObject({
      status: 'active',
      activeProvider: 'tallaby',
      activePlanId: plans.delivery_standard,
    })
    const [profile] = await db.select().from(s.sellerFulfillmentProfiles).where(eq(s.sellerFulfillmentProfiles.sellerId, sellerA))
    expect(profile).toMatchObject({ model: 'seller_managed', reviewStatus: 'pending_contact', termsAcceptedAt: null })
  })

  it('the admin queue sees the request (same query the admin screen uses)', async () => {
    const queue = await listOpenFulfillmentRequests({}, db as never)
    const mine = queue.filter((r) => r.sellerId === sellerA)
    expect(mine.map((r) => r.serviceType)).toEqual(['storage'])
    expect(mine[0]).toMatchObject({ status: 'requested', requestedPlanId: plans.storage_growth, activeProvider: 'seller' })
  })

  it('re-requesting the same thing is idempotent (no writes)', async () => {
    const before = await rowsOf(sellerA)
    const result = await upsertSellerFulfillmentRequest({ sellerId: sellerA, request: request() }, db as never)
    expect(result).toMatchObject({ success: true, changed: false })
    const after = await rowsOf(sellerA)
    expect(after.map((r) => [r.serviceType, r.requestedAt, r.updatedAt, r.status]).sort()).toEqual(
      before.map((r) => [r.serviceType, r.requestedAt, r.updatedAt, r.status]).sort(),
    )
  })

  it('a new request on an activated service never touches active_*', async () => {
    await activateSellerService({ sellerId: sellerA, serviceType: 'storage', adminId }, db as never)
    const activated = await rowOf(sellerA, 'storage')
    expect(activated).toMatchObject({ status: 'active', activeProvider: 'tallaby', activePlanId: plans.storage_growth })

    const result = await upsertSellerFulfillmentRequest(
      {
        sellerId: sellerA,
        request: request({
          services: { ...request().services, storage: { provider: 'tallaby', planId: plans.storage_basic } },
        }),
      },
      db as never,
    )
    expect(result).toMatchObject({ success: true, changed: true })
    const storage = await rowOf(sellerA, 'storage')
    expect(storage).toMatchObject({
      status: 'requested',
      requestedPlanId: plans.storage_basic,
      activeProvider: activated.activeProvider,
      activePlanId: activated.activePlanId,
      activatedAt: activated.activatedAt,
    })
    expect(storage.activeConfig).toEqual(activated.activeConfig)
  })

  it('choosing the live configuration again withdraws the open request', async () => {
    const result = await upsertSellerFulfillmentRequest({ sellerId: sellerA, request: request() }, db as never)
    expect(result).toMatchObject({ success: true, changed: true, needsContact: false })
    expect(await rowOf(sellerA, 'storage')).toMatchObject({
      status: 'active',
      requestedPlanId: plans.storage_growth,
      activePlanId: plans.storage_growth,
    })
  })

  it('a paused service cannot be changed by the seller', async () => {
    await setSellerServiceStatus({ sellerId: sellerA, serviceType: 'storage', status: 'paused', adminId }, db as never)
    const result = await upsertSellerFulfillmentRequest(
      {
        sellerId: sellerA,
        request: request({
          services: { ...request().services, storage: { provider: 'seller', planId: null } },
          // Seller keeps the stock and Tallaby delivers: a pickup address is required.
          pickupAddress: { governorate: 'CAIRO', city: 'Nasr City', street: '1 Abbas El Akkad', contactPhone: '01012345678' },
        }),
      },
      db as never,
    )
    expect(result).toEqual({ success: false, error: 'service_paused', serviceTypes: ['storage'] })
    expect((await rowOf(sellerA, 'storage')).status).toBe('paused')
  })

  it('invalid input is refused before anything is written', async () => {
    const result = await upsertSellerFulfillmentRequest(
      {
        sellerId: sellerB,
        request: request({ services: { ...request().services, storage: { provider: 'tallaby', planId: plans.packaging_gift } } }),
      },
      db as never,
    )
    expect(result).toMatchObject({ success: false, error: 'invalid_input', errors: { 'services.storage.planId': 'plan_unavailable' } })
    expect(await rowsOf(sellerB)).toHaveLength(0)
  })

  it("seller B's request (even naming A's id in the payload) writes only B's rows", async () => {
    const aBefore = await rowsOf(sellerA)
    const result = await upsertSellerFulfillmentRequest(
      {
        sellerId: sellerB,
        request: {
          ...request({ services: { ...request().services, delivery: { provider: 'seller', planId: null, config: { mode: 'own_riders' } } } }),
          sellerId: sellerA,
        },
      },
      db as never,
    )
    expect(result).toMatchObject({ success: true, changed: true })
    expect(await rowsOf(sellerB)).toHaveLength(5)
    expect(await rowOf(sellerB, 'delivery')).toMatchObject({
      status: 'requested',
      requestedProvider: 'seller',
      requestedConfig: { mode: 'own_riders' },
      activeProvider: 'tallaby',
    })
    const aAfter = await rowsOf(sellerA)
    expect(aAfter.map((r) => [r.serviceType, r.requestedAt, r.updatedAt]).sort()).toEqual(
      aBefore.map((r) => [r.serviceType, r.requestedAt, r.updatedAt]).sort(),
    )
  })
})
