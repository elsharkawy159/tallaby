"use server";

import { db } from "@workspace/db";
import { orderItems, orders, stores, users } from "@workspace/db";
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

const ORDER_STATUSES = [
  "pending",
  "payment_processing",
  "confirmed",
  "shipping_soon",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund_requested",
  "refunded",
  "returned",
] as const;

const PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
  "collected",
] as const;

const ORDER_SOURCES = ["website", "external", "storefront"] as const;

export type AdminOrdersSortId = "createdAt" | "totalAmount" | "orderNumber";

export interface AdminOrdersQuery {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string[];
  paymentStatus?: string[];
  paymentMethod?: string[];
  source?: string[];
  createdFrom?: string;
  createdTo?: string;
  sort?: { id: AdminOrdersSortId; desc: boolean } | null;
  /** Relation filters from entity pages: only valid UUIDs are applied. */
  sellerId?: string;
  storeId?: string;
  customerId?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function allowed<T extends string>(values: string[] | undefined, list: readonly T[]) {
  return (values ?? []).filter((value): value is T =>
    (list as readonly string[]).includes(value)
  );
}

/** Server-side filtered, sorted and paginated orders list. */
export async function getAdminOrders(query: AdminOrdersQuery = {}) {
  try {
    await getAdminUser();

    const limit = Math.min(query.limit || 20, 100);
    const offset = query.offset || 0;
    const conditions: SQL[] = [];

    const statuses = allowed(query.status, ORDER_STATUSES);
    if (statuses.length) conditions.push(inArray(orders.status, statuses));

    const paymentStatuses = allowed(query.paymentStatus, PAYMENT_STATUSES);
    if (paymentStatuses.length) {
      conditions.push(inArray(orders.paymentStatus, paymentStatuses));
    }

    if (query.paymentMethod?.length) {
      conditions.push(inArray(orders.paymentMethod, query.paymentMethod));
    }

    const sources = allowed(query.source, ORDER_SOURCES);
    if (sources.length) conditions.push(inArray(orders.orderSource, sources));

    if (query.createdFrom) {
      conditions.push(gte(orders.createdAt, query.createdFrom));
    }
    if (query.createdTo) conditions.push(lt(orders.createdAt, query.createdTo));

    // Orders have no seller column: a seller is on the order when one of its lines is theirs.
    if (query.sellerId && UUID_RE.test(query.sellerId)) {
      conditions.push(
        sql`exists (select 1 from ${orderItems} where ${orderItems.orderId} = ${orders.id} and ${orderItems.sellerId} = ${query.sellerId})`
      );
    }
    if (query.storeId && UUID_RE.test(query.storeId)) conditions.push(eq(orders.storeId, query.storeId));
    if (query.customerId && UUID_RE.test(query.customerId)) conditions.push(eq(orders.userId, query.customerId));

    const search = query.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(orders.orderNumber, pattern),
          sql`${orders.id}::text = ${search}`,
          ilike(users.fullName, pattern),
          ilike(users.email, pattern),
          ilike(users.phone, pattern)
        )!
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;
    const sortColumn = {
      createdAt: orders.createdAt,
      totalAmount: orders.totalAmount,
      orderNumber: orders.orderNumber,
    }[query.sort?.id ?? "createdAt"];
    const direction = query.sort?.desc === false ? asc : desc;

    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        orderSource: orders.orderSource,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        itemsCount: sql<number>`(
          select coalesce(sum(${orderItems.quantity}), 0)::int
          from ${orderItems} where ${orderItems.orderId} = ${orders.id}
        )`,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
        },
        store: { id: stores.id, name: stores.name },
      })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.userId))
      .leftJoin(stores, eq(stores.id, orders.storeId))
      .where(where)
      .orderBy(sql`${direction(sortColumn)} nulls last`, desc(orders.id))
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.userId))
      .where(where);

    return {
      success: true as const,
      data: rows.map((row) => ({
        ...row,
        totalAmount: Number(row.totalAmount ?? 0),
        itemsCount: Number(row.itemsCount ?? 0),
        user: row.user?.id ? row.user : undefined,
        store: row.store?.id ? row.store : undefined,
      })),
      totalCount: Number(countRow?.count ?? 0),
    };
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/** Distinct payment methods in use, for the filter dropdown. */
export async function getOrderPaymentMethods() {
  try {
    await getAdminUser();
    const rows = await db
      .selectDistinct({ method: orders.paymentMethod })
      .from(orders)
      .orderBy(asc(orders.paymentMethod));
    return { success: true as const, data: rows.map((row) => row.method) };
  } catch (error) {
    console.error("Error fetching order payment methods:", error);
    return { success: false as const, data: [] as string[] };
  }
}
