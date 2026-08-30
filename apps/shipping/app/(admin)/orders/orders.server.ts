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
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        orderStatus: orders.status,
        createdAt: orders.createdAt,
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
        isSuspended: users.isSuspended,
        activeDeliveries: sql<number>`(
          select count(*)::int from ${shipments}
          where ${shipments.riderId} = ${users.id}
            and ${shipments.status} in ('assigned', 'out_for_delivery')
        )`,
      })
      .from(users)
      .where(eq(users.role, "driver"))
      .orderBy(asc(users.fullName));

    return { success: true, data };
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
          },
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
