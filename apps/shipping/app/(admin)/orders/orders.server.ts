"use server";

import { revalidatePath } from "next/cache";
import { alias } from "drizzle-orm/pg-core";
import {
  db,
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql,
  orders,
  payments,
  shipments,
  shippingProviders,
  userAddresses,
  users,
} from "@workspace/db";

import {
  actionError,
  type ActionResult,
  type ListResult,
  type PaginatedResult,
} from "@/lib/action-result";
import { applyShipmentStatus } from "@/lib/apply-shipment-status";
import { requireShippingAdmin } from "@/lib/auth";
import { canTransition, type ShippingStatus } from "@/lib/shipping-status";
import { getProviderAdapter } from "@/providers";
import {
  assignProviderSchema,
  assignRiderSchema,
  updateStatusSchema,
  type ShippingFilters,
} from "./orders.dto";
import type {
  OrderDetail,
  ProviderOption,
  RiderOption,
  ShippingOrderRow,
  ShippingStats,
} from "./orders.types";

const rider = alias(users, "rider");
const customer = alias(users, "customer");
const address = alias(userAddresses, "ship_addr");

/**
 * Only physical orders need a courier. `is_digital_only` is nullable, so NULL is
 * treated as physical — an order must never fall out of the shipping queue
 * because a flag was left unset.
 */
const SHIPPABLE = or(eq(orders.isDigitalOnly, false), isNull(orders.isDigitalOnly))!;

const CLOSED_STATUSES: ShippingStatus[] = ["delivered", "returned", "cancelled"];

function buildWhere(filters: ShippingFilters) {
  const conditions = [SHIPPABLE];

  if (filters.status) {
    conditions.push(
      filters.status === "pending"
        ? // An order with no shipment row yet is pending by definition.
          or(eq(shipments.status, "pending"), isNull(shipments.id))!
        : eq(shipments.status, filters.status)
    );
  }

  if (filters.providerId) {
    conditions.push(eq(shipments.providerId, filters.providerId));
  }

  if (filters.riderId) {
    conditions.push(eq(shipments.riderId, filters.riderId));
  }

  if (filters.paymentStatus) {
    conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
  }

  if (filters.codOnly === "cod") {
    conditions.push(
      or(isNull(orders.paymentStatus), sql`${orders.paymentStatus} not in ('paid', 'collected')`)!
    );
  } else if (filters.codOnly === "prepaid") {
    conditions.push(sql`${orders.paymentStatus} in ('paid', 'collected')`);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, term),
        ilike(customer.fullName, term),
        ilike(customer.phone, term),
        ilike(address.phone, term)
      )!
    );
  }

  return and(...conditions);
}

/**
 * The shipping order list. Two queries per page — the joined page of rows and a
 * matching count — with no per-row follow-ups. Every join key is indexed.
 */
export async function getShippingOrders(
  filters: ShippingFilters
): Promise<PaginatedResult<ShippingOrderRow>> {
  try {
    await requireShippingAdmin();

    const where = buildWhere(filters);
    const offset = (filters.page - 1) * filters.pageSize;

    const rowsQuery = db
      .select({
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: orders.totalAmount,
        shippingCost: orders.shippingCost,
        discountAmount: orders.discountAmount,
        couponCode: orders.couponCode,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        orderStatus: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        addressPhone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        shipmentId: shipments.id,
        shippingStatus: shipments.status,
        providerId: shipments.providerId,
        providerName: shippingProviders.name,
        riderId: shipments.riderId,
        riderName: rider.fullName,
      })
      .from(orders)
      .leftJoin(shipments, eq(shipments.orderId, orders.id))
      .leftJoin(customer, eq(customer.id, orders.userId))
      .leftJoin(address, eq(address.id, orders.shippingAddressId))
      .leftJoin(
        shippingProviders,
        eq(shippingProviders.id, shipments.providerId)
      )
      .leftJoin(rider, eq(rider.id, shipments.riderId))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(filters.pageSize)
      .offset(offset);

    const countQuery = db
      .select({ value: count() })
      .from(orders)
      .leftJoin(shipments, eq(shipments.orderId, orders.id))
      .leftJoin(customer, eq(customer.id, orders.userId))
      .leftJoin(address, eq(address.id, orders.shippingAddressId))
      .where(where);

    const [rows, totals] = await Promise.all([rowsQuery, countQuery]);

    const data: ShippingOrderRow[] = rows.map((row) => ({
      ...row,
      // No shipment row yet means nothing has been arranged: pending.
      shippingStatus: (row.shippingStatus ?? "pending") as ShippingStatus,
    }));

    return { success: true, data, totalCount: totals[0]?.value ?? 0 };
  } catch (error) {
    return {
      success: false,
      error: actionError("getShippingOrders", error),
      data: [],
      totalCount: 0,
    };
  }
}

