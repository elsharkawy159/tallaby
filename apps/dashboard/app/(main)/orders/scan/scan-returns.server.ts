"use server";

import { and, db, eq, inArray, orderItems, orders } from "@workspace/db";
import { AccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { isSellerHandledLine, resolveSellerOrderFlow } from "../order-flow.lib";
import { parseScannedOrderNumber } from "./scan-returns.lib";
import type { ScanLookupResult } from "./scan-returns.types";

/**
 * Orders › Scan returns (ROADMAP.md F-04e): finds an order by the number read
 * from its barcode (or typed), only among the session seller's orders (an
 * order with at least one of their lines, the same rule as updateSellerOrder),
 * and says whether the existing "Mark returned" step is open for it. Read
 * only: marking it returned goes through updateSellerOrder (action "return"),
 * which loads and checks the order again. The client sends only the code.
 */
export async function findOrderForReturnScan(code: unknown): Promise<ScanLookupResult> {
  const orderNumber = parseScannedOrderNumber(code);
  if (!orderNumber) return { ok: false, error: "invalid" };
  try {
    const { sellerId } = await requireSeller();
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.orderNumber, orderNumber),
        inArray(
          orders.id,
          db.select({ id: orderItems.orderId }).from(orderItems).where(eq(orderItems.sellerId, sellerId)),
        ),
      ),
      columns: { id: true, orderNumber: true, createdAt: true, status: true, paymentStatus: true, isDigitalOnly: true },
      with: {
        user: { columns: { fullName: true, phone: true } },
        userAddress_shippingAddressId: { columns: { fullName: true, phone: true } },
        store: { columns: { name: true, sellerId: true } },
        shipments: { columns: { status: true, sellerId: true, externalId: true } },
        orderItems: { columns: { sellerId: true, fulfillmentType: true, productName: true, quantity: true, total: true } },
      },
    });
    if (!order) return { ok: false, error: "notFound" };

    const mine = order.orderItems.filter((i) => i.sellerId === sellerId);
    const shipment = order.shipments[0] ?? null;
    const flow = resolveSellerOrderFlow({
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      isDigitalOnly: order.isDigitalOnly,
      allLinesOwned: order.orderItems.every((i) => i.sellerId === sellerId),
      sellerFulfilled: mine.some((i) => isSellerHandledLine(i.fulfillmentType)),
      shipment: shipment
        ? { status: shipment.status, ownedBySeller: shipment.sellerId === sellerId, carrierManaged: Boolean(shipment.externalId) }
        : null,
      // Only changes whether "cancel" is offered; "return" does not depend on it.
      walletPaid: false,
    });

    const address = order.userAddress_shippingAddressId;
    const total = mine.reduce((sum, i) => sum + Math.round(Number(i.total ?? 0) * 100), 0);
    return {
      ok: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        stage: flow.stage,
        customerName: address?.fullName?.trim() || order.user?.fullName?.trim() || null,
        customerPhone: address?.phone?.trim() || order.user?.phone?.trim() || null,
        itemsSummary: mine.map((i) => `${i.quantity ?? 1}× ${i.productName}`).join(" · "),
        itemCount: mine.reduce((n, i) => n + (i.quantity ?? 1), 0),
        total: (total / 100).toFixed(2),
        // The store name only when the store is this seller's (marketplace orders have none).
        storeName: order.store && order.store.sellerId === sellerId ? order.store.name : null,
        canReturn: flow.actions.includes("return"),
        readOnly: flow.readOnly,
        carrierManaged: flow.carrierManaged,
      },
    };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: "unauthorized" };
    console.error("findOrderForReturnScan:", error);
    return { ok: false, error: "generic" };
  }
}
