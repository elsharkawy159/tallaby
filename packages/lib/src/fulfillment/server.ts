import {
  db,
  and,
  asc,
  desc,
  eq,
  inArray,
  fulfillmentPlans,
  sellerFulfillmentAgreements,
  sellerFulfillmentProfiles,
  sellerFulfillmentServices,
  sellers,
} from '@workspace/db'
import {
  BASELINE_DELIVERY_PLAN_CODE,
  FULFILLMENT_SERVICE_TYPES,
  SELLER_TERMS_VERSION,
  type FulfillmentAgreementStatus,
  type FulfillmentReviewStatus,
  type FulfillmentServiceStatus,
  type FulfillmentServiceType,
} from './constants'
import { toFulfillmentPlanView } from './plan-view'
import { buildInitialServiceRows } from './resolve'
import type {
  AgreementRate,
  FulfillmentPlanView,
  PlanPricing,
  LocalizedText,
  SellerServiceRow,
  ServiceConfig,
} from './types'
import type { FulfillmentRequest } from './validate'

/**
 * Server-only fulfillment persistence. Kept out of the `./index` barrel so
 * client components importing constants/validation never pull in the DB.
 * Import from `@workspace/lib/fulfillment/server`.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Queryable = Tx | typeof db

export class FulfillmentError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'baseline_plan_missing'
      | 'service_not_found'
      | 'invalid_transition'
      | 'plan_not_found',
  ) {
    super(message)
    this.name = 'FulfillmentError'
  }
}

/**
 * The constraint name of a Postgres unique violation (SQLSTATE 23505), or null.
 * drizzle-orm wraps driver errors in DrizzleQueryError whose message is just
 * "Failed query: ..."; the postgres error lives on `.cause`.
 */
export function uniqueViolationConstraint(error: unknown): string | null {
  for (let e: unknown = error, depth = 0; e && depth < 4; e = (e as { cause?: unknown }).cause, depth++) {
    const pg = e as { code?: string; constraint_name?: string; constraint?: string }
    if (pg.code === '23505') return pg.constraint_name ?? pg.constraint ?? ''
  }
  return null
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export async function listFulfillmentPlans(
  options: { activeOnly?: boolean } = {},
  q: Queryable = db,
): Promise<FulfillmentPlanView[]> {
  const rows = await q
    .select()
    .from(fulfillmentPlans)
    .where(options.activeOnly ? eq(fulfillmentPlans.isActive, true) : undefined)
    .orderBy(asc(fulfillmentPlans.serviceType), asc(fulfillmentPlans.sortOrder), asc(fulfillmentPlans.code))
  return rows.map(toFulfillmentPlanView)
}

/** The baseline delivery plan id. Looked up regardless of `is_active`: it describes existing behavior. */
export async function getBaselineDeliveryPlanId(q: Queryable = db): Promise<string> {
  const [plan] = await q
    .select({ id: fulfillmentPlans.id })
    .from(fulfillmentPlans)
    .where(eq(fulfillmentPlans.code, BASELINE_DELIVERY_PLAN_CODE))
    .limit(1)
  if (!plan) {
    throw new FulfillmentError(
      `Baseline delivery plan "${BASELINE_DELIVERY_PLAN_CODE}" is missing. Apply migration 0040.`,
      'baseline_plan_missing',
    )
  }
  return plan.id
}

export interface FulfillmentPlanInput {
  code: string
  serviceType: FulfillmentServiceType
  nameEn: string
  nameAr: string
  descriptionEn: string | null
  descriptionAr: string | null
  features: LocalizedText[]
  limits: Record<string, unknown> | null
  pricing: PlanPricing | null
  shippingSpeed: 'standard' | 'expedited' | 'priority' | 'one_day' | 'same_day' | null
  availability: { governorates?: string[] } | null
  isActive: boolean
  sortOrder: number
}

export async function createFulfillmentPlan(input: FulfillmentPlanInput) {
  const [row] = await db.insert(fulfillmentPlans).values(input).returning({ id: fulfillmentPlans.id })
  return row!
}

/** `code` and `serviceType` are immutable after creation: seller rows reference the pair. */
export async function updateFulfillmentPlan(
  planId: string,
  input: Omit<FulfillmentPlanInput, 'code' | 'serviceType'>,
) {
  const [row] = await db
    .update(fulfillmentPlans)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(fulfillmentPlans.id, planId))
    .returning({ id: fulfillmentPlans.id })
  if (!row) throw new FulfillmentError('Plan not found', 'plan_not_found')
  return row
}

