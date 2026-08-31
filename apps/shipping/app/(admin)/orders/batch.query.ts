/**
 * Query helpers shared by batch.server.ts and the batch export route/pages.
 *
 * Deliberately NOT a "use server" module, matching lib/apply-shipment-status.ts's
 * convention: batch.server.ts's exports are Server Actions and must all be
 * async functions, so shared query logic that other server-only modules
 * (like a Route Handler) also need to call lives here instead.
 */
import {
  db,
  and,
  asc,
  eq,
  inArray,
  orders,
  shipments,
  sql,
  users,
} from "@workspace/db";

import type { BulkAssignOrder, EligibleRider } from "@/providers";
import type { BulkAssignTarget } from "./batch.dto";
import type { RiderSplitEntry } from "./batch.types";
import { address, buildWhere, customer, SHIPPABLE, stageConditions } from "./orders.query";

/**
 * Every order matching the target — the whole point of "Assign all" is that
 * it covers every order the Confirmed tab's filters match, not just the
 * current page, so this re-runs the query server-side instead of trusting a
 * client-posted id list.
 */
export async function resolveConfirmedOrderIds(target: BulkAssignTarget): Promise<string[]> {
  if (target.mode === "ids") {
    const rows = await db
      .select({ id: orders.id })
      .from(orders)
      .leftJoin(shipments, eq(shipments.orderId, orders.id))
      .where(and(SHIPPABLE, ...stageConditions("confirmed"), inArray(orders.id, target.orderIds)));
    return rows.map((row) => row.id);
  }

  const where = buildWhere({ ...target.filters, stage: "confirmed" });
  const rows = await db
    .select({ id: orders.id })
    .from(orders)
    .leftJoin(shipments, eq(shipments.orderId, orders.id))
    .leftJoin(customer, eq(customer.id, orders.userId))
    .leftJoin(address, eq(address.id, orders.shippingAddressId))
    .where(where);
  return rows.map((row) => row.id);
}

/**
 * The plain data each provider adapter's planBulkAssign() needs per order.
 * Also used by the batch export route and the /batches detail page, which
 * both need to regenerate the same Egypt Post rows on demand rather than
 * storing a frozen copy.
 */
export async function loadBulkAssignOrders(orderIds: string[]): Promise<BulkAssignOrder[]> {
  const rows = await db.query.orders.findMany({
    where: inArray(orders.id, orderIds),
    columns: {
      id: true,
      orderNumber: true,
      notes: true,
      totalAmount: true,
      paymentStatus: true,
    },
    with: {
      user: { columns: { fullName: true, phone: true } },
      userAddress_shippingAddressId: true,
      shipments: { columns: { packageWeight: true } },
      orderItems: {
        columns: { productName: true, quantity: true },
        with: { seller: { columns: { businessName: true } } },
      },
    },
  });

  return rows.map((order) => {
    const shippingAddress = order.userAddress_shippingAddressId;
    // At most one row per order — shipments_order_id_unique.
    const shipment = order.shipments[0];
    const sellerNames = [
      ...new Set(
        order.orderItems
          .map((item) => item.seller?.businessName)
          .filter((name): name is string => Boolean(name))
      ),
    ];

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderNotes: order.notes,
      totalAmount: Number(order.totalAmount),
      paymentStatus: order.paymentStatus,
      packageWeightKg: shipment?.packageWeight != null ? Number(shipment.packageWeight) : null,
      customerName: shippingAddress?.fullName ?? order.user?.fullName ?? null,
      phone: shippingAddress?.phone ?? null,
      fallbackPhone: order.user?.phone ?? null,
      addressLine1: shippingAddress?.addressLine1 ?? null,
      addressLine2: shippingAddress?.addressLine2 ?? null,
      governorate: shippingAddress?.state ?? null,
      city: shippingAddress?.city ?? null,
      deliveryInstructions: shippingAddress?.deliveryInstructions ?? null,
      items: order.orderItems.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
      })),
      sellerNames,
    };
  });
}

/** On-duty, non-suspended riders, with their current open-delivery count. */
export async function loadEligibleRiders(): Promise<EligibleRider[]> {
  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      phone: users.phone,
      email: users.email,
      avatarUrl: users.avatarUrl,
      // Fully-literal identifiers, matching getRiders() in orders.server.ts —
      // drizzle-orm 0.45.1 strips table qualifiers from interpolated columns
      // inside a raw-sql subquery when the outer query selects from a single
      // table, which silently breaks the correlation.
      activeDeliveries: sql<number>`(
        select count(*)::int from "shipments"
        where "shipments"."rider_id" = "users"."id"
          and "shipments"."status" in ('assigned', 'out_for_delivery')
      )`,
    })
    .from(users)
    .where(and(eq(users.role, "driver"), eq(users.isAvailable, true), eq(users.isSuspended, false)))
    .orderBy(asc(users.fullName));

  return rows.map((row) => ({ ...row, activeDeliveries: Number(row.activeDeliveries) }));
}

export function buildRiderSplit(
  riderByOrderId: Record<string, string>,
  riders: EligibleRider[]
): RiderSplitEntry[] {
  const counts = new Map<string, number>();
  for (const riderId of Object.values(riderByOrderId)) {
    counts.set(riderId, (counts.get(riderId) ?? 0) + 1);
  }

  return riders
    .filter((rider) => counts.has(rider.id))
    .map((rider) => ({
      riderId: rider.id,
      fullName: rider.fullName,
      phone: rider.phone,
      email: rider.email,
      avatarUrl: rider.avatarUrl,
      orderCount: counts.get(rider.id) ?? 0,
    }));
}
