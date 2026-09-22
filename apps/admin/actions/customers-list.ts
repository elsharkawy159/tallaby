"use server";

import { db } from "@workspace/db";
import { orders, userAddresses, users } from "@workspace/db";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getAdminUser } from "./auth";

const USER_ROLES = [
  "customer",
  "seller",
  "admin",
  "support",
  "driver",
  "marketing",
] as const;

/** Lifetime spend above which a customer counts as "high value" (EGP). */
const HIGH_VALUE_THRESHOLD = 1000;
const NEW_CUSTOMER_DAYS = 30;

export type CustomersView =
  | "all"
  | "high-value"
  | "new"
  | "unverified"
  | "suspended";
export type AdminCustomersSortId =
  | "createdAt"
  | "fullName"
  | "totalOrders"
  | "totalSpent"
  | "lastOrderDate"
  | "lastLoginAt";

export interface AdminCustomersQuery {
  limit?: number;
  offset?: number;
  view?: CustomersView;
  search?: string;
  role?: string[];
  /** "verified" | "unverified" */
  verification?: string[];
  /** "active" | "suspended" */
  accountStatus?: string[];
  /** "registered" | "guest" */
  account?: string[];
  createdFrom?: string;
  createdTo?: string;
  sort?: { id: AdminCustomersSortId; desc: boolean } | null;
}

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

/** One set-based aggregate instead of 2 queries per customer. */
function orderAggregates() {
  return db
    .select({
      userId: orders.userId,
      totalOrders: sql<number>`count(*)::int`.as("total_orders"),
      totalSpent:
        sql<number>`coalesce(sum(${orders.totalAmount}), 0)::float`.as(
          "total_spent"
        ),
      lastOrderDate: sql<string>`max(${orders.createdAt})`.as(
        "last_order_date"
      ),
    })
    .from(orders)
    .groupBy(orders.userId)
    .as("customer_order_agg");
}