export async function setFulfillmentPlanActive(planId: string, isActive: boolean) {
  const [row] = await db
    .update(fulfillmentPlans)
    .set({ isActive, updatedAt: new Date().toISOString() })
    .where(eq(fulfillmentPlans.id, planId))
    .returning({ id: fulfillmentPlans.id })
  if (!row) throw new FulfillmentError('Plan not found', 'plan_not_found')
  return row
}

// ---------------------------------------------------------------------------
// Seller setup (onboarding)
// ---------------------------------------------------------------------------

/**
 * Writes the seller's fulfillment profile and five service rows inside the
 * caller's transaction (the same one that creates the seller). Active columns
 * are today's baseline; requested columns hold the seller's choices.
 */
export async function createSellerFulfillmentSetup(
  tx: Tx,
  input: { sellerId: string; request: FulfillmentRequest; termsAcceptedAt: string },
) {
  const baselineDeliveryPlanId = await getBaselineDeliveryPlanId(tx)
  const now = new Date().toISOString()
  const rows = buildInitialServiceRows(input.request.services, baselineDeliveryPlanId)
  const needsContact = rows.some((row) => row.status === 'requested')

  await tx.insert(sellerFulfillmentProfiles).values({
    sellerId: input.sellerId,
    model: input.request.model,
    operationalDetails: input.request.details,
    pickupAddress: input.request.pickupAddress ?? null,
    submittedAt: now,
    termsAcceptedAt: input.termsAcceptedAt,
    termsVersion: SELLER_TERMS_VERSION,
    reviewStatus: needsContact ? 'pending_contact' : 'configured',
  })

  await tx.insert(sellerFulfillmentServices).values(
    rows.map((row) => ({
      sellerId: input.sellerId,
      serviceType: row.serviceType,
      requestedProvider: row.requestedProvider,
      requestedPlanId: row.requestedPlanId,
      requestedConfig: row.requestedConfig,
      requestedAt: now,
      activeProvider: row.activeProvider,
      activePlanId: row.activePlanId,
      activeConfig: row.activeConfig,
      activatedAt: row.status === 'active' ? now : null,
      status: row.status,
    })),
  )

  return { needsContact }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type SellerFulfillmentProfileRow = typeof sellerFulfillmentProfiles.$inferSelect
export type SellerFulfillmentServiceRow = typeof sellerFulfillmentServices.$inferSelect
export type SellerFulfillmentAgreementRow = typeof sellerFulfillmentAgreements.$inferSelect

export interface SellerFulfillmentOverview {
  profile: SellerFulfillmentProfileRow | null
  services: SellerFulfillmentServiceRow[]
  agreements: SellerFulfillmentAgreementRow[]
  plans: FulfillmentPlanView[]
}

export async function getSellerFulfillmentOverview(
  sellerId: string,
  options: { includeAgreements?: boolean } = {},
): Promise<SellerFulfillmentOverview> {
  const [profileRows, services, agreements, plans] = await Promise.all([
    db
      .select()
      .from(sellerFulfillmentProfiles)
      .where(eq(sellerFulfillmentProfiles.sellerId, sellerId))
      .limit(1),
    db.select().from(sellerFulfillmentServices).where(eq(sellerFulfillmentServices.sellerId, sellerId)),
    options.includeAgreements
      ? db
          .select()
          .from(sellerFulfillmentAgreements)
          .where(eq(sellerFulfillmentAgreements.sellerId, sellerId))
          .orderBy(desc(sellerFulfillmentAgreements.createdAt))
      : Promise.resolve([] as SellerFulfillmentAgreementRow[]),
    // All plans, not only active ones: a seller's row may point at a plan an
    // admin has since deactivated, and it still needs a name.
    listFulfillmentPlans(),
  ])

  const order = new Map(FULFILLMENT_SERVICE_TYPES.map((type, index) => [type, index]))
  services.sort((a, b) => order.get(a.serviceType)! - order.get(b.serviceType)!)

  return { profile: profileRows[0] ?? null, services, agreements, plans }
}

export function toSellerServiceRow(row: SellerFulfillmentServiceRow): SellerServiceRow {
  return {
    serviceType: row.serviceType,
    status: row.status,
    requestedProvider: row.requestedProvider,
    requestedPlanId: row.requestedPlanId,
    requestedConfig: (row.requestedConfig ?? {}) as ServiceConfig,
    activeProvider: row.activeProvider,
    activePlanId: row.activePlanId,
    activeConfig: (row.activeConfig ?? {}) as ServiceConfig,
  }
}

// ---------------------------------------------------------------------------
// Admin transitions
// ---------------------------------------------------------------------------

/** Statuses an admin may set directly. `active` only happens via activateSellerService. */
export type ManualServiceStatus = Exclude<FulfillmentServiceStatus, 'active'>

/**
 * Makes the requested configuration live: copies requested_* -> active_*.
 * This is the only code path that changes what orders run under.
 */
export async function activateSellerService(input: {
  sellerId: string
  serviceType: FulfillmentServiceType
  adminId: string
  agreementId?: string | null
  notes?: string | null
}, database: typeof db = db) {
  return database.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(sellerFulfillmentServices)
      .where(
        and(
          eq(sellerFulfillmentServices.sellerId, input.sellerId),
          eq(sellerFulfillmentServices.serviceType, input.serviceType),
        ),
      )
      .for('update')
      .limit(1)
    if (!row) throw new FulfillmentError('Service row not found', 'service_not_found')

    const now = new Date().toISOString()
    await tx
      .update(sellerFulfillmentServices)
      .set({
        activeProvider: row.requestedProvider,
        activePlanId: row.requestedPlanId,
        activeConfig: row.requestedConfig,
        activatedAt: now,
        status: 'active',
        agreementId: input.agreementId ?? row.agreementId,
        notes: input.notes ?? row.notes,
        updatedBy: input.adminId,
        updatedAt: now,
      })
      .where(eq(sellerFulfillmentServices.id, row.id))

    await refreshProfileReviewStatus(tx, input.sellerId, input.adminId)
  })
}

