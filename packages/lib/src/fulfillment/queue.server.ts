import { db, sql } from '@workspace/db'
import type { SQL } from 'drizzle-orm'
import type { FulfillmentModel, FulfillmentReviewStatus } from './constants'
import {
  FULFILLMENT_QUEUE_PAGE_SIZE,
  OPEN_FULFILLMENT_STATUSES,
  type FulfillmentQueueFilters,
  type FulfillmentQueueService,
} from './queue'

type Queryable = Pick<typeof db, 'execute'>

export interface FulfillmentQueueRow {
  sellerId: string
  businessName: string
  supportPhone: string | null
  email: string | null
  model: FulfillmentModel | null
  reviewStatus: FulfillmentReviewStatus | null
  services: FulfillmentQueueService[]
  openCount: number
  activeCount: number
  oldestOpenAt: string | null
  updatedAt: string | null
}

const OPEN_LIST = sql.join(
  OPEN_FULFILLMENT_STATUSES.map((status) => sql`${status}`),
  sql`, `,
)

/** WHERE + ORDER BY shared by the page query and the navigation id list, so both use the same order. */
function queueFrom(filters: Omit<FulfillmentQueueFilters, 'page'>): SQL {
  const conditions: SQL[] = [sql`(p.seller_id IS NOT NULL OR agg.total > 0)`]
  if (filters.state === 'open') conditions.push(sql`agg.open_count > 0`)
  if (filters.state === 'active') conditions.push(sql`agg.active_count > 0`)
  if (filters.service) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM seller_fulfillment_services f2
      WHERE f2.seller_id = s.id AND f2.service_type = ${filters.service}
        ${filters.state === 'open' ? sql`AND f2.status IN (${OPEN_LIST})` : filters.state === 'active' ? sql`AND f2.status = 'active'` : sql``}
    )`)
  }
  if (filters.review) conditions.push(sql`p.review_status = ${filters.review}`)
  if (filters.q) {
    const like = `%${filters.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
    conditions.push(sql`(s.business_name ILIKE ${like} OR s.support_phone ILIKE ${like} OR u.email ILIKE ${like})`)
  }

  return sql`
    FROM sellers s
    JOIN users u ON u.id = s.id
    LEFT JOIN seller_fulfillment_profiles p ON p.seller_id = s.id
    LEFT JOIN LATERAL (
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE f.status IN (${OPEN_LIST}))::int AS open_count,
        count(*) FILTER (WHERE f.status = 'active')::int AS active_count,
        min(f.requested_at) FILTER (WHERE f.status IN (${OPEN_LIST})) AS oldest_open_at,
        max(f.updated_at) AS updated_at,
        coalesce(jsonb_agg(jsonb_build_object(
          'serviceType', f.service_type,
          'status', f.status,
          'requestedProvider', f.requested_provider,
          'activeProvider', f.active_provider,
          'requestedAt', f.requested_at
        )) FILTER (WHERE f.id IS NOT NULL), '[]'::jsonb) AS services
      FROM seller_fulfillment_services f
      WHERE f.seller_id = s.id
    ) agg ON true
    WHERE ${sql.join(conditions, sql` AND `)}
    ORDER BY agg.oldest_open_at ASC NULLS LAST, greatest(agg.updated_at, p.updated_at) DESC NULLS LAST, s.id
  `
}

function toIso(value: unknown): string | null {
  if (value == null) return null
  return value instanceof Date ? value.toISOString() : String(value)
}

/**
 * One row per seller that has a fulfillment profile or any service row, with
 * the five services aggregated (docs/admin-saas.md §3.1). One round trip:
 * rows and the total come back together.
 */
export async function listFulfillmentSellerQueue(
  filters: FulfillmentQueueFilters,
  q: Queryable = db,
): Promise<{ rows: FulfillmentQueueRow[]; total: number; pageSize: number }> {
  const offset = (filters.page - 1) * FULFILLMENT_QUEUE_PAGE_SIZE
  const result = await q.execute(sql`
    SELECT
      s.id AS seller_id, s.business_name, s.support_phone, u.email,
      p.model, p.review_status,
      agg.services, agg.open_count, agg.active_count, agg.oldest_open_at,
      greatest(agg.updated_at, p.updated_at) AS updated_at,
      count(*) OVER ()::int AS total_count
    ${queueFrom(filters)}
    LIMIT ${FULFILLMENT_QUEUE_PAGE_SIZE} OFFSET ${offset}
  `)
  const raw = [...result] as Record<string, unknown>[]
  return {
    rows: raw.map((row) => ({
      sellerId: String(row.seller_id),
      businessName: String(row.business_name ?? ''),
      supportPhone: (row.support_phone as string | null) ?? null,
      email: (row.email as string | null) ?? null,
      model: (row.model as FulfillmentModel | null) ?? null,
      reviewStatus: (row.review_status as FulfillmentReviewStatus | null) ?? null,
      services: (row.services as FulfillmentQueueService[] | null) ?? [],
      openCount: Number(row.open_count ?? 0),
      activeCount: Number(row.active_count ?? 0),
      oldestOpenAt: toIso(row.oldest_open_at),
      updatedAt: toIso(row.updated_at),
    })),
    total: Number(raw[0]?.total_count ?? 0),
    pageSize: FULFILLMENT_QUEUE_PAGE_SIZE,
  }
}

/** Seller ids of the whole queue in display order (capped), for previous/next on the detail page. */
export async function listFulfillmentQueueSellerIds(
  filters: Omit<FulfillmentQueueFilters, 'page'>,
  q: Queryable = db,
  limit = 1000,
): Promise<string[]> {
  const result = await q.execute(sql`SELECT s.id ${queueFrom(filters)} LIMIT ${limit}`)
  return ([...result] as Record<string, unknown>[]).map((row) => String(row.id))
}