/** Server-side filtered, sorted and paginated customers list. */
export async function getAdminCustomers(query: AdminCustomersQuery = {}) {
  try {
    await getAdminUser();

    const limit = Math.min(query.limit || 20, 100);
    const offset = query.offset || 0;
    const agg = orderAggregates();
    const totalOrders = sql<number>`coalesce(${agg.totalOrders}, 0)`;
    const totalSpent = sql<number>`coalesce(${agg.totalSpent}, 0)`;

    const conditions: SQL[] = [];

    switch (query.view) {
      case "high-value":
        conditions.push(sql`${totalSpent} > ${HIGH_VALUE_THRESHOLD}`);
        break;
      case "new":
        conditions.push(gte(users.createdAt, daysAgoIso(NEW_CUSTOMER_DAYS)));
        break;
      case "unverified":
        conditions.push(sql`coalesce(${users.isVerified}, false) = false`);
        break;
      case "suspended":
        conditions.push(eq(users.isSuspended, true));
        break;
    }

    const roles = (query.role ?? []).filter((role) =>
      (USER_ROLES as readonly string[]).includes(role)
    ) as (typeof USER_ROLES)[number][];
    if (roles.length) conditions.push(inArray(users.role, roles));

    const verification = new Set(query.verification ?? []);
    if (verification.size === 1) {
      conditions.push(
        verification.has("verified")
          ? eq(users.isVerified, true)
          : sql`coalesce(${users.isVerified}, false) = false`
      );
    }

    const accountStatus = new Set(query.accountStatus ?? []);
    if (accountStatus.size === 1) {
      conditions.push(
        accountStatus.has("suspended")
          ? eq(users.isSuspended, true)
          : sql`coalesce(${users.isSuspended}, false) = false`
      );
    }

    const account = new Set(query.account ?? []);
    if (account.size === 1) {
      conditions.push(eq(users.isGuest, account.has("guest")));
    }

    if (query.createdFrom) {
      conditions.push(gte(users.createdAt, query.createdFrom));
    }
    if (query.createdTo) conditions.push(lt(users.createdAt, query.createdTo));

    const search = query.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(users.fullName, pattern),
          ilike(users.email, pattern),
          ilike(users.phone, pattern),
          sql`${users.id}::text = ${search}`
        )!
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;
    const sortColumn = {
      createdAt: users.createdAt,
      fullName: users.fullName,
      totalOrders,
      totalSpent,
      lastOrderDate: agg.lastOrderDate,
      lastLoginAt: users.lastLoginAt,
    }[query.sort?.id ?? "createdAt"];
    const direction = query.sort?.desc === false ? asc : desc;

    const rows = await db
      .select({
        user: users,
        totalOrders,
        totalSpent,
        lastOrderDate: agg.lastOrderDate,
      })
      .from(users)
      .leftJoin(agg, eq(agg.userId, users.id))
      .where(where)
      .orderBy(sql`${direction(sortColumn)} nulls last`, desc(users.id))
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .leftJoin(agg, eq(agg.userId, users.id))
      .where(where);

    // Addresses for this page only (display phone fallback + quick view).
    const ids = rows.map((row) => row.user.id);
    const addresses = ids.length
      ? await db
          .select()
          .from(userAddresses)
          .where(inArray(userAddresses.userId, ids))
          .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt))
      : [];
    const addressesByUser = new Map<string, typeof addresses>();
    for (const address of addresses) {
      const list = addressesByUser.get(address.userId) ?? [];
      list.push(address);
      addressesByUser.set(address.userId, list);
    }

    return {
      success: true as const,
      data: rows.map((row) => ({
        ...row.user,
        totalOrders: Number(row.totalOrders ?? 0),
        totalSpent: Number(row.totalSpent ?? 0),
        lastOrderDate: row.lastOrderDate ?? null,
        addresses: addressesByUser.get(row.user.id) ?? [],
      })),
      totalCount: Number(countRow?.count ?? 0),
    };
  } catch (error) {
    console.error("Error fetching admin customers:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/** Page-independent KPIs for the customers header cards and tab counts. */
export async function getCustomerListStats() {
  try {
    await getAdminUser();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const result = await db.execute(sql`
      with spend as (
        select ${orders.userId} as user_id,
               count(*)::int as order_count,
               coalesce(sum(${orders.totalAmount}), 0)::float as spent
        from ${orders}
        group by ${orders.userId}
      )
      select
        (select count(*)::int from ${users}) as total,
        (select count(*)::int from ${users} where ${users.isVerified} = true) as verified,
        (select count(*)::int from ${users} where coalesce(${users.isVerified}, false) = false) as unverified,
        (select count(*)::int from ${users} where ${users.isSuspended} = true) as suspended,
        (select count(*)::int from ${users} where ${users.createdAt} >= ${monthStart.toISOString()}) as new_this_month,
        (select count(*)::int from ${users} where ${users.createdAt} >= ${daysAgoIso(NEW_CUSTOMER_DAYS)}) as new_recent,
        (select count(*)::int from spend where spent > ${HIGH_VALUE_THRESHOLD}) as high_value,
        (select coalesce(sum(spent), 0)::float from spend) as revenue,
        (select coalesce(sum(order_count), 0)::int from spend) as order_count,
        (select count(*)::int from spend) as buyers
    `);

    const rows = Array.isArray(result)
      ? result
      : ((result as { rows?: Array<Record<string, unknown>> }).rows ?? []);
    const row = (rows[0] ?? {}) as Record<string, unknown>;
    const revenue = Number(row.revenue ?? 0);
    const orderCount = Number(row.order_count ?? 0);
    const buyers = Number(row.buyers ?? 0);

    return {
      success: true as const,
      data: {
        totalCustomers: Number(row.total ?? 0),
        verifiedCustomers: Number(row.verified ?? 0),
        unverifiedCustomers: Number(row.unverified ?? 0),
        suspendedCustomers: Number(row.suspended ?? 0),
        newCustomersThisMonth: Number(row.new_this_month ?? 0),
        newCustomersRecent: Number(row.new_recent ?? 0),
        highValueCustomers: Number(row.high_value ?? 0),
        totalRevenue: revenue,
        averageSpendPerCustomer: buyers > 0 ? revenue / buyers : 0,
        averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