/** All seven dashboard counters in a single round trip. */
export async function getShippingStats(): Promise<ActionResult<ShippingStats>> {
  try {
    await requireShippingAdmin();

    const [row] = await db
      .select({
        total: count(),
        pending: sql<number>`count(*) filter (where ${shipments.id} is null or ${shipments.status} = 'pending')`,
        assigned: sql<number>`count(*) filter (where ${shipments.status} = 'assigned')`,
        outForDelivery: sql<number>`count(*) filter (where ${shipments.status} = 'out_for_delivery')`,
        delivered: sql<number>`count(*) filter (where ${shipments.status} = 'delivered')`,
        failed: sql<number>`count(*) filter (where ${shipments.status} = 'failed')`,
        returned: sql<number>`count(*) filter (where ${shipments.status} = 'returned')`,
      })
      .from(orders)
      .leftJoin(shipments, eq(shipments.orderId, orders.id))
      .where(SHIPPABLE);

    return {
      success: true,
      data: {
        total: Number(row?.total ?? 0),
        pending: Number(row?.pending ?? 0),
        assigned: Number(row?.assigned ?? 0),
        outForDelivery: Number(row?.outForDelivery ?? 0),
        delivered: Number(row?.delivered ?? 0),
        failed: Number(row?.failed ?? 0),
        returned: Number(row?.returned ?? 0),
      },
    };
  } catch (error) {
    return { success: false, error: actionError("getShippingStats", error) };
  }
}

/** A shipment sitting in "out for delivery" longer than this is delayed. */
const DELAYED_HOURS = 24;

/** Operational cards for the admin dashboard — what still needs attention. */
export async function getOperationalStats(): Promise<
  ActionResult<{
    unassignedOrders: number;
    withoutProvider: number;
    withoutRider: number;
    delayedOrders: number;
    todaysDeliveries: number;
    codOutstanding: number;
    codCollectedToday: number;
  }>
> {
  try {
    await requireShippingAdmin();

    const [row] = await db
      .select({
        unassignedOrders: sql<number>`count(*) filter (where ${shipments.id} is null)`,
        withoutProvider: sql<number>`count(*) filter (
          where ${shipments.providerId} is null
            and (${shipments.status} is null or ${shipments.status} not in ('delivered', 'returned', 'cancelled'))
        )`,
        withoutRider: sql<number>`count(*) filter (
          where ${shipments.riderId} is null
            and (${shipments.status} is null or ${shipments.status} not in ('delivered', 'returned', 'cancelled'))
        )`,
        delayedOrders: sql<number>`count(*) filter (
          where ${shipments.status} = 'out_for_delivery'
            and ${shipments.assignedAt} < now() - ${sql.raw(`interval '${DELAYED_HOURS} hours'`)}
        )`,
        todaysDeliveries: sql<number>`count(*) filter (where ${shipments.assignedAt}::date = current_date)`,
        codOutstanding: sql<number>`coalesce(sum(${orders.totalAmount}) filter (
          where ${orders.paymentStatus} not in ('paid', 'collected')
            and (${shipments.status} is null or ${shipments.status} not in ('delivered', 'returned', 'cancelled'))
        ), 0)::numeric`,
      })
      .from(orders)
      .leftJoin(shipments, eq(shipments.orderId, orders.id))
      .where(SHIPPABLE);

    const [codRow] = await db
      .select({
        value: sql<number>`coalesce(sum(${payments.amount}), 0)::numeric`,
      })
      .from(payments)
      .where(
        and(eq(payments.status, "collected"), sql`${payments.capturedAt}::date = current_date`)
      );

    return {
      success: true,
      data: {
        unassignedOrders: Number(row?.unassignedOrders ?? 0),
        withoutProvider: Number(row?.withoutProvider ?? 0),
        withoutRider: Number(row?.withoutRider ?? 0),
        delayedOrders: Number(row?.delayedOrders ?? 0),
        todaysDeliveries: Number(row?.todaysDeliveries ?? 0),
        codOutstanding: Number(row?.codOutstanding ?? 0),
        codCollectedToday: Number(codRow?.value ?? 0),
      },
    };
  } catch (error) {
    return { success: false, error: actionError("getOperationalStats", error) };
  }
}

