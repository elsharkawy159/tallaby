"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  affiliateCommissions,
  affiliates,
  and,
  coupons,
  count,
  db,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  orders,
  sql,
  userWallets,
  userWalletTransactions,
  users,
} from "@workspace/db";
import { AFFILIATE_COMMISSION_RATE } from "@workspace/db/affiliates";

import { getAdminUser } from "./auth";

/**
 * Admin affiliate program administration.
 *
 * Read-side queries live here (not in @workspace/db/affiliates) because they
 * are admin-only aggregations across every affiliate/order, following the
 * same split wallets.server.ts uses: mutation primitives are shared package
 * code, list/detail reads are ad hoc drizzle queries scoped to this app.
 *
 * Every list/aggregate query below is a single grouped SQL statement — never
 * "fetch affiliates, then loop and query per affiliate" — so the page cost
 * stays flat regardless of how many affiliates or orders exist.
 *
 * The only mutation here (setAffiliateStatus) never deletes or rewrites a
 * commission row; it flips two booleans (affiliates.status, coupons.isActive)
 * so historical orders/commissions stay exactly as they were earned.
 */

const LIST_ROW_LIMIT = 200;
const ORDERS_PAGE_SIZE = 20;
const LEDGER_PAGE_SIZE = 20;

export type AdminAffiliateResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function failure(error: string): AdminAffiliateResult<never> {
  return { success: false, error };
}

function handleError(scope: string, error: unknown): AdminAffiliateResult<never> {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message === "User not authenticated" ||
    message === "Insufficient permissions" ||
    message === "Account not verified" ||
    message === "User profile not found"
  ) {
    return failure("Unauthorized");
  }

  console.error(`${scope} error:`, error);
  return failure(`Failed to ${scope}`);
}

/* -------------------------------------------------------------------------- */
/* Top summary metrics                                                        */
/* -------------------------------------------------------------------------- */

export interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalReferredOrders: number;
  deliveredOrders: number;
  pendingProfit: string;
  totalProfit: string;
  totalWalletBalance: string;
  customerSavings: string;
}

export async function getAffiliateStats(): Promise<
  AdminAffiliateResult<AffiliateStats>
> {
  try {
    await getAdminUser();

    const [accountTotals] = await db
      .select({
        totalAffiliates: count(affiliates.id),
        activeAffiliates: sql<string>`count(*) filter (where ${affiliates.status} = 'active' and ${coupons.isActive} = true)`,
      })
      .from(affiliates)
      .innerJoin(coupons, eq(coupons.id, affiliates.couponId));

    const [commissionTotals] = await db
      .select({
        totalReferredOrders: sql<string>`count(*) filter (where ${affiliateCommissions.type} = 'commission')`,
        deliveredOrders: sql<string>`count(*) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} in ('earned', 'reversed'))`,
        pendingProfit: sql<string>`coalesce(sum(${affiliateCommissions.commissionAmount}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} = 'pending'), 0)`,
        totalProfit: sql<string>`coalesce(sum(${affiliateCommissions.commissionAmount}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} = 'earned'), 0)`,
      })
      .from(affiliateCommissions);

    const [walletTotals] = await db
      .select({
        totalWalletBalance: sql<string>`coalesce(sum(${userWallets.balance}), 0)`,
      })
      .from(affiliates)
      .innerJoin(userWallets, eq(userWallets.userId, affiliates.userId));

    const [savingsTotals] = await db
      .select({
        customerSavings: sql<string>`coalesce(sum(${orders.discountAmount}), 0)`,
      })
      .from(affiliateCommissions)
      .innerJoin(orders, eq(orders.id, affiliateCommissions.orderId))
      .where(eq(affiliateCommissions.type, "commission"));

    return {
      success: true,
      data: {
        totalAffiliates: Number(accountTotals?.totalAffiliates ?? 0),
        activeAffiliates: Number(accountTotals?.activeAffiliates ?? 0),
        totalReferredOrders: Number(commissionTotals?.totalReferredOrders ?? 0),
        deliveredOrders: Number(commissionTotals?.deliveredOrders ?? 0),
        pendingProfit: commissionTotals?.pendingProfit ?? "0",
        totalProfit: commissionTotals?.totalProfit ?? "0",
        totalWalletBalance: walletTotals?.totalWalletBalance ?? "0",
        customerSavings: savingsTotals?.customerSavings ?? "0",
      },
    };
  } catch (error) {
    return handleError("load affiliate stats", error);
  }
}

