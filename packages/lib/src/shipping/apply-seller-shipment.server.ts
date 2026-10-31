import { and, db, eq, orderItems, orders, shipments } from "@workspace/db";
import { creditSellerOnDelivery } from "@workspace/db/wallet";
import { sendOrderEventEmail, type OrderEmailEvent } from "../orders";
import { sendDeliveredMetaPurchase } from "../integrations/meta-tracking.server";
import {
  cancelPendingAffiliateCommission,
  reverseAffiliateCommission,
  scheduleAffiliateCommissionRelease,
} from "@workspace/db/affiliates";

import type { ShippingStatus } from "./shipment-status.lib";

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
  /**
   * null when the seller ships without a rider and no shipment exists yet: a
   * `carrier: "seller"` shipment is created at `pending` inside the same
   * transaction, so it never sits half-made at `pending` on its own.
   */
  shipmentId: string | null;
  status: ShippingStatus;
  /** Status the caller observed; guards against a double-submit re-applying. */
  expectedFromStatus: ShippingStatus;
  failureReason?: string;
  /**
   * Extra writes that must commit with the status (e.g. taking stock again
   * when a seller moves a cancelled order back on its way). Runs last, inside
   * the same transaction.
   */
  inTransaction?: (tx: Tx) => Promise<void>;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Seller-side counterpart of apps/shipping/lib/apply-shipment-status.ts (used by
 * the dashboard and by the Bosta webhook and sync, plan BS-04):
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
  inTransaction,
}: Input): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    let id = shipmentId;
    if (!id) {
      if (expectedFromStatus !== "pending") {
        throw new Error("Shipment was already updated. Refresh and try again.");
      }
      const [created] = await tx
        .insert(shipments)
        .values({ orderId, sellerId, carrier: "seller", status: "pending", updatedAt: now })
        .onConflictDoNothing({ target: shipments.orderId })
        .returning({ id: shipments.id });
      if (!created) {
        throw new Error("Shipment was already updated. Refresh and try again.");
      }
      id = created.id;
    }

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
          eq(shipments.id, id),
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

    if (inTransaction) await inTransaction(tx);
  });

  // Customer mail once the status is committed (best-effort, once per order).
  // A seller cancel tells the customer; the seller themself gets no email.
  const emailEvent = SHIPMENT_EMAIL_EVENTS[status];
  if (emailEvent) await sendOrderEventEmail(orderId, emailEvent, "seller");
  // The store's Meta Purchase on delivery (F-30a); a no-op unless deferred, never throws.
  if (status === "delivered") await sendDeliveredMetaPurchase(orderId);
}

/** "Out for delivery" is when the parcel actually leaves with the courier. */
const SHIPMENT_EMAIL_EVENTS: Partial<Record<ShippingStatus, OrderEmailEvent>> = {
  out_for_delivery: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};
