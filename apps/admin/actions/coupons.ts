"use server";

import { z } from "zod";
import { db } from "@workspace/db";
import { affiliates, coupons, couponUsage } from "@workspace/db";
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { applyInvalidation, invalidatePlatformCoupons } from "@workspace/cache";
import { getAdminUser } from "./auth";
import {
  COUPON_DISCOUNT_TYPES,
  couponInputSchema,
  type CouponInput,
} from "@/app/(dashboard)/_lib/validations/coupon-schema";

export type AdminCouponsSortId =
  | "createdAt"
  | "code"
  | "discountValue"
  | "usageCount"
  | "expiresAt";

export type CouponState = "active" | "scheduled" | "expired" | "inactive";

export interface AdminCouponsQuery {
  limit?: number;
  offset?: number;
  search?: string;
  /** CouponState values. */
  state?: string[];
  /** Discount types. */
  type?: string[];
  sort?: { id: AdminCouponsSortId; desc: boolean } | null;
}

/**
 * Coupons this page manages: platform-wide (no seller) and not an affiliate's
 * personal coupon — those belong to the seller dashboard and the affiliates
 * page respectively, and must never be edited from here.
 */
const isPlatformCoupon = and(
  isNull(coupons.sellerId),
  sql`not exists (select 1 from ${affiliates} where ${affiliates.couponId} = ${coupons.id})`
)!;

const STATE_CONDITIONS: Record<CouponState, SQL> = {
  inactive: sql`coalesce(${coupons.isActive}, false) = false`,
  expired: sql`coalesce(${coupons.isActive}, false) = true and ${coupons.expiresAt} < now()`,
  scheduled: sql`coalesce(${coupons.isActive}, false) = true and ${coupons.startsAt} > now()`,
  active: sql`coalesce(${coupons.isActive}, false) = true and ${coupons.startsAt} <= now() and ${coupons.expiresAt} >= now()`,
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function isUniqueViolation(error: unknown): boolean {
  const codes = [
    (error as { code?: string })?.code,
    (error as { cause?: { code?: string } })?.cause?.code,
  ];
  return codes.includes("23505");
}

function failure(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    return {
      success: false as const,
      error: issue ? `${issue.path.join(".") || "input"}: ${issue.message}` : fallback,
    };
  }
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback,
  };
}

async function invalidate() {
  await applyInvalidation(invalidatePlatformCoupons(), {
    from: "admin",
    mode: "action",
  });
}

/** Server-side filtered, sorted and paginated platform coupons + page-independent stats. */
export async function getAdminCoupons(query: AdminCouponsQuery = {}) {
  try {
    await getAdminUser();

    const limit = Math.min(query.limit || 20, 100);
    const offset = query.offset || 0;
    const conditions: SQL[] = [isPlatformCoupon];

    const states = (query.state ?? [])
      .map((state) => STATE_CONDITIONS[state as CouponState])
      .filter(Boolean);
    if (states.length) conditions.push(or(...states)!);

    const types = (query.type ?? []).filter((type) =>
      (COUPON_DISCOUNT_TYPES as readonly string[]).includes(type)
    ) as (typeof COUPON_DISCOUNT_TYPES)[number][];
    if (types.length) conditions.push(inArray(coupons.discountType, types));

    const search = query.search?.trim();
    if (search) {
      const pattern = `%${escapeLike(search)}%`;
      conditions.push(or(ilike(coupons.code, pattern), ilike(coupons.name, pattern))!);
    }

    const where = and(...conditions);
    const sortColumn = {
      createdAt: coupons.createdAt,
      code: coupons.code,
      discountValue: coupons.discountValue,
      usageCount: coupons.usageCount,
      expiresAt: coupons.expiresAt,
    }[query.sort?.id ?? "createdAt"];
    const direction = query.sort?.desc === false ? asc : desc;

    // Sequential (not Promise.all) to stay within the serverless pool.
    const rows = await db
      .select()
      .from(coupons)
      .where(where)
      .orderBy(sql`${direction(sortColumn)} nulls last`, desc(coupons.id))
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(coupons)
      .where(where);

    const [statsRow] = await db
      .select({
        active: sql<number>`count(*) filter (where ${STATE_CONDITIONS.active})::int`,
        scheduled: sql<number>`count(*) filter (where ${STATE_CONDITIONS.scheduled})::int`,
        expired: sql<number>`count(*) filter (where ${STATE_CONDITIONS.expired})::int`,
        redemptions: sql<number>`coalesce(sum(${coupons.usageCount}), 0)::int`,
      })
      .from(coupons)
      .where(isPlatformCoupon);

    return {
      success: true as const,
      data: rows,
      totalCount: Number(countRow?.count ?? 0),
      stats: {
        active: Number(statsRow?.active ?? 0),
        scheduled: Number(statsRow?.scheduled ?? 0),
        expired: Number(statsRow?.expired ?? 0),
        redemptions: Number(statsRow?.redemptions ?? 0),
      },
    };
  } catch (error) {
    console.error("Error fetching admin coupons:", error);
    return failure(error, "Failed to load coupons");
  }
}