/* -------------------------------------------------------------------------- */
/* Affiliate list                                                             */
/* -------------------------------------------------------------------------- */

const affiliateFiltersSchema = z.object({
  status: z.enum(["active", "inactive"]).optional(),
  performance: z.enum(["has_orders", "no_orders", "has_delivered"]).optional(),
  earnings: z.enum(["has_pending", "has_earned"]).optional(),
  search: z.string().trim().max(120).optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
});

export type AffiliateFilters = z.infer<typeof affiliateFiltersSchema>;

export interface AffiliateListRow {
  affiliateId: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  code: string;
  couponActive: boolean | null;
  status: "active" | "inactive";
  createdAt: string;
  totalOrders: number;
  deliveredOrders: number;
  pendingProfit: string;
  totalProfit: string;
  walletBalance: string;
}

export interface AffiliateListResult {
  rows: AffiliateListRow[];
  /** True when the row cap was hit — filters should be narrowed rather than assuming this is everything. */
  truncated: boolean;
}

export async function getAffiliates(
  filters: AffiliateFilters = {}
): Promise<AdminAffiliateResult<AffiliateListResult>> {
  try {
    await getAdminUser();

    const parsed = affiliateFiltersSchema.safeParse(filters);
    if (!parsed.success) return failure("Invalid filters");
    const f = parsed.data;

    const conditions = [];
    if (f.status) conditions.push(eq(affiliates.status, f.status));
    if (f.createdFrom) conditions.push(gte(affiliates.createdAt, f.createdFrom));
    if (f.createdTo) conditions.push(lte(affiliates.createdAt, f.createdTo));
    if (f.search) {
      const term = `%${f.search}%`;
      conditions.push(
        or(
          ilike(users.fullName, term),
          ilike(users.email, term),
          ilike(coupons.code, term)
        )
      );
    }

    const havingConditions = [];
    if (f.performance === "has_orders") {
      havingConditions.push(
        sql`count(${affiliateCommissions.id}) filter (where ${affiliateCommissions.type} = 'commission') > 0`
      );
    } else if (f.performance === "no_orders") {
      havingConditions.push(
        sql`count(${affiliateCommissions.id}) filter (where ${affiliateCommissions.type} = 'commission') = 0`
      );
    } else if (f.performance === "has_delivered") {
      havingConditions.push(
        sql`count(${affiliateCommissions.id}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} in ('earned', 'reversed')) > 0`
      );
    }
    if (f.earnings === "has_pending") {
      havingConditions.push(
        sql`coalesce(sum(${affiliateCommissions.commissionAmount}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} = 'pending'), 0) > 0`
      );
    } else if (f.earnings === "has_earned") {
      havingConditions.push(
        sql`coalesce(sum(${affiliateCommissions.commissionAmount}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} = 'earned'), 0) > 0`
      );
    }

    const rows = await db
      .select({
        affiliateId: affiliates.id,
        userId: affiliates.userId,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        code: coupons.code,
        couponActive: coupons.isActive,
        status: affiliates.status,
        createdAt: affiliates.createdAt,
        walletBalance: sql<string>`coalesce(${userWallets.balance}, 0)`,
        totalOrders: sql<string>`count(${affiliateCommissions.id}) filter (where ${affiliateCommissions.type} = 'commission')`,
        deliveredOrders: sql<string>`count(${affiliateCommissions.id}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} in ('earned', 'reversed'))`,
        pendingProfit: sql<string>`coalesce(sum(${affiliateCommissions.commissionAmount}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} = 'pending'), 0)`,
        totalProfit: sql<string>`coalesce(sum(${affiliateCommissions.commissionAmount}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} = 'earned'), 0)`,
      })
      .from(affiliates)
      .innerJoin(users, eq(users.id, affiliates.userId))
      .innerJoin(coupons, eq(coupons.id, affiliates.couponId))
      .leftJoin(userWallets, eq(userWallets.userId, affiliates.userId))
      .leftJoin(
        affiliateCommissions,
        eq(affiliateCommissions.affiliateId, affiliates.id)
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(affiliates.id, users.id, coupons.id, userWallets.id)
      .having(havingConditions.length > 0 ? and(...havingConditions) : undefined)
      .orderBy(desc(affiliates.createdAt))
      .limit(LIST_ROW_LIMIT + 1);

    const truncated = rows.length > LIST_ROW_LIMIT;
    const page = truncated ? rows.slice(0, LIST_ROW_LIMIT) : rows;

    return {
      success: true,
      data: {
        rows: page.map((row) => ({
          ...row,
          totalOrders: Number(row.totalOrders),
          deliveredOrders: Number(row.deliveredOrders),
        })) as AffiliateListRow[],
        truncated,
      },
    };
  } catch (error) {
    return handleError("load affiliates", error);
  }
}

/* -------------------------------------------------------------------------- */
/* Affiliate detail                                                           */
/* -------------------------------------------------------------------------- */

export interface AffiliateDetail {
  affiliateId: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  status: "active" | "inactive";
  createdAt: string;
  code: string;
  couponId: string;
  discountPercent: string;
  isOneTimeUse: boolean;
  couponActive: boolean;
  couponCreatedAt: string | null;
  commissionRate: number;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  pendingProfit: string;
  totalProfit: string;
  reversedProfit: string;
  customerSavings: string;
  conversionRate: number | null;
  wallet: {
    balance: string;
    reservedBalance: string;
    totalWithdrawn: string;
  } | null;
}

export async function getAffiliateDetail(
  affiliateId: string
): Promise<AdminAffiliateResult<AffiliateDetail>> {
  try {
    await getAdminUser();

    if (!z.string().uuid().safeParse(affiliateId).success) {
      return failure("Invalid affiliate id");
    }

    const [row] = await db
      .select({
        affiliateId: affiliates.id,
        userId: affiliates.userId,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: affiliates.status,
        createdAt: affiliates.createdAt,
        couponId: coupons.id,
        code: coupons.code,
        discountPercent: coupons.discountValue,
        isOneTimeUse: coupons.isOneTimeUse,
        couponActive: coupons.isActive,
        couponCreatedAt: coupons.createdAt,
        walletBalance: userWallets.balance,
        walletReserved: userWallets.reservedBalance,
        totalOrders: sql<string>`count(${affiliateCommissions.id}) filter (where ${affiliateCommissions.type} = 'commission')`,
        deliveredOrders: sql<string>`count(${affiliateCommissions.id}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} in ('earned', 'reversed'))`,
        pendingOrders: sql<string>`count(${affiliateCommissions.id}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} = 'pending')`,
        pendingProfit: sql<string>`coalesce(sum(${affiliateCommissions.commissionAmount}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} = 'pending'), 0)`,
        totalProfit: sql<string>`coalesce(sum(${affiliateCommissions.commissionAmount}) filter (where ${affiliateCommissions.type} = 'commission' and ${affiliateCommissions.status} = 'earned'), 0)`,
        reversedProfit: sql<string>`coalesce(sum(${affiliateCommissions.commissionAmount}) filter (where ${affiliateCommissions.type} = 'reversal'), 0)`,
        customerSavings: sql<string>`coalesce(sum(${orders.discountAmount}) filter (where ${affiliateCommissions.type} = 'commission'), 0)`,
      })
      .from(affiliates)
      .innerJoin(users, eq(users.id, affiliates.userId))
      .innerJoin(coupons, eq(coupons.id, affiliates.couponId))
      .leftJoin(userWallets, eq(userWallets.userId, affiliates.userId))
      .leftJoin(
        affiliateCommissions,
        eq(affiliateCommissions.affiliateId, affiliates.id)
      )
      .leftJoin(orders, eq(orders.id, affiliateCommissions.orderId))
      .where(eq(affiliates.id, affiliateId))
      .groupBy(affiliates.id, users.id, coupons.id, userWallets.id);

    if (!row) return failure("Affiliate not found");

    let totalWithdrawn = "0";
    if (row.userId) {
      const [payoutTotals] = await db
        .select({
          totalWithdrawn: sql<string>`coalesce(sum(-${userWalletTransactions.amount}), 0)`,
        })
        .from(userWalletTransactions)
        .where(
          and(
            eq(userWalletTransactions.userId, row.userId),
            eq(userWalletTransactions.type, "payout"),
            eq(userWalletTransactions.status, "completed")
          )
        );
      totalWithdrawn = payoutTotals?.totalWithdrawn ?? "0";
    }

    const totalOrders = Number(row.totalOrders);
    const deliveredOrders = Number(row.deliveredOrders);

    return {
      success: true,
      data: {
        affiliateId: row.affiliateId,
        userId: row.userId,
        fullName: row.fullName,
        email: row.email,
        avatarUrl: row.avatarUrl,
        status: row.status,
        createdAt: row.createdAt,
        code: row.code,
        couponId: row.couponId,
        discountPercent: row.discountPercent,
        isOneTimeUse: Boolean(row.isOneTimeUse),
        couponActive: Boolean(row.couponActive),
        couponCreatedAt: row.couponCreatedAt,
        commissionRate: AFFILIATE_COMMISSION_RATE,
        totalOrders,
        deliveredOrders,
        pendingOrders: Number(row.pendingOrders),
        pendingProfit: row.pendingProfit,
        totalProfit: row.totalProfit,
        reversedProfit: row.reversedProfit,
        customerSavings: row.customerSavings,
        conversionRate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : null,
        wallet: row.walletBalance
          ? {
              balance: row.walletBalance,
              reservedBalance: row.walletReserved ?? "0",
              totalWithdrawn,
            }
          : null,
      },
    };
  } catch (error) {
    return handleError("load affiliate", error);
  }
}

/* -------------------------------------------------------------------------- */
/* Referred order history (paginated)                                        */
/* -------------------------------------------------------------------------- */

export interface AffiliateOrderRow {
  commissionId: string;
  orderId: string;
  orderNumber: string;
  orderDate: string | null;
  orderTotalAmount: string;
  shippingAmount: string;
  eligibleAmount: string;
  discountAmount: string;
  commissionAmount: string;
  orderStatus: string;
  commissionStatus: "pending" | "earned" | "reversed" | "cancelled";
}

export async function getAffiliateOrderHistory(
  affiliateId: string,
  params: { limit?: number; offset?: number } = {}
): Promise<AdminAffiliateResult<{ rows: AffiliateOrderRow[]; total: number }>> {
  try {
    await getAdminUser();

    if (!z.string().uuid().safeParse(affiliateId).success) {
      return failure("Invalid affiliate id");
    }

    const limit = params.limit ?? ORDERS_PAGE_SIZE;
    const offset = params.offset ?? 0;

    const where = and(
      eq(affiliateCommissions.affiliateId, affiliateId),
      eq(affiliateCommissions.type, "commission")
    );

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          commissionId: affiliateCommissions.id,
          orderId: affiliateCommissions.orderId,
          orderNumber: orders.orderNumber,
          orderDate: orders.createdAt,
          orderTotalAmount: orders.totalAmount,
          shippingAmount: affiliateCommissions.shippingAmount,
          eligibleAmount: affiliateCommissions.orderEligibleAmount,
          discountAmount: orders.discountAmount,
          commissionAmount: affiliateCommissions.commissionAmount,
          orderStatus: orders.status,
          commissionStatus: affiliateCommissions.status,
        })
        .from(affiliateCommissions)
        .innerJoin(orders, eq(orders.id, affiliateCommissions.orderId))
        .where(where)
        .orderBy(desc(affiliateCommissions.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(affiliateCommissions).where(where),
    ]);

    return {
      success: true,
      data: {
        rows: rows.map((row) => ({
          ...row,
          discountAmount: row.discountAmount ?? "0",
        })) as AffiliateOrderRow[],
        total: Number(total),
      },
    };
  } catch (error) {
    return handleError("load affiliate orders", error);
  }
}