/** The most recently updated shipments, for the dashboard's activity table. */
export async function getRecentShipments(
  limit = 10
): Promise<ListResult<ShippingOrderRow>> {
  try {
    await requireShippingAdmin();

    const rows = await db
      .select({
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        totalAmount: orders.totalAmount,
        shippingCost: orders.shippingCost,
        discountAmount: orders.discountAmount,
        couponCode: orders.couponCode,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        orderStatus: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        addressPhone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        shipmentId: shipments.id,
        shippingStatus: shipments.status,
        providerId: shipments.providerId,
        providerName: shippingProviders.name,
        riderId: shipments.riderId,
        riderName: rider.fullName,
      })
      .from(shipments)
      .innerJoin(orders, eq(orders.id, shipments.orderId))
      .leftJoin(customer, eq(customer.id, orders.userId))
      .leftJoin(address, eq(address.id, orders.shippingAddressId))
      .leftJoin(shippingProviders, eq(shippingProviders.id, shipments.providerId))
      .leftJoin(rider, eq(rider.id, shipments.riderId))
      .orderBy(desc(shipments.updatedAt))
      .limit(limit);

    const data: ShippingOrderRow[] = rows.map((row) => ({
      ...row,
      shippingStatus: (row.shippingStatus ?? "pending") as ShippingStatus,
    }));

    return { success: true, data };
  } catch (error) {
    return { success: false, error: actionError("getRecentShipments", error), data: [] };
  }
}

export async function getActiveProviders(): Promise<ListResult<ProviderOption>> {
  try {
    await requireShippingAdmin();

    const data = await db
      .select({
        id: shippingProviders.id,
        name: shippingProviders.name,
        code: shippingProviders.code,
      })
      .from(shippingProviders)
      .where(eq(shippingProviders.isActive, true))
      .orderBy(asc(shippingProviders.name));

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: actionError("getActiveProviders", error),
      data: [],
    };
  }
}