function toRow(input: CouponInput) {
  const parsed = couponInputSchema.parse(input);
  return {
    code: parsed.code,
    name: parsed.name,
    description: parsed.description,
    discountType: parsed.discountType,
    discountValue: String(parsed.discountValue),
    minimumPurchase: parsed.minimumPurchase === null ? null : String(parsed.minimumPurchase),
    maximumDiscount: parsed.maximumDiscount === null ? null : String(parsed.maximumDiscount),
    usageLimit: parsed.usageLimit,
    perUserLimit: parsed.perUserLimit,
    isOneTimeUse: parsed.isOneTimeUse,
    isActive: parsed.isActive,
    startsAt: parsed.startsAt,
    expiresAt: parsed.expiresAt,
    // Platform-wide: no seller and no product/category rules -> every product.
    sellerId: null,
    applicableTo: null,
    excludeItems: null,
  };
}

export async function createCoupon(input: CouponInput) {
  try {
    await getAdminUser();
    const [row] = await db
      .insert(coupons)
      .values(toRow(input))
      .returning({ id: coupons.id });
    await invalidate();
    return { success: true as const, data: row };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false as const, error: "A coupon with this code already exists" };
    }
    console.error("Error creating coupon:", error);
    return failure(error, "Failed to create coupon");
  }
}

export async function updateCoupon(couponId: string, input: CouponInput) {
  try {
    await getAdminUser();
    const [row] = await db
      .update(coupons)
      .set({ ...toRow(input), updatedAt: new Date().toISOString() })
      .where(and(eq(coupons.id, couponId), isPlatformCoupon))
      .returning({ id: coupons.id });
    if (!row) return { success: false as const, error: "Coupon not found" };
    await invalidate();
    return { success: true as const, data: row };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false as const, error: "A coupon with this code already exists" };
    }
    console.error("Error updating coupon:", error);
    return failure(error, "Failed to update coupon");
  }
}

export async function setCouponActive(couponId: string, isActive: boolean) {
  try {
    await getAdminUser();
    const [row] = await db
      .update(coupons)
      .set({ isActive, updatedAt: new Date().toISOString() })
      .where(and(eq(coupons.id, couponId), isPlatformCoupon))
      .returning({ id: coupons.id });
    if (!row) return { success: false as const, error: "Coupon not found" };
    await invalidate();
    return { success: true as const, data: row };
  } catch (error) {
    console.error("Error updating coupon status:", error);
    return failure(error, "Failed to update coupon status");
  }
}

export async function deleteCoupon(couponId: string) {
  try {
    await getAdminUser();

    // Redeemed coupons are referenced by order history; keep them.
    const [usage] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(couponUsage)
      .where(eq(couponUsage.couponId, couponId));
    if (Number(usage?.count ?? 0) > 0) {
      return {
        success: false as const,
        error: "This coupon has been used on orders. Deactivate it instead.",
      };
    }

    const [row] = await db
      .delete(coupons)
      .where(and(eq(coupons.id, couponId), isPlatformCoupon))
      .returning({ id: coupons.id });
    if (!row) return { success: false as const, error: "Coupon not found" };
    await invalidate();
    return { success: true as const, data: row };
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return failure(error, "Failed to delete coupon");
  }
}
