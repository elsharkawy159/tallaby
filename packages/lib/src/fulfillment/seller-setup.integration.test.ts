import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { and, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as DB_SCHEMA from '@workspace/db/schema'
import {
  activateSellerService,
  createSellerFulfillmentSetup,
  setSellerServiceStatus,
  uniqueViolationConstraint,
} from './server'
import type { FulfillmentRequest } from './validate'
import type { FulfillmentServiceType } from './constants'

/**
 * Against a REAL Postgres with migrations 0040 applied (the seeded catalog is
 * required). Skipped when TEST_DATABASE_URL is unset. Creates and deletes its
 * own users/sellers rows.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL

describe.skipIf(!TEST_DATABASE_URL)('seller fulfillment setup (integration)', () => {
  const client = postgres(TEST_DATABASE_URL ?? 'postgres://unused')
  const db = drizzle(client, { schema: DB_SCHEMA })
  const s = DB_SCHEMA

  const sellerId = randomUUID()
  const adminId = randomUUID()
  let plans: Record<string, string>

  const serviceRow = (serviceType: FulfillmentServiceType) =>
    db
      .select()
      .from(s.sellerFulfillmentServices)
      .where(and(eq(s.sellerFulfillmentServices.sellerId, sellerId), eq(s.sellerFulfillmentServices.serviceType, serviceType)))
      .then((rows) => rows[0]!)

  beforeAll(async () => {
    await db.insert(s.users).values([
      { id: sellerId, isGuest: false, role: 'seller' },
      { id: adminId, isGuest: false, role: 'admin' },
    ])
    await db.insert(s.sellers).values({
      id: sellerId,
      businessName: 'Fulfillment Test',
      displayName: 'Fulfillment Test',
      slug: `fulfillment-test-${sellerId}`,
      businessType: 'individual',
      legalAddress: {},
      supportEmail: 'test@example.com',
      status: 'approved',
    })
    const rows = await db.select({ id: s.fulfillmentPlans.id, code: s.fulfillmentPlans.code }).from(s.fulfillmentPlans)
    plans = Object.fromEntries(rows.map((r) => [r.code, r.id]))
  })

  afterAll(async () => {
    await db.delete(s.users).where(eq(s.users.id, sellerId))
    await db.delete(s.users).where(eq(s.users.id, adminId))
    await client.end()
  })

  it('writes a profile and five rows with baseline active and choices requested', async () => {
    const request: FulfillmentRequest = {
      model: 'seller_managed',
      services: {
        storage: { provider: 'tallaby', planId: plans.storage_growth! },
        packaging: { provider: 'seller', planId: null },
        delivery: { provider: 'tallaby', planId: plans.delivery_standard! },
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
      pickupAddress: { governorate: 'CAIRO', city: 'Nasr City', street: '1 Abbas El Akkad', contactPhone: '01012345678' },
    }

    const result = await db.transaction((tx) =>
      createSellerFulfillmentSetup(tx as never, { sellerId, request, termsAcceptedAt: new Date().toISOString() }),
    )
    expect(result.needsContact).toBe(true)

    const storage = await serviceRow('storage')
    expect(storage).toMatchObject({
      status: 'requested',
      requestedProvider: 'tallaby',
      requestedPlanId: plans.storage_growth,
      activeProvider: 'seller',
      activePlanId: null,
    })
    expect((await serviceRow('delivery')).status).toBe('active')
  })

  it('a status change never touches the active configuration', async () => {
    await setSellerServiceStatus(
      { sellerId, serviceType: 'storage', status: 'awaiting_agreement', adminId },
      db as never,
    )
    const storage = await serviceRow('storage')
    expect(storage.status).toBe('awaiting_agreement')
    expect(storage.activeProvider).toBe('seller')
  })

  it('activation copies requested into active and closes the review', async () => {
    await activateSellerService({ sellerId, serviceType: 'storage', adminId }, db as never)
    const storage = await serviceRow('storage')
    expect(storage).toMatchObject({ status: 'active', activeProvider: 'tallaby', activePlanId: plans.storage_growth })

    const [profile] = await db
      .select()
      .from(s.sellerFulfillmentProfiles)
      .where(eq(s.sellerFulfillmentProfiles.sellerId, sellerId))
    expect(profile!.reviewStatus).toBe('configured')
  })

  it('reopening a service on a configured profile reopens the review', async () => {
    await setSellerServiceStatus({ sellerId, serviceType: 'packaging', status: 'under_review', adminId }, db as never)
    const [profile] = await db
      .select()
      .from(s.sellerFulfillmentProfiles)
      .where(eq(s.sellerFulfillmentProfiles.sellerId, sellerId))
    expect(profile!.reviewStatus).toBe('contacted')
    // Packaging was seller-handled and stays so: a status change never touches active_*.
    expect((await serviceRow('packaging')).activeProvider).toBe('seller')
  })

  it('uniqueViolationConstraint sees through the Drizzle error wrapper', async () => {
    const error = await db
      .insert(s.fulfillmentPlans)
      .values({ code: 'storage_basic', serviceType: 'storage', nameEn: 'Dup', nameAr: 'Dup' })
      .then(() => null, (e: unknown) => e)
    expect(error).toBeTruthy()
    expect(uniqueViolationConstraint(error)).toBe('fulfillment_plans_code_unique')
    expect(uniqueViolationConstraint(new Error('unique slug'))).toBeNull()
  })

  it('the database rejects a plan attached to the wrong service', async () => {
    await expect(
      db
        .update(s.sellerFulfillmentServices)
        .set({ requestedPlanId: plans.packaging_gift! })
        .where(and(eq(s.sellerFulfillmentServices.sellerId, sellerId), eq(s.sellerFulfillmentServices.serviceType, 'storage'))),
    ).rejects.toThrow()
  })

  it('the database rejects a plan on a seller-handled service', async () => {
    await expect(
      db
        .update(s.sellerFulfillmentServices)
        .set({ requestedPlanId: plans.packaging_standard! })
        .where(and(eq(s.sellerFulfillmentServices.sellerId, sellerId), eq(s.sellerFulfillmentServices.serviceType, 'packaging'))),
    ).rejects.toThrow()
  })
})