export async function getRiders(): Promise<ListResult<RiderOption>> {
  try {
    await requireShippingAdmin();

    const data = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        isSuspended: users.isSuspended,
        isAvailable: users.isAvailable,
        // Written with fully-literal table/column identifiers rather than
        // ${shipments.riderId}-style interpolation: when the outer query
        // selects from a single table (users, here), drizzle-orm 0.45's
        // compiler strips table qualifiers from every interpolated column
        // it renders — including inside these nested raw-sql subqueries,
        // which reference other tables entirely. That silently turns
        // `${shipments.riderId} = ${users.id}` into bare `"rider_id" = "id"`,
        // which resolves against the subquery's own FROM table (shadowing
        // the correlation) instead of erroring — always false — and, once a
        // second joined table also has an `id` column (the codHeld join
        // below), becomes a genuine "column reference is ambiguous" error.
        // Verified against drizzle-orm@0.45.1's actual .toSQL() output.
        activeDeliveries: sql<number>`(
          select count(*)::int from "shipments"
          where "shipments"."rider_id" = "users"."id"
            and "shipments"."status" in ('assigned', 'out_for_delivery')
        )`,
        todayDeliveries: sql<number>`(
          select count(*)::int from "shipments"
          where "shipments"."rider_id" = "users"."id"
            and "shipments"."assigned_at"::date = current_date
        )`,
        codHeld: sql<number>`(
          select coalesce(sum("orders"."total_amount"), 0)::numeric from "shipments"
          inner join "orders" on "orders"."id" = "shipments"."order_id"
          where "shipments"."rider_id" = "users"."id"
            and "shipments"."status" in ('assigned', 'out_for_delivery')
            and "orders"."payment_status" not in ('paid', 'collected')
        )`,
      })
      .from(users)
      .where(eq(users.role, "driver"))
      .orderBy(asc(users.fullName));

    // codHeld is a ::numeric aggregate — postgres (via node-postgres) returns
    // those as strings, not numbers, regardless of the sql<number> TS hint.
    return {
      success: true,
      data: data.map((row) => ({ ...row, codHeld: Number(row.codHeld) })),
    };
  } catch (error) {
    return { success: false, error: actionError("getRiders", error), data: [] };
  }
}

export async function getShippingOrderDetail(
  orderId: string
): Promise<ActionResult<OrderDetail>> {
  try {
    await requireShippingAdmin();

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        user: {
          columns: { id: true, fullName: true, email: true, phone: true },
        },
        userAddress_shippingAddressId: true,
        orderItems: {
          columns: {
            id: true,
            productName: true,
            variantName: true,
            sku: true,
            quantity: true,
            price: true,
            total: true,
          },
        },
        shipments: {
          with: {
            provider: { columns: { id: true, name: true, code: true } },
            rider: { columns: { id: true, fullName: true, phone: true } },
            deliveries: {
              orderBy: (deliveries, { desc }) => [desc(deliveries.createdAt)],
              with: {
                user: { columns: { id: true, fullName: true } },
              },
            },
          },
        },
        payments: {
          orderBy: (payments, { desc }) => [desc(payments.createdAt)],
        },
      },
    });

    if (!order) return { success: false, error: "Order not found" };

    return { success: true, data: order as OrderDetail };
  } catch (error) {
    return {
      success: false,
      error: actionError("getShippingOrderDetail", error),
    };
  }
}

// ---------------------------------------------------------------- mutations

/** The shipment row for an order, or null when nothing has been arranged yet. */
async function currentShipment(orderId: string) {
  const [row] = await db
    .select({
      id: shipments.id,
      status: shipments.status,
      riderId: shipments.riderId,
      providerId: shipments.providerId,
    })
    .from(shipments)
    .where(eq(shipments.orderId, orderId))
    .limit(1);

  return row ?? null;
}