/**
 * Moves a service through review states. Never touches active_* - except
 * `paused`, which the resolver already treats as "fall back to baseline".
 */
export async function setSellerServiceStatus(input: {
  sellerId: string
  serviceType: FulfillmentServiceType
  status: ManualServiceStatus
  adminId: string
  notes?: string | null
}, database: typeof db = db) {
  return database.transaction(async (tx) => {
    const [row] = await tx
      .update(sellerFulfillmentServices)
      .set({
        status: input.status,
        notes: input.notes ?? undefined,
        updatedBy: input.adminId,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(sellerFulfillmentServices.sellerId, input.sellerId),
          eq(sellerFulfillmentServices.serviceType, input.serviceType),
        ),
      )
      .returning({ id: sellerFulfillmentServices.id })
    if (!row) throw new FulfillmentError('Service row not found', 'service_not_found')

    await refreshProfileReviewStatus(tx, input.sellerId, input.adminId)
  })
}

/**
 * Keeps the profile's review status in step with its services: configured
 * once nothing is open, and back to "contacted" if an admin reopens a service
 * on a configured profile (the seller was already contacted before).
 */
async function refreshProfileReviewStatus(tx: Tx, sellerId: string, adminId: string) {
  const rows = await tx
    .select({ status: sellerFulfillmentServices.status })
    .from(sellerFulfillmentServices)
    .where(eq(sellerFulfillmentServices.sellerId, sellerId))
  const open = rows.some((row) =>
    (['requested', 'under_review', 'awaiting_agreement'] as FulfillmentServiceStatus[]).includes(row.status),
  )
  const now = new Date().toISOString()
  if (open) {
    await tx
      .update(sellerFulfillmentProfiles)
      .set({ reviewStatus: 'contacted', reviewedBy: adminId, updatedAt: now })
      .where(
        and(
          eq(sellerFulfillmentProfiles.sellerId, sellerId),
          eq(sellerFulfillmentProfiles.reviewStatus, 'configured'),
        ),
      )
    return
  }
  await tx
    .update(sellerFulfillmentProfiles)
    .set({ reviewStatus: 'configured', reviewedBy: adminId, updatedAt: now })
    .where(eq(sellerFulfillmentProfiles.sellerId, sellerId))
}

