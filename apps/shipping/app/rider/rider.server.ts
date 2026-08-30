"use server";

import {
  and,
  asc,
  db,
  deliveries,
  desc,
  eq,
  orderItems,
  orders,
  payments,
  shipments,
  shippingProviders,
  sql,
  userAddresses,
  users,
} from "@workspace/db";

import { revalidatePath } from "next/cache";

import { actionError, type ActionResult } from "@/lib/action-result";
import { applyShipmentStatus } from "@/lib/apply-shipment-status";
import { requireRider } from "@/lib/auth";
import { canTransition, isSettled, type ShippingStatus } from "@/lib/shipping-status";
import {
  addDeliveryNoteSchema,
  collectPaymentSchema,
  riderUpdateStatusSchema,
} from "@/app/(admin)/orders/orders.dto";

export interface RiderDelivery {
  shipmentId: string;
  orderId: string;
  orderNumber: string;
  status: ShippingStatus;
  subtotal: string;
  shippingCost: string | null;
  discountAmount: string | null;
  couponCode: string | null;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string | null;
  customerName: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  deliveryInstructions: string | null;
  providerName: string | null;
  assignedAt: string | null;
  deliveredAt: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DeliveryLine {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
}

export interface MyDeliveryResult extends ActionResult<RiderDelivery> {
  items?: DeliveryLine[];
}

/** Open work first, then everything the rider has already closed out. */
const OPEN_STATUSES: ShippingStatus[] = ["assigned", "out_for_delivery"];

const baseSelect = {
  shipmentId: shipments.id,
  orderId: orders.id,
  orderNumber: orders.orderNumber,
  status: shipments.status,
  subtotal: orders.subtotal,
  shippingCost: orders.shippingCost,
  discountAmount: orders.discountAmount,
  couponCode: orders.couponCode,
  totalAmount: orders.totalAmount,
  paymentMethod: orders.paymentMethod,
  paymentStatus: orders.paymentStatus,
  customerName: userAddresses.fullName,
  phone: userAddresses.phone,
  addressLine1: userAddresses.addressLine1,
  addressLine2: userAddresses.addressLine2,
  city: userAddresses.city,
  state: userAddresses.state,
  postalCode: userAddresses.postalCode,
  country: userAddresses.country,
  deliveryInstructions: userAddresses.deliveryInstructions,
  providerName: shippingProviders.name,
  assignedAt: shipments.assignedAt,
  deliveredAt: shipments.deliveredAt,
  latitude: userAddresses.latitude,
  longitude: userAddresses.longitude,
};

export async function getMyDelivery(shipmentId: string): Promise<MyDeliveryResult> {
  try {
    const user = await requireRider();

    const [row] = await db
      .select(baseSelect)
      .from(shipments)
      .innerJoin(orders, eq(orders.id, shipments.orderId))
      .leftJoin(userAddresses, eq(userAddresses.id, orders.shippingAddressId))
      .leftJoin(
        shippingProviders,
        eq(shippingProviders.id, shipments.providerId)
      )
      // The ownership check is part of the query, not a check afterwards.
      .where(and(eq(shipments.id, shipmentId), eq(shipments.riderId, user.id)))
      .limit(1);

    if (!row) return { success: false, error: "Delivery not found" };

    const items = await db
      .select({
        id: orderItems.id,
        productName: orderItems.productName,
        variantName: orderItems.variantName,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, row.orderId));

    return { success: true, data: row as RiderDelivery, items };
  } catch (error) {
    return { success: false, error: actionError("getMyDelivery", error) };
  }
}

/**
 * Rider-side status update. Scoped to the caller's own shipment — the rider id
 * comes from the session, never from the request, so no shape of request lets a
 * rider touch someone else's delivery.
 */
export async function riderUpdateStatus(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireRider();
    const { shipmentId, status, reasonCode, failureReason } =
      riderUpdateStatusSchema.parse(input);

    const [owned] = await db
      .select({
        id: shipments.id,
        orderId: shipments.orderId,
        status: shipments.status,
        paymentStatus: orders.paymentStatus,
      })
      .from(shipments)
      .innerJoin(orders, eq(orders.id, shipments.orderId))
      .where(and(eq(shipments.id, shipmentId), eq(shipments.riderId, user.id)))
      .limit(1);

    if (!owned) return { success: false, error: "Delivery not found" };

    if (!canTransition(owned.status, status)) {
      const label = (value: string) => value.replace(/_/g, " ");
      return {
        success: false,
        error: `Cannot move this delivery from ${label(owned.status)} to ${label(status)}`,
      };
    }

    // A COD order can only be marked delivered through collectPayment(),
    // which records the collection in the same transaction. This is enforced
    // here — not just hidden in the UI — so no request shape lets a rider
    // mark a COD order delivered without collecting (or explicitly reporting
    // that payment was not collected via the "failed" path).
    const isCod = !isSettled(owned.paymentStatus);
    if (status === "delivered" && isCod) {
      return {
        success: false,
        error: "Collect the COD payment before marking this order delivered.",
      };
    }

    await applyShipmentStatus({
      orderId: owned.orderId,
      status,
      failureReason,
      existingId: owned.id,
      riderId: user.id,
      expectedFromStatus: owned.status,
      deliveryEvent: { reasonCode, note: failureReason },
    });

    revalidatePath("/rider");
    revalidatePath(`/rider/${shipmentId}`);
    revalidatePath("/orders");
    revalidatePath(`/orders/${owned.orderId}`);
    return { success: true, message: "Status updated" };
  } catch (error) {
    return { success: false, error: actionError("riderUpdateStatus", error) };
  }
}

