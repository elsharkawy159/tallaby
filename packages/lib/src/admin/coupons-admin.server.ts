/**
 * Admin view of seller and affiliate coupons (docs/admin-saas.md §3.2).
 * Platform coupons keep their own CRUD in apps/admin/actions/coupons.ts.
 * Seller coupons are seller-wide (coupons has no store_id).
 */
import {
  affiliates,
  and,
  asc,
  coupons,
  couponUsage,
  db,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  or,
  sellers,
  sql,
  stores,
  users,
} from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { assertAdminActor, AdminActorError, writeAdminAudit, type Queryable } from "./guard.server";
import {
  ADMIN_LIST_PAGE_SIZE,
  likePattern,
  sellerCouponToggleSchema,
  type AdminCouponState,
  type SaasAdminError,
} from "./saas.lib";

const STATE_SQL: Record<AdminCouponState, SQL> = {
  inactive: sql`coalesce(${coupons.isActive}, false) = false`,
  expired: sql`coalesce(${coupons.isActive}, false) = true AND ${coupons.expiresAt} < now()`,
  scheduled: sql`coalesce(${coupons.isActive}, false) = true AND ${coupons.startsAt} > now()`,
  active: sql`coalesce(${coupons.isActive}, false) = true AND ${coupons.startsAt} <= now() AND ${coupons.expiresAt} >= now()`,
};

const isAffiliateCoupon = sql`EXISTS (SELECT 1 FROM ${affiliates} WHERE ${affiliates.couponId} = ${coupons.id})`;

export type AdminCouponScope = "seller" | "affiliate";

export interface AdminCouponListInput {
  scope: AdminCouponScope;
  q: string | null;
  state: AdminCouponState | null;
  sellerId: string | null;
  page: number;
}

/**
 * Seller coupons (seller_id set) or affiliate coupons, with the discount
 * actually given (sum of coupon_usage) in the same round trip.
 */
export async function listCouponsForAdmin(input: AdminCouponListInput, q: Queryable = db) {
  const conditions: SQL[] = [
    input.scope === "seller" ? and(isNotNull(coupons.sellerId), sql`NOT ${isAffiliateCoupon}`)! : isAffiliateCoupon,
  ];
  if (input.state) conditions.push(STATE_SQL[input.state]);
  if (input.sellerId) conditions.push(eq(coupons.sellerId, input.sellerId));
  if (input.q) {
    const like = likePattern(input.q);
    conditions.push(
      or(
        sql`${coupons.code} ILIKE ${like}`,
        sql`${coupons.name} ILIKE ${like}`,
        sql`${sellers.businessName} ILIKE ${like}`,
        sql`${users.email} ILIKE ${like}`,
      )!,
    );
  }
  const where = and(...conditions);
  const offset = (input.page - 1) * ADMIN_LIST_PAGE_SIZE;

  const rows = await q
    .select({
      id: coupons.id,
      code: coupons.code,
      name: coupons.name,
      sellerId: coupons.sellerId,
      sellerName: sql<string | null>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`,
      affiliateId: sql<string | null>`(SELECT ${affiliates.id} FROM ${affiliates} WHERE ${affiliates.couponId} = ${coupons.id} LIMIT 1)`,
      affiliateEmail: sql<string | null>`(SELECT u2.email FROM ${affiliates} a2 JOIN users u2 ON u2.id = a2.user_id WHERE a2.coupon_id = ${coupons.id} LIMIT 1)`,
      discountType: coupons.discountType,
      discountValue: coupons.discountValue,
      maximumDiscount: coupons.maximumDiscount,
      minimumPurchase: coupons.minimumPurchase,
      usageCount: coupons.usageCount,
      usageLimit: coupons.usageLimit,
      isActive: coupons.isActive,
      startsAt: coupons.startsAt,
      expiresAt: coupons.expiresAt,
      discountGiven: sql<string>`coalesce((SELECT sum(${couponUsage.discountAmount}) FROM ${couponUsage} WHERE ${couponUsage.couponId} = ${coupons.id}), 0)::numeric(12,2)::text`,
      totalCount: sql<number>`count(*) OVER ()::int`,
    })
    .from(coupons)
    .leftJoin(sellers, eq(sellers.id, coupons.sellerId))
    .leftJoin(users, eq(users.id, coupons.sellerId))
    .where(where)
    .orderBy(desc(coupons.createdAt), desc(coupons.id))
    .limit(ADMIN_LIST_PAGE_SIZE)
    .offset(offset);

  const scopeOnly = conditions[0]!;
  const [stats] = await q
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) FILTER (WHERE ${STATE_SQL.active})::int`,
      sellers: sql<number>`count(DISTINCT ${coupons.sellerId})::int`,
      redemptions: sql<number>`coalesce(sum(${coupons.usageCount}), 0)::int`,
    })
    .from(coupons)
    .where(scopeOnly);

  return {
    rows: rows.map(({ totalCount: _total, ...row }) => row),
    total: Number(rows[0]?.totalCount ?? 0),
    stats: {
      total: Number(stats?.total ?? 0),
      active: Number(stats?.active ?? 0),
      sellers: Number(stats?.sellers ?? 0),
      redemptions: Number(stats?.redemptions ?? 0),
    },
  };
}

