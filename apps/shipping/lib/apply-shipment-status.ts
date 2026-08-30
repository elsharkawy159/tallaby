import { and, db, eq, orderItems, orders, shipments } from "@workspace/db";
import { creditSellerOnDelivery } from "@workspace/db/wallet";

import type { ShippingStatus } from "./shipping-status";

const ORDER_ITEM_STATUS_BY_SHIPMENT: Partial<
  Record<ShippingStatus, (typeof orderItems.$inferSelect)["status"]>
> = {
  assigned: "shipping_soon",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  returned: "returned",
  cancelled: "cancelled",
};

interface ApplyStatusInput {
  orderId: string;
  status: ShippingStatus;
  failureReason?: string;
  /** The shipment row to update, or null to create one. */
  existingId: string | null;
  /** When set, the update is additionally scoped to this rider. */
  riderId?: string;
}

/**
 * Writes the shipment status and mirrors it onto the order in one transaction —
 * a shipment marked delivered while `orders.status` still reads "confirmed" is
 * exactly the inconsistency a transaction exists to prevent.
 *
 * Shared by the admin and rider actions so the two surfaces can never drift on
 * what "delivered" means.
 */
export async function applyShipmentStatus({
  orderId,
  status,
  failureReason,
  existingId,
  riderId,
}: ApplyStatusInput): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    const shipmentPatch = {
      status,
      failureReason: status === "failed" ? (failureReason ?? null) : null,
      updatedAt: now,
      ...(status === "out_for_delivery" ? { shippedAt: now } : {}),
      ...(status === "delivered" ? { deliveredAt: now } : {}),
    };

    if (existingId) {
      // The rider guard is repeated inside the transaction so the ownership
      // check and the write cannot be separated by a concurrent reassignment.
      const guard = riderId
        ? and(eq(shipments.id, existingId), eq(shipments.riderId, riderId))
        : eq(shipments.id, existingId);

      const updated = await tx
        .update(shipments)
        .set(shipmentPatch)
        .where(guard)
        .returning({ id: shipments.id });

      if (updated.length === 0) {
        throw new Error("Delivery not found");
      }
    } else {
      await tx.insert(shipments).values({ orderId, ...shipmentPatch });
    }

    // Mirror onto the order. `failed` and `cancelled` leave the order alone: a
    // failed delivery attempt does not cancel the customer's order.
    const orderPatch: Record<string, string> = {};
    if (status === "out_for_delivery") {
      orderPatch.status = "out_for_delivery";
      orderPatch.shippedAt = now;
    } else if (status === "delivered") {
      orderPatch.status = "delivered";
      orderPatch.deliveredAt = now;
    } else if (status === "returned") {
      orderPatch.status = "returned";
    }

    if (Object.keys(orderPatch).length > 0) {
      await tx
        .update(orders)
        .set({ ...orderPatch, updatedAt: now })
        .where(eq(orders.id, orderId));
    }

    const itemStatus = ORDER_ITEM_STATUS_BY_SHIPMENT[status];
    if (itemStatus) {
      await tx
        .update(orderItems)
        .set({
          status: itemStatus,
          updatedAt: now,
          ...(status === "out_for_delivery" ? { shippedAt: now } : {}),
          ...(status === "delivered" ? { deliveredAt: now } : {}),
          ...(status === "cancelled" ? { cancelledAt: now } : {}),
        })
        .where(eq(orderItems.orderId, orderId));
    }

    if (status === "delivered") {
      await creditSellerOnDelivery(tx, orderId);
    }
  });
}