/* -------------------------------------------------------------------------- */
/* Commission ledger (paginated, append-only source of truth)                */
/* -------------------------------------------------------------------------- */

export interface AffiliateLedgerRow {
  id: string;
  type: "commission" | "reversal";
  status: "pending" | "earned" | "reversed" | "cancelled";
  commissionAmount: string;
  orderId: string;
  orderNumber: string;
  createdAt: string;
}

export async function getAffiliateLedger(
  affiliateId: string,
  params: { limit?: number; offset?: number } = {}
): Promise<AdminAffiliateResult<{ rows: AffiliateLedgerRow[]; total: number }>> {
  try {
    await getAdminUser();

    if (!z.string().uuid().safeParse(affiliateId).success) {
      return failure("Invalid affiliate id");
    }

    const limit = params.limit ?? LEDGER_PAGE_SIZE;
    const offset = params.offset ?? 0;
    const where = eq(affiliateCommissions.affiliateId, affiliateId);

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: affiliateCommissions.id,
          type: affiliateCommissions.type,
          status: affiliateCommissions.status,
          commissionAmount: affiliateCommissions.commissionAmount,
          orderId: affiliateCommissions.orderId,
          orderNumber: orders.orderNumber,
          createdAt: affiliateCommissions.createdAt,
        })
        .from(affiliateCommissions)
        .innerJoin(orders, eq(orders.id, affiliateCommissions.orderId))
        .where(where)
        .orderBy(desc(affiliateCommissions.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(affiliateCommissions).where(where),
    ]);

    return {
      success: true,
      data: { rows: rows as AffiliateLedgerRow[], total: Number(total) },
    };
  } catch (error) {
    return handleError("load commission ledger", error);
  }
}

