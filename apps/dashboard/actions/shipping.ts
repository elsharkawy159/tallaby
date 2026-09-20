"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  and,
  db,
  desc,
  eq,
  inArray,
  orderItems,
  orders,
  sellerRiders,
  shipments,
  sql,
  users,
} from "@workspace/db";
import { getServiceClient } from "@workspace/db/supabase/service";

import { applySellerShipmentStatus } from "@/lib/shipping/apply-seller-shipment";
import {
  canTransition,
  isSettled,
  isShippingStatus,
  isTerminal,
  SHIPPING_STATUSES,
  type ShippingStatus,
} from "@/lib/shipping/shipping-status";
import type {
  SellerRider,
  ShippingOrderRow,
  ShippingOverview,
} from "@/lib/shipping/shipping.types";
import { getUser } from "./auth";

interface ActionResult<T = never> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

async function requireSellerId(): Promise<string> {
  const session = await getUser();
  const id = session?.user?.id;
  if (!id) throw new Error("Unauthorized");
  return id;
}

function fail(context: string, error: unknown): { success: false; error: string } {
  console.error(`${context}:`, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : "Something went wrong",
  };
}

function refresh() {
  revalidatePath("/shipping");
  revalidatePath("/orders");
}

const ELIGIBLE_ORDER_STATUSES = [
  "confirmed",
  "shipping_soon",
  "shipped",
  "out_for_delivery",
  "delivered",
  "returned",
  "cancelled",
] as const;

/**
 * An order is this seller's to ship when every line item is theirs (so a
 * multi-vendor order is never split between two shipping tools) and at least
 * one is seller-fulfilled. Physical orders only.
 */
function ownedOrderCondition(orderIdColumn: unknown, sellerId: string) {
  return and(
    sql`exists (select 1 from order_items oi where oi.order_id = ${orderIdColumn} and oi.seller_id = ${sellerId} and oi.fulfillment_type = 'seller_fulfilled')`,
    sql`not exists (select 1 from order_items oi where oi.order_id = ${orderIdColumn} and oi.seller_id <> ${sellerId})`,
    sql`coalesce(${orders.isDigitalOnly}, false) = false`
  )!;
}

async function loadOwnedOrder(orderId: string, sellerId: string) {
  const [row] = await db
    .select({
      id: orders.id,
      status: orders.status,
      shipmentId: shipments.id,
      shipmentStatus: shipments.status,
      shipmentSellerId: shipments.sellerId,
    })
    .from(orders)
    .leftJoin(shipments, eq(shipments.orderId, orders.id))
    .where(and(eq(orders.id, orderId), ownedOrderCondition(orders.id, sellerId)))
    .limit(1);

  if (!row) throw new Error("Order not found");
  if (row.shipmentId && row.shipmentSellerId !== sellerId) {
    throw new Error("This order is being delivered by Tallaby — you can't change it.");
  }
  return row;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

async function loadRiders(sellerId: string): Promise<SellerRider[]> {
  const riders = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      isSuspended: users.isSuspended,
      isAvailable: users.isAvailable,
      createdAt: sellerRiders.createdAt,
    })
    .from(sellerRiders)
    .innerJoin(users, eq(users.id, sellerRiders.riderId))
    .where(eq(sellerRiders.sellerId, sellerId))
    .orderBy(desc(sellerRiders.createdAt));

  if (riders.length === 0) return [];

  const counts = await db
    .select({
      riderId: shipments.riderId,
      active: sql<number>`count(*) filter (where ${shipments.status} in ('assigned', 'out_for_delivery'))`,
      delivered: sql<number>`count(*) filter (where ${shipments.status} = 'delivered')`,
    })
    .from(shipments)
    .where(
      and(
        eq(shipments.sellerId, sellerId),
        inArray(
          shipments.riderId,
          riders.map((r) => r.id)
        )
      )
    )
    .groupBy(shipments.riderId);

  const byRider = new Map(counts.map((c) => [c.riderId, c]));

  return riders.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    isActive: !(r.isSuspended ?? false),
    isAvailable: r.isAvailable ?? true,
    activeDeliveries: Number(byRider.get(r.id)?.active ?? 0),
    deliveredTotal: Number(byRider.get(r.id)?.delivered ?? 0),
    createdAt: r.createdAt,
  }));
}

