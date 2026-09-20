import { and, db, eq, orderItems, orders, shipments } from "@workspace/db";
import { creditSellerOnDelivery } from "@workspace/db/wallet";
import {
  cancelPendingAffiliateCommission,
  reverseAffiliateCommission,
  scheduleAffiliateCommissionRelease,
} from "@workspace/db/affiliates";

import type { ShippingStatus } from "./shipping-status";

const ORDER_ITEM_STATUS: Partial<
  Record<ShippingStatus, (typeof orderItems.$inferSelect)["status"]>
> = {
  assigned: "shipping_soon",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  returned: "returned",
  cancelled: "cancelled",
};

interface Input {
  orderId: string;
  sellerId: string;
  shipmentId: string;
  status: ShippingStatus;
  /** Status the caller observed; guards against a double-submit re-applying. */
  expectedFromStatus: ShippingStatus;
  failureReason?: string;
}

/**
 * Seller-side counterpart of apps/shipping/lib/apply-shipment-status.ts:
 * writes the shipment status and mirrors it onto the order, its items, the
 * seller wallet and affiliate commissions in ONE transaction, so "delivered"
 * means exactly the same thing whichever tool set it.
 */
export async function applySellerShipmentStatus({
  orderId,
  sellerId,
  shipmentId,
  status,
  expectedFromStatus,
  failureReason,
}: Input): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(shipments)
      .set({
        status,
        failureReason: status === "failed" ? (failureReason ?? null) : null,
        updatedAt: now,
        ...(status === "out_for_delivery" ? { shippedAt: now } : {}),
        ...(status === "delivered" ? { deliveredAt: now } : {}),
      })
      .where(
        and(
          eq(shipments.id, shipmentId),
          eq(shipments.sellerId, sellerId),
          eq(shipments.status, expectedFromStatus)
        )
      )
      .returning({ id: shipments.id });

    if (updated.length === 0) {
      throw new Error("Shipment was already updated. Refresh and try again.");
    }

    // A failed attempt leaves the order alone — it may be retried.
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

    if (Object.keys(orderPatch).length > 0) {
      await tx
        .update(orders)
        .set({ ...orderPatch, updatedAt: now })
        .where(eq(orders.id, orderId));
    }

    const itemStatus = ORDER_ITEM_STATUS[status];
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
        .where(and(eq(orderItems.orderId, orderId), eq(orderItems.sellerId, sellerId)));
    }

    if (status === "delivered") {
      await creditSellerOnDelivery(tx, orderId);
      await scheduleAffiliateCommissionRelease(tx, orderId);
    } else if (status === "returned") {
      await reverseAffiliateCommission(tx, orderId);
      await cancelPendingAffiliateCommission(tx, orderId);
    } else if (status === "cancelled") {
      await cancelPendingAffiliateCommission(tx, orderId);
    }
  });
}