export type AdminCouponRow = Awaited<ReturnType<typeof listCouponsForAdmin>>["rows"][number];

/** Sellers per page in the grouped seller-coupons view. */
export const SELLER_COUPON_GROUPS_PAGE_SIZE = 10;

export interface SellerCouponGroupsInput {
  q: string | null;
  state: AdminCouponState | null;
  page: number;
}

const discountGivenSql = sql<string>`coalesce((SELECT sum(${couponUsage.discountAmount}) FROM ${couponUsage} WHERE ${couponUsage.couponId} = ${coupons.id}), 0)`;

/**
 * Seller coupons grouped by seller: one page of sellers (most active coupons
 * first), each with its totals, its stores and every coupon matching the
 * filters. Four queries whatever the page size.
 */
export async function listSellerCouponGroupsForAdmin(input: SellerCouponGroupsInput, q: Queryable = db) {
  const scope: SQL[] = [isNotNull(coupons.sellerId), sql`NOT ${isAffiliateCoupon}`];
  const conditions: SQL[] = [...scope];
  if (input.state) conditions.push(STATE_SQL[input.state]);
  if (input.q) {
    const like = likePattern(input.q);
    conditions.push(
      or(
        sql`${coupons.code} ILIKE ${like}`,
        sql`${coupons.name} ILIKE ${like}`,
        sql`${sellers.businessName} ILIKE ${like}`,
        sql`${sellers.displayName} ILIKE ${like}`,
        sql`${users.email} ILIKE ${like}`,
      )!,
    );
  }
  const where = and(...conditions);
  const offset = (input.page - 1) * SELLER_COUPON_GROUPS_PAGE_SIZE;
  const activeCount = sql<number>`count(*) FILTER (WHERE ${STATE_SQL.active})::int`;

  const groups = await q
    .select({
      sellerId: sql<string>`${coupons.sellerId}`,
      sellerName: sql<string | null>`max(coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName}))`,
      sellerEmail: sql<string | null>`max(${users.email})`,
      couponCount: sql<number>`count(*)::int`,
      activeCount,
      redemptions: sql<number>`coalesce(sum(${coupons.usageCount}), 0)::int`,
      discountGiven: sql<string>`sum(${discountGivenSql})::numeric(12,2)::text`,
      totalCount: sql<number>`count(*) OVER ()::int`,
    })
    .from(coupons)
    .leftJoin(sellers, eq(sellers.id, coupons.sellerId))
    .leftJoin(users, eq(users.id, coupons.sellerId))
    .where(where)
    .groupBy(coupons.sellerId)
    .orderBy(desc(activeCount), desc(sql`count(*)`), desc(sql`max(${coupons.createdAt})`), asc(coupons.sellerId))
    .limit(SELLER_COUPON_GROUPS_PAGE_SIZE)
    .offset(offset);

  const sellerIds = groups.map((group) => group.sellerId);
  const [couponRows, storeRows] = sellerIds.length
    ? await Promise.all([
        q
          .select({
            id: coupons.id,
            sellerId: sql<string>`${coupons.sellerId}`,
            code: coupons.code,
            name: coupons.name,
            discountType: coupons.discountType,
            discountValue: coupons.discountValue,
            maximumDiscount: coupons.maximumDiscount,
            minimumPurchase: coupons.minimumPurchase,
            usageCount: coupons.usageCount,
            usageLimit: coupons.usageLimit,
            isActive: coupons.isActive,
            startsAt: coupons.startsAt,
            expiresAt: coupons.expiresAt,
            discountGiven: sql<string>`${discountGivenSql}::numeric(12,2)::text`,
          })
          .from(coupons)
          .leftJoin(sellers, eq(sellers.id, coupons.sellerId))
          .leftJoin(users, eq(users.id, coupons.sellerId))
          .where(and(where, inArray(coupons.sellerId, sellerIds)))
          .orderBy(desc(coupons.createdAt), desc(coupons.id)),
        q
          .select({ sellerId: stores.sellerId, id: stores.id, name: stores.name, isPrimary: stores.isPrimary })
          .from(stores)
          .where(and(inArray(stores.sellerId, sellerIds), isNull(stores.deletedAt)))
          .orderBy(desc(stores.isPrimary), asc(stores.name)),
      ])
    : [[], []];

  const [stats] = await q
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) FILTER (WHERE ${STATE_SQL.active})::int`,
      sellers: sql<number>`count(DISTINCT ${coupons.sellerId})::int`,
      redemptions: sql<number>`coalesce(sum(${coupons.usageCount}), 0)::int`,
    })
    .from(coupons)
    .where(and(...scope));

  return {
    groups: groups.map(({ totalCount: _total, ...group }) => ({
      ...group,
      stores: storeRows.filter((store) => store.sellerId === group.sellerId),
      coupons: couponRows.filter((coupon) => coupon.sellerId === group.sellerId),
    })),
    totalSellers: Number(groups[0]?.totalCount ?? 0),
    stats: {
      total: Number(stats?.total ?? 0),
      active: Number(stats?.active ?? 0),
      sellers: Number(stats?.sellers ?? 0),
      redemptions: Number(stats?.redemptions ?? 0),
    },
  };
}

export type SellerCouponGroup = Awaited<ReturnType<typeof listSellerCouponGroupsForAdmin>>["groups"][number];

export type SellerCouponToggleResult = { sellerId: string; auditId: string };

/**
 * Switches one seller coupon off or on (D-A1: no other edits), with the audit
 * row in the same transaction. Platform and affiliate coupons are refused.
 */
export async function setSellerCouponActiveByAdmin(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<{ success: true; data: SellerCouponToggleResult } | { success: false; error: SaasAdminError }> {
  const parsed = sellerCouponToggleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { couponId, active, reason } = parsed.data;

  try {
    const data = await q.transaction(async (tx): Promise<SellerCouponToggleResult | { error: SaasAdminError }> => {
      await assertAdminActor(tx, actorId);
      const [coupon] = await tx
        .select({ id: coupons.id, sellerId: coupons.sellerId, isActive: coupons.isActive, code: coupons.code })
        .from(coupons)
        .where(and(eq(coupons.id, couponId), isNotNull(coupons.sellerId), sql`NOT ${isAffiliateCoupon}`))
        .for("update");
      if (!coupon?.sellerId) return { error: "not_found" };
      if (Boolean(coupon.isActive) === active) return { error: "no_change" };

      await tx.update(coupons).set({ isActive: active, updatedAt: sql`now()` }).where(eq(coupons.id, coupon.id));
      const auditId = await writeAdminAudit(tx, {
        actorId,
        sellerId: coupon.sellerId,
        action: active ? "reactivate_coupon" : "deactivate_coupon",
        before: { couponId: coupon.id, code: coupon.code, isActive: Boolean(coupon.isActive) },
        after: { couponId: coupon.id, code: coupon.code, isActive: active },
        reason,
      });
      return { sellerId: coupon.sellerId, auditId };
    });
    if ("error" in data) return { success: false, error: data.error };
    return { success: true, data };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    throw error;
  }
}