/**
 * Records a confirmed COD collection and marks the delivery delivered in one
 * transaction. The expected amount is always recomputed from `orders.totalAmount`
 * here — never accepted from the client — so a tampered "expected" value cannot
 * hide a real discrepancy.
 */
export async function collectPayment(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireRider();
    const { shipmentId, amount, method } = collectPaymentSchema.parse(input);

    const [owned] = await db
      .select({
        id: shipments.id,
        orderId: shipments.orderId,
        status: shipments.status,
        totalAmount: orders.totalAmount,
        paymentStatus: orders.paymentStatus,
      })
      .from(shipments)
      .innerJoin(orders, eq(orders.id, shipments.orderId))
      .where(and(eq(shipments.id, shipmentId), eq(shipments.riderId, user.id)))
      .limit(1);

    if (!owned) return { success: false, error: "Delivery not found" };

    if (owned.status !== "out_for_delivery") {
      return {
        success: false,
        error: "This delivery is not out for delivery.",
      };
    }

    if (isSettled(owned.paymentStatus)) {
      return { success: false, error: "This order has already been paid." };
    }

    const expectedAmount = Number(owned.totalAmount);

    await applyShipmentStatus({
      orderId: owned.orderId,
      status: "delivered",
      existingId: owned.id,
      riderId: user.id,
      expectedFromStatus: owned.status,
      deliveryEvent: {
        collection: { amount, method, expectedAmount },
      },
    });

    revalidatePath("/rider");
    revalidatePath(`/rider/${shipmentId}`);
    revalidatePath("/orders");
    revalidatePath(`/orders/${owned.orderId}`);

    const discrepancy = amount - expectedAmount;
    return {
      success: true,
      message:
        discrepancy === 0
          ? "Payment collected and delivery completed"
          : `Payment collected with a ${discrepancy > 0 ? "surplus" : "shortfall"} of ${Math.abs(discrepancy).toFixed(2)} EGP`,
    };
  } catch (error) {
    return { success: false, error: actionError("collectPayment", error) };
  }
}

/** A standalone rider note, independent of any status change. */
export async function addDeliveryNote(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireRider();
    const { shipmentId, note } = addDeliveryNoteSchema.parse(input);

    const [owned] = await db
      .select({ id: shipments.id })
      .from(shipments)
      .where(and(eq(shipments.id, shipmentId), eq(shipments.riderId, user.id)))
      .limit(1);

    if (!owned) return { success: false, error: "Delivery not found" };

    await db.insert(deliveries).values({
      shipmentId: owned.id,
      driverId: user.id,
      status: "note",
      deliveryNotes: note,
    });

    revalidatePath(`/rider/${shipmentId}`);
    revalidatePath(`/orders`);
    return { success: true, message: "Note added" };
  } catch (error) {
    return { success: false, error: actionError("addDeliveryNote", error) };
  }
}

export interface RiderDashboardStats {
  todayTotal: number;
  remaining: number;
  deliveredToday: number;
  failedToday: number;
  codToCollect: number;
  codCollectedToday: number;
}

export interface RiderDashboardResult {
  success: boolean;
  error?: string;
  stats: RiderDashboardStats;
  next: RiderDelivery | null;
  remaining: RiderDelivery[];
  completedToday: RiderDelivery[];
}