/* -------------------------------------------------------------------------- */
/* Enable / disable                                                           */
/* -------------------------------------------------------------------------- */

const setStatusSchema = z.object({
  affiliateId: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
});

/**
 * Flips the affiliate's status and, in the same transaction, the underlying
 * coupon's isActive flag — so "disable" actually stops the code from being
 * redeemed at all, not just stops it from earning commission. Never touches
 * affiliate_commissions: every historical row (earned, pending, reversed)
 * survives untouched.
 */
export async function setAffiliateStatus(input: {
  affiliateId: string;
  status: "active" | "inactive";
}): Promise<AdminAffiliateResult<undefined>> {
  try {
    await getAdminUser();

    const parsed = setStatusSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid request");

    const updated = await db.transaction(async (tx) => {
      const [affiliate] = await tx
        .update(affiliates)
        .set({ status: parsed.data.status, updatedAt: new Date().toISOString() })
        .where(eq(affiliates.id, parsed.data.affiliateId))
        .returning({ couponId: affiliates.couponId });

      if (!affiliate) return false;

      await tx
        .update(coupons)
        .set({
          isActive: parsed.data.status === "active",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(coupons.id, affiliate.couponId));

      return true;
    });

    if (!updated) return failure("Affiliate not found");

    revalidatePath("/affiliate");
    revalidatePath(`/affiliate/${parsed.data.affiliateId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError("update affiliate status", error);
  }
}
