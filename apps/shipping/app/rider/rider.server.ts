"use server";

import {
  and,
  asc,
  db,
  desc,
  eq,
  orderItems,
  orders,
  shipments,
  shippingProviders,
  userAddresses,
} from "@workspace/db";

import { revalidatePath } from "next/cache";

import { actionError, type ActionResult } from "@/lib/action-result";
import { applyShipmentStatus } from "@/lib/apply-shipment-status";
import { requireRider } from "@/lib/auth";
import { canTransition, type ShippingStatus } from "@/lib/shipping-status";
import { riderUpdateStatusSchema } from "@/app/(admin)/orders/orders.dto";

export interface RiderDelivery {
  shipmentId: string;
  orderId: string;
  orderNumber: string;
  status: ShippingStatus;
  totalAmount: string;
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
}

export interface MyDeliveriesResult {
  success: boolean;
  error?: string;
  open: RiderDelivery[];
  closed: RiderDelivery[];
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
  totalAmount: orders.totalAmount,
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
};

/**
 * A rider's own deliveries. The rider id comes from the session — it is never
 * accepted as an argument, so there is no shape of request that returns
 * somebody else's work.
 */
export async function getMyDeliveries(): Promise<MyDeliveriesResult> {
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
      .orderBy(asc(shipments.status), desc(shipments.assignedAt));

    const data = rows as RiderDelivery[];

    return {
      success: true,
      open: data.filter((row) => OPEN_STATUSES.includes(row.status)),
      closed: data.filter((row) => !OPEN_STATUSES.includes(row.status)),
    };
  } catch (error) {
    return {
      success: false,
      error: actionError("getMyDeliveries", error),
      open: [],
      closed: [],
    };
  }
}

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
    const { shipmentId, status, failureReason } =
      riderUpdateStatusSchema.parse(input);

    const [owned] = await db
      .select({
        id: shipments.id,
        orderId: shipments.orderId,
        status: shipments.status,
      })
      .from(shipments)
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

    await applyShipmentStatus({
      orderId: owned.orderId,
      status,
      failureReason,
      existingId: owned.id,
      riderId: user.id,
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