export async function getShippingOverview(): Promise<ActionResult<ShippingOverview>> {
  try {
    const sellerId = await requireSellerId();

    // Ids first (the eligibility rules are cleaner as plain SQL), then the
    // relational query for the rows themselves.
    const eligible = await db
      .select({ id: orders.id })
      .from(orders)
      .leftJoin(
        shipments,
        and(eq(shipments.orderId, orders.id), eq(shipments.sellerId, sellerId))
      )
      .where(
        and(
          ownedOrderCondition(orders.id, sellerId),
          sql`(${orders.status} in (${sql.join(
            ELIGIBLE_ORDER_STATUSES.map((s) => sql`${s}`),
            sql`, `
          )}) or ${shipments.id} is not null)`
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(300);

    const ids = eligible.map((e) => e.id);

    const [orderRows, riders] = await Promise.all([
      ids.length === 0
        ? Promise.resolve([])
        : db.query.orders.findMany({
            where: inArray(orders.id, ids),
            orderBy: [desc(orders.createdAt)],
            columns: {
              id: true,
              orderNumber: true,
              status: true,
              totalAmount: true,
              paymentMethod: true,
              paymentStatus: true,
              createdAt: true,
            },
            with: {
              user: { columns: { fullName: true, phone: true } },
              userAddress_shippingAddressId: true,
              shipments: true,
              orderItems: {
                where: eq(orderItems.sellerId, sellerId),
                columns: { productName: true, quantity: true, total: true },
              },
            },
          }),
      loadRiders(sellerId),
    ]);

    const riderNames = new Map(riders.map((r) => [r.id, r.fullName]));

    const rows: ShippingOrderRow[] = orderRows.map((o) => {
      const shipment = o.shipments?.[0] ?? null;
      const addr = o.userAddress_shippingAddressId;
      const items = o.orderItems ?? [];
      const total = items.reduce((sum, i) => sum + Number(i.total ?? 0), 0);
      // No shipment row yet: an order that already reached a final state some
      // other way (cancelled, delivered outside this flow) reads as that state.
      const orderStatus = o.status ?? "pending";
      const orderFinal: ShippingStatus | null =
        orderStatus === "cancelled" || orderStatus === "returned" || orderStatus === "delivered"
          ? orderStatus
          : null;
      const status: ShippingStatus =
        shipment && isShippingStatus(shipment.status)
          ? shipment.status
          : (orderFinal ?? "pending");

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt ?? new Date().toISOString(),
        orderStatus,
        shipmentId: shipment?.id ?? null,
        status,
        editable: shipment
          ? shipment.sellerId === sellerId
          : orderStatus === "confirmed" || orderStatus === "shipping_soon",
        failureReason: shipment?.failureReason ?? null,
        riderId: shipment?.riderId ?? null,
        riderName: shipment?.riderId ? (riderNames.get(shipment.riderId) ?? null) : null,
        customerName: addr?.fullName?.trim() || o.user?.fullName?.trim() || "Customer",
        customerPhone: addr?.phone?.trim() || o.user?.phone?.trim() || null,
        addressLine: [addr?.addressLine1, addr?.addressLine2].filter(Boolean).join(", "),
        city: addr?.city ?? null,
        deliveryInstructions: addr?.deliveryInstructions ?? null,
        itemCount: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
        itemsSummary: items.map((i) => `${i.quantity ?? 1}× ${i.productName}`).join(", "),
        total,
        paymentMethod: o.paymentMethod ?? null,
        paymentStatus: o.paymentStatus ?? null,
        codDue: isSettled(o.paymentStatus) ? 0 : Number(o.totalAmount ?? total),
        assignedAt: shipment?.assignedAt ?? null,
        deliveredAt: shipment?.deliveredAt ?? null,
      };
    });

    return { success: true, data: { orders: rows, riders } };
  } catch (error) {
    return fail("getShippingOverview", error);
  }
}

// ---------------------------------------------------------------------------
// Status + assignment
// ---------------------------------------------------------------------------

const updateStatusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(SHIPPING_STATUSES),
  failureReason: z.string().trim().max(500).optional(),
});