export async function assignProvider(input: unknown): Promise<ActionResult> {
  try {
    await requireShippingAdmin();
    const { orderId, providerId } = assignProviderSchema.parse(input);

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        paymentStatus: true,
      },
      with: {
        userAddress_shippingAddressId: true,
        user: { columns: { fullName: true, phone: true } },
      },
    });
    if (!order) return { success: false, error: "Order not found" };

    let provider: { id: string; code: string } | null = null;
    if (providerId) {
      const [found] = await db
        .select({ id: shippingProviders.id, code: shippingProviders.code })
        .from(shippingProviders)
        .where(
          and(
            eq(shippingProviders.id, providerId),
            eq(shippingProviders.isActive, true)
          )
        )
        .limit(1);
      if (!found) {
        return { success: false, error: "Provider not found or inactive" };
      }
      provider = found;
    }

    // Manual adapters return nulls today; a real integration returns a tracking
    // number and label without any change at this call site.
    let trackingNumber: string | null = null;
    let labelUrl: string | null = null;

    if (provider) {
      const shippingAddress = order.userAddress_shippingAddressId;
      const created = await getProviderAdapter(provider.code).createShipment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        codAmount:
          order.paymentStatus === "paid" ? 0 : Number(order.totalAmount),
        recipient: {
          name: shippingAddress?.fullName ?? order.user?.fullName ?? "",
          phone: shippingAddress?.phone ?? order.user?.phone ?? "",
          addressLine1: shippingAddress?.addressLine1 ?? "",
          addressLine2: shippingAddress?.addressLine2,
          city: shippingAddress?.city ?? "",
          state: shippingAddress?.state ?? "",
          postalCode: shippingAddress?.postalCode,
          country: shippingAddress?.country,
        },
      });
      trackingNumber = created.trackingNumber;
      labelUrl = created.labelUrl;
    }

    const now = new Date().toISOString();

    // The unique constraint on order_id makes this atomic and idempotent.
    await db
      .insert(shipments)
      .values({
        orderId,
        providerId,
        carrier: provider?.code ?? null,
        trackingNumber,
        shippingLabelUrl: labelUrl,
        status: "pending",
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: shipments.orderId,
        set: {
          providerId,
          carrier: provider?.code ?? null,
          ...(trackingNumber ? { trackingNumber } : {}),
          ...(labelUrl ? { shippingLabelUrl: labelUrl } : {}),
          updatedAt: now,
        },
      });

    revalidateShipping(orderId);
    return {
      success: true,
      message: providerId ? "Provider assigned" : "Provider cleared",
    };
  } catch (error) {
    return { success: false, error: actionError("assignProvider", error) };
  }
}

export async function assignRider(input: unknown): Promise<ActionResult> {
  try {
    await requireShippingAdmin();
    const { orderId, riderId } = assignRiderSchema.parse(input);

    if (riderId) {
      // Never trust that the posted id actually belongs to a rider.
      const [target] = await db
        .select({ id: users.id, isSuspended: users.isSuspended })
        .from(users)
        .where(and(eq(users.id, riderId), eq(users.role, "driver")))
        .limit(1);
      if (!target) return { success: false, error: "Rider not found" };
      if (target.isSuspended) {
        return { success: false, error: "Rider account is suspended" };
      }
    }

    const existing = await currentShipment(orderId);
    if (existing && CLOSED_STATUSES.includes(existing.status)) {
      return { success: false, error: "This delivery is already closed" };
    }

    const now = new Date().toISOString();
    const status: ShippingStatus = riderId
      ? existing?.status === "out_for_delivery"
        ? "out_for_delivery"
        : "assigned"
      : "pending";

    await db
      .insert(shipments)
      .values({
        orderId,
        riderId,
        status,
        assignedAt: riderId ? now : null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: shipments.orderId,
        set: {
          riderId,
          status,
          assignedAt: riderId ? now : null,
          updatedAt: now,
        },
      });

    revalidateShipping(orderId);
    return {
      success: true,
      message: riderId ? "Rider assigned" : "Rider unassigned",
    };
  } catch (error) {
    return { success: false, error: actionError("assignRider", error) };
  }
}

export async function updateShipmentStatus(
  input: unknown
): Promise<ActionResult> {
  try {
    await requireShippingAdmin();
    const { orderId, status, failureReason } = updateStatusSchema.parse(input);

    const existing = await currentShipment(orderId);
    const from: ShippingStatus = existing?.status ?? "pending";

    if (from === status) {
      return { success: false, error: `Delivery is already ${label(status)}` };
    }
    if (!canTransition(from, status)) {
      return {
        success: false,
        error: `Cannot move a delivery from ${label(from)} to ${label(status)}`,
      };
    }

    await applyShipmentStatus({
      orderId,
      status,
      failureReason,
      existingId: existing?.id ?? null,
      expectedFromStatus: existing?.status,
    });

    revalidateShipping(orderId);
    return { success: true, message: "Status updated" };
  } catch (error) {
    return {
      success: false,
      error: actionError("updateShipmentStatus", error),
    };
  }
}

function label(status: string): string {
  return status.replace(/_/g, " ");
}

function revalidateShipping(orderId: string) {
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/rider");
}