export async function updateSellerFulfillmentReview(input: {
  sellerId: string
  reviewStatus: FulfillmentReviewStatus
  adminNotes: string | null
  adminId: string
}) {
  const [row] = await db
    .update(sellerFulfillmentProfiles)
    .set({
      reviewStatus: input.reviewStatus,
      adminNotes: input.adminNotes,
      reviewedBy: input.adminId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sellerFulfillmentProfiles.sellerId, input.sellerId))
    .returning({ sellerId: sellerFulfillmentProfiles.sellerId })
  if (!row) throw new FulfillmentError('Fulfillment profile not found', 'service_not_found')
}

// ---------------------------------------------------------------------------
// Agreements
// ---------------------------------------------------------------------------

export interface AgreementInput {
  sellerId: string
  serviceType: FulfillmentServiceType
  planId: string | null
  rates: AgreementRate[]
  effectiveFrom: string | null
  effectiveTo: string | null
  status: FulfillmentAgreementStatus
  notes: string | null
}

export async function upsertSellerFulfillmentAgreement(
  input: AgreementInput & { id?: string; adminId: string },
) {
  const now = new Date().toISOString()
  const approvedBy = input.status === 'active' || input.status === 'accepted' ? input.adminId : undefined
  const values = {
    serviceType: input.serviceType,
    planId: input.planId,
    rates: input.rates,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    status: input.status,
    notes: input.notes,
    updatedAt: now,
    ...(approvedBy ? { approvedBy } : {}),
  }

  if (input.id) {
    const [row] = await db
      .update(sellerFulfillmentAgreements)
      .set(values)
      .where(
        and(
          eq(sellerFulfillmentAgreements.id, input.id),
          eq(sellerFulfillmentAgreements.sellerId, input.sellerId),
        ),
      )
      .returning({ id: sellerFulfillmentAgreements.id })
    if (!row) throw new FulfillmentError('Agreement not found', 'service_not_found')
    return row
  }

  const [row] = await db
    .insert(sellerFulfillmentAgreements)
    .values({ ...values, sellerId: input.sellerId, createdBy: input.adminId })
    .returning({ id: sellerFulfillmentAgreements.id })
  return row!
}

// ---------------------------------------------------------------------------
// Admin queue
// ---------------------------------------------------------------------------

export async function listOpenFulfillmentRequests(
  options: { status?: FulfillmentServiceStatus; serviceType?: FulfillmentServiceType } = {},
) {
  const openStatuses: FulfillmentServiceStatus[] = options.status
    ? [options.status]
    : ['requested', 'under_review', 'awaiting_agreement']

  return db
    .select({
      id: sellerFulfillmentServices.id,
      sellerId: sellerFulfillmentServices.sellerId,
      businessName: sellers.businessName,
      supportPhone: sellers.supportPhone,
      serviceType: sellerFulfillmentServices.serviceType,
      status: sellerFulfillmentServices.status,
      requestedProvider: sellerFulfillmentServices.requestedProvider,
      requestedPlanId: sellerFulfillmentServices.requestedPlanId,
      activeProvider: sellerFulfillmentServices.activeProvider,
      activePlanId: sellerFulfillmentServices.activePlanId,
      requestedAt: sellerFulfillmentServices.requestedAt,
    })
    .from(sellerFulfillmentServices)
    .innerJoin(sellers, eq(sellers.id, sellerFulfillmentServices.sellerId))
    .where(
      and(
        inArray(sellerFulfillmentServices.status, openStatuses),
        options.serviceType ? eq(sellerFulfillmentServices.serviceType, options.serviceType) : undefined,
      ),
    )
    .orderBy(asc(sellerFulfillmentServices.requestedAt))
}