export async function updateShipmentStatus(input: unknown): Promise<ActionResult> {
  try {
    const sellerId = await requireSellerId();
    const { orderId, status, failureReason } = updateStatusSchema.parse(input);

    const order = await loadOwnedOrder(orderId, sellerId);
    if (!order.shipmentId || !order.shipmentStatus) {
      throw new Error("Assign a rider before updating the delivery status.");
    }
    const from = order.shipmentStatus as ShippingStatus;
    if (!canTransition(from, status)) {
      throw new Error(
        `Can't move a ${from.replace(/_/g, " ")} shipment to ${status.replace(/_/g, " ")}.`
      );
    }
    if (status === "failed" && !failureReason) {
      throw new Error("Please give a reason for the failed delivery.");
    }

    await applySellerShipmentStatus({
      orderId,
      sellerId,
      shipmentId: order.shipmentId,
      status,
      expectedFromStatus: from,
      failureReason,
    });

    refresh();
    return { success: true, message: "Shipment updated" };
  } catch (error) {
    return fail("updateShipmentStatus", error);
  }
}

const assignSchema = z.object({
  orderIds: z.array(z.uuid()).min(1).max(100),
  riderId: z.uuid(),
});

/** Assigns (or reassigns) a seller rider to one or many orders. */
export async function assignRider(
  input: unknown
): Promise<ActionResult<{ assigned: number }>> {
  try {
    const sellerId = await requireSellerId();
    const { orderIds, riderId } = assignSchema.parse(input);

    const [rider] = await db
      .select({ id: users.id, isSuspended: users.isSuspended })
      .from(sellerRiders)
      .innerJoin(users, eq(users.id, sellerRiders.riderId))
      .where(and(eq(sellerRiders.sellerId, sellerId), eq(sellerRiders.riderId, riderId)))
      .limit(1);

    if (!rider) throw new Error("Rider not found");
    if (rider.isSuspended) throw new Error("This rider is deactivated.");

    const loaded = await Promise.all(orderIds.map((id) => loadOwnedOrder(id, sellerId)));

    for (const o of loaded) {
      const current = (o.shipmentStatus ?? "pending") as ShippingStatus;
      const readyToShip = o.status === "confirmed" || o.status === "shipping_soon";
      if (isTerminal(current) || (!o.shipmentId && !readyToShip)) {
        throw new Error("Only orders that are ready to ship can be assigned.");
      }
    }

    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      for (const o of loaded) {
        await tx
          .insert(shipments)
          .values({
            orderId: o.id,
            sellerId,
            riderId,
            carrier: "seller",
            status: "assigned",
            assignedAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: shipments.orderId,
            set: {
              riderId,
              status: "assigned",
              assignedAt: now,
              updatedAt: now,
              failureReason: null,
            },
            // Never take over a shipment another party created.
            setWhere: eq(shipments.sellerId, sellerId),
          });
      }

      await tx
        .update(orders)
        .set({ status: "shipped", updatedAt: now })
        .where(
          and(
            inArray(orders.id, orderIds),
            inArray(orders.status, ["confirmed", "shipping_soon"])
          )
        );

      await tx
        .update(orderItems)
        .set({ status: "shipping_soon", updatedAt: now })
        .where(
          and(inArray(orderItems.orderId, orderIds), eq(orderItems.sellerId, sellerId))
        );
    });

    refresh();
    return {
      success: true,
      data: { assigned: orderIds.length },
      message: `${orderIds.length} order${orderIds.length === 1 ? "" : "s"} assigned`,
    };
  } catch (error) {
    return fail("assignRider", error);
  }
}

