import { and, db, deliveries, eq, orderItems, orders, payments, shipments } from "@workspace/db";
import { creditSellerOnDelivery } from "@workspace/db/wallet";

import type { CollectionMethod } from "./shipping-status";
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

interface CodCollectionInput {
  /** Amount the rider actually collected, in EGP. */
  amount: number;
  method: CollectionMethod;
  /** The authoritative expected amount — always server-computed, never from the client. */
  expectedAmount: number;
}

interface DeliveryEventInput {
  /** Structured reason code (see DELIVERY_FAILURE_REASONS), stored alongside the free-text reason. */
  reasonCode?: string;
  note?: string;
  collection?: CodCollectionInput;
}

interface ApplyStatusInput {
  orderId: string;
  status: ShippingStatus;
  failureReason?: string;
  /** The shipment row to update, or null to create one. */
  existingId: string | null;
  /** When set, the update is additionally scoped to this rider. */
  riderId?: string;
  /**
   * The status the caller observed before this call. When set, it's added to
   * the update's WHERE clause so a concurrent duplicate submit (double-tap,
   * retried request) finds zero matching rows and fails instead of silently
   * re-applying — critical for collectPayment, where a race would otherwise
   * record the same COD collection twice.
   */
  expectedFromStatus?: ShippingStatus;
  /** Logs a `deliveries` event (and, for a COD collection, a `payments` row) in the same transaction. */
  deliveryEvent?: DeliveryEventInput;
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
  expectedFromStatus,
  deliveryEvent,
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

    let shipmentId = existingId;

    if (existingId) {
      // The rider guard and the expected-from-status guard are both repeated
      // inside the transaction (not just checked beforehand) so a concurrent
      // reassignment or a duplicate submit (double-tap, retried request)
      // can't slip between the check and the write. A duplicate finds zero
      // matching rows here and fails below, rather than silently re-applying
      // — the property that makes collectPayment double-submit-safe.
      const guard = and(
        eq(shipments.id, existingId),
        ...(riderId ? [eq(shipments.riderId, riderId)] : []),
        ...(expectedFromStatus ? [eq(shipments.status, expectedFromStatus)] : [])
      );

      const updated = await tx
        .update(shipments)
        .set(shipmentPatch)
        .where(guard)
        .returning({ id: shipments.id });

      if (updated.length === 0) {
        throw new Error("Delivery not found or already updated");
      }
    } else {
      const [inserted] = await tx
        .insert(shipments)
        .values({ orderId, ...shipmentPatch })
        .returning({ id: shipments.id });
      shipmentId = inserted?.id ?? null;
    }

    // Mirror onto the order. `failed` leaves the order alone — a failed delivery
    // attempt does not cancel the customer's order and may be retried.
    const orderPatch: Record<string, string> = {};
    if (status === "out_for_delivery") {
      orderPatch.status = "out_for_delivery";
      orderPatch.shippedAt = now;
    } else if (status === "delivered") {
      orderPatch.status = "delivered";
      orderPatch.deliveredAt = now;
    } else if (status === "returned") {
      orderPatch.status = "returned";
    } else if (status === "cancelled") {
      orderPatch.status = "cancelled";
      orderPatch.cancelledAt = now;
    }

    // A confirmed COD collection sets payment status independently of
    // delivery status — being "delivered" never implies "paid" on its own.
    if (deliveryEvent?.collection) {
      orderPatch.paymentStatus = "collected";
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

    // Event log: one `deliveries` row per attempt/outcome, auditable by
    // order, rider, and timestamp — never overwritten.
    if (deliveryEvent && shipmentId) {
      const { reasonCode, note, collection } = deliveryEvent;

      await tx.insert(deliveries).values({
        shipmentId,
        driverId: riderId ?? null,
        status,
        deliveryNotes: note ?? failureReason ?? null,
        proofOfDelivery: {
          ...(reasonCode ? { reasonCode } : {}),
          ...(collection
            ? {
                codCollected: true,
                collectedAmount: collection.amount,
                expectedAmount: collection.expectedAmount,
                method: collection.method,
                discrepancy: collection.amount - collection.expectedAmount,
              }
            : {}),
        },
        startedAt: now,
        completedAt: now,
      });
    }

    if (deliveryEvent?.collection) {
      const { amount, method, expectedAmount } = deliveryEvent.collection;
      const discrepancy = amount - expectedAmount;

      await tx.insert(payments).values({
        orderId,
        amount: amount.toFixed(2),
        method,
        status: "collected",
        paymentData: {
          collectedBy: riderId ?? null,
          expectedAmount,
          discrepancy,
        },
        capturedAt: now,
      });
    }

    if (status === "delivered") {
      await creditSellerOnDelivery(tx, orderId);
    }
  });
}