/** Everything the rider's home screen needs, in one round trip. */
export async function getRiderDashboard(): Promise<RiderDashboardResult> {
  const empty: RiderDashboardStats = {
    todayTotal: 0,
    remaining: 0,
    deliveredToday: 0,
    failedToday: 0,
    codToCollect: 0,
    codCollectedToday: 0,
  };

  try {
    const user = await requireRider();

    const rows = await db
      .select(baseSelect)
      .from(shipments)
      .innerJoin(orders, eq(orders.id, shipments.orderId))
      .leftJoin(userAddresses, eq(userAddresses.id, orders.shippingAddressId))
      .leftJoin(
        shippingProviders,
        eq(shippingProviders.id, shipments.providerId)
      )
      .where(eq(shipments.riderId, user.id))
      .orderBy(asc(shipments.assignedAt));

    const data = rows as RiderDelivery[];
    const today = new Date().toISOString().slice(0, 10);
    const isToday = (value: string | null) => !!value && value.slice(0, 10) === today;

    const open = data.filter((row) => OPEN_STATUSES.includes(row.status));
    const deliveredToday = data.filter(
      (row) => row.status === "delivered" && isToday(row.deliveredAt)
    );

    const [failedTodayRow] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(deliveries)
      .where(
        and(
          eq(deliveries.driverId, user.id),
          eq(deliveries.status, "failed"),
          sql`${deliveries.createdAt}::date = current_date`
        )
      );

    const [codCollectedRow] = await db
      .select({ value: sql<number>`coalesce(sum(${payments.amount}), 0)::numeric` })
      .from(payments)
      .where(
        and(
          eq(payments.status, "collected"),
          sql`${payments.paymentData} ->> 'collectedBy' = ${user.id}`,
          sql`${payments.capturedAt}::date = current_date`
        )
      );

    const codToCollect = open
      .filter((row) => !isSettled(row.paymentStatus))
      .reduce((sum, row) => sum + Number(row.totalAmount), 0);

    const failedToday = Number(failedTodayRow?.value ?? 0);

    return {
      success: true,
      stats: {
        // No scheduled-delivery-date column exists yet, so "today" is the
        // rider's current open workload plus what they've already closed out
        // today — the practical equivalent in a same-day delivery model.
        todayTotal: open.length + deliveredToday.length + failedToday,
        remaining: open.length,
        deliveredToday: deliveredToday.length,
        failedToday,
        codToCollect,
        codCollectedToday: Number(codCollectedRow?.value ?? 0),
      },
      next: open[0] ?? null,
      remaining: open.slice(1),
      completedToday: deliveredToday,
    };
  } catch (error) {
    return {
      success: false,
      error: actionError("getRiderDashboard", error),
      stats: empty,
      next: null,
      remaining: [],
      completedToday: [],
    };
  }
}

export interface RiderProfile {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isSuspended: boolean;
  isAvailable: boolean;
}

export interface RiderProfileResult extends ActionResult<RiderProfile> {
  stats?: RiderDashboardStats;
  history?: RiderDelivery[];
}

/** Rider's own profile + today's stats + delivery history. */
export async function getRiderProfile(): Promise<RiderProfileResult> {
  try {
    const user = await requireRider();

    const [profile] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        isSuspended: users.isSuspended,
        isAvailable: users.isAvailable,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!profile) return { success: false, error: "Profile not found" };

    const dashboard = await getRiderDashboard();

    const closed = await db
      .select(baseSelect)
      .from(shipments)
      .innerJoin(orders, eq(orders.id, shipments.orderId))
      .leftJoin(userAddresses, eq(userAddresses.id, orders.shippingAddressId))
      .leftJoin(
        shippingProviders,
        eq(shippingProviders.id, shipments.providerId)
      )
      .where(and(eq(shipments.riderId, user.id), eq(shipments.status, "delivered")))
      .orderBy(desc(shipments.deliveredAt))
      .limit(50);

    return {
      success: true,
      data: {
        ...profile,
        isSuspended: profile.isSuspended ?? false,
        isAvailable: profile.isAvailable ?? true,
      },
      stats: dashboard.stats,
      history: closed as RiderDelivery[],
    };
  } catch (error) {
    return { success: false, error: actionError("getRiderProfile", error) };
  }
}

/** Toggles the rider's own on/off-duty availability. */
export async function setMyAvailability(isAvailable: boolean): Promise<ActionResult> {
  try {
    const user = await requireRider();

    await db
      .update(users)
      .set({ isAvailable, updatedAt: new Date().toISOString() })
      .where(eq(users.id, user.id));

    revalidatePath("/rider/profile");
    return { success: true, message: isAvailable ? "You're on duty" : "You're off duty" };
  } catch (error) {
    return { success: false, error: actionError("setMyAvailability", error) };
  }
}