// ---------------------------------------------------------------------------
// Rider management
// ---------------------------------------------------------------------------

const riderFields = {
  fullName: z.string().trim().min(1, "Name is required").max(200),
  phone: z.string().trim().min(1, "Phone is required").max(50),
};

const createRiderSchema = z.object({
  ...riderFields,
  email: z.email("Enter a valid email address"),
});

const updateRiderSchema = z.object({ riderId: z.uuid(), ...riderFields });

const toggleSchema = z.object({ riderId: z.uuid(), value: z.boolean() });

async function requireOwnedRider(sellerId: string, riderId: string) {
  const [link] = await db
    .select({ id: sellerRiders.id })
    .from(sellerRiders)
    .where(and(eq(sellerRiders.sellerId, sellerId), eq(sellerRiders.riderId, riderId)))
    .limit(1);
  if (!link) throw new Error("Rider not found");
}

/**
 * Riders are platform users with role = 'driver' (same as Tallaby's own), so
 * this creates an auth account with the service-role client — gated by the
 * seller session above, never exposed to the browser — then links it to the
 * seller. The rider signs in on the shipping app after resetting their password.
 */
export async function createSellerRider(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const sellerId = await requireSellerId();
    const { fullName, email, phone } = createRiderSchema.parse(input);

    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? "Could not create the rider account");
    }

    const riderId = data.user.id;

    await db.transaction(async (tx) => {
      await tx
        .insert(users)
        .values({
          id: riderId,
          email,
          fullName,
          phone,
          role: "driver",
          isVerified: true,
          isSuspended: false,
          isAvailable: true,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: { fullName, phone, role: "driver", isVerified: true },
        });
      await tx.insert(sellerRiders).values({ sellerId, riderId });
    });

    refresh();
    return { success: true, data: { id: riderId }, message: "Rider added" };
  } catch (error) {
    return fail("createSellerRider", error);
  }
}

export async function updateSellerRider(input: unknown): Promise<ActionResult> {
  try {
    const sellerId = await requireSellerId();
    const { riderId, fullName, phone } = updateRiderSchema.parse(input);
    await requireOwnedRider(sellerId, riderId);

    await db
      .update(users)
      .set({ fullName, phone, updatedAt: new Date().toISOString() })
      .where(and(eq(users.id, riderId), eq(users.role, "driver")));

    refresh();
    return { success: true, message: "Rider updated" };
  } catch (error) {
    return fail("updateSellerRider", error);
  }
}

export async function setSellerRiderActive(input: unknown): Promise<ActionResult> {
  try {
    const sellerId = await requireSellerId();
    const { riderId, value } = toggleSchema.parse(input);
    await requireOwnedRider(sellerId, riderId);

    await db
      .update(users)
      .set({ isSuspended: !value, updatedAt: new Date().toISOString() })
      .where(and(eq(users.id, riderId), eq(users.role, "driver")));

    refresh();
    return { success: true, message: value ? "Rider activated" : "Rider deactivated" };
  } catch (error) {
    return fail("setSellerRiderActive", error);
  }
}

export async function setSellerRiderAvailable(input: unknown): Promise<ActionResult> {
  try {
    const sellerId = await requireSellerId();
    const { riderId, value } = toggleSchema.parse(input);
    await requireOwnedRider(sellerId, riderId);

    await db
      .update(users)
      .set({ isAvailable: value, updatedAt: new Date().toISOString() })
      .where(and(eq(users.id, riderId), eq(users.role, "driver")));

    refresh();
    return { success: true, message: "Saved" };
  } catch (error) {
    return fail("setSellerRiderAvailable", error);
  }
}
