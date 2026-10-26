"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { applyInvalidation, invalidateProductInventory } from "@workspace/cache";
import {
  and,
  db,
  eq,
  inArray,
  orderItems,
  orders,
  shipments,
  sql,
  userWalletTransactions,
} from "@workspace/db";
import { cancelPendingAffiliateCommission } from "@workspace/db/affiliates";
import { restoreStock, type StockLine } from "@workspace/db/inventory";
import { WALLET_REFERENCE_TYPES } from "@workspace/db/wallet";
import { sendOrderEventEmail } from "@workspace/lib/orders";
import { autoShipOrderWithBosta } from "@workspace/lib/shipping/bosta-ship";
import { AccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { applySellerShipmentStatus } from "@/lib/shipping/apply-seller-shipment";
import { isShippingStatus, type ShippingStatus } from "@/lib/shipping/shipping-status";
import {
  ACTION_SHIPMENT_STATUS,
  isSellerHandledLine,
  resolveSellerOrderFlow,
  SELLER_ORDER_ACTIONS,
  type SellerOrderAction,
} from "./order-flow.lib";

type ActionResult = { success: true } | { success: false; error: string };

/** An error the seller should read; `key` lives in "orders.errors". */
class OrderActionError extends Error {
  constructor(readonly key: string) {
    super(key);
  }
}

const inputSchema = z.object({
  orderId: z.uuid(),
  action: z.enum(SELLER_ORDER_ACTIONS),
  reason: z.string().trim().max(500).optional(),
});

/** Statuses an order can be cancelled from: nothing has left yet. */
const CANCELLABLE_ORDER_STATUSES = ["pending", "confirmed", "shipping_soon", "shipped"] as const;
const CANCELLABLE_SHIPMENT_STATUSES = ["pending", "assigned"] as const;

/** Loads the order with everything the flow needs, scoped to this seller. */
async function loadOrder(orderId: string, sellerId: string) {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.id, orderId),
      inArray(
        orders.id,
        db.select({ id: orderItems.orderId }).from(orderItems).where(eq(orderItems.sellerId, sellerId)),
      ),
    ),
    columns: { id: true, status: true, paymentStatus: true, isDigitalOnly: true, storeId: true },
    with: {
      shipments: { columns: { id: true, status: true, sellerId: true, externalId: true } },
      orderItems: {
        columns: {
          id: true,
          sellerId: true,
          productId: true,
          variantId: true,
          quantity: true,
          fulfillmentType: true,
        },
        with: { product: { columns: { categoryId: true, brandId: true } } },
      },
    },
  });
  if (!order) throw new OrderActionError("notFound");

  const [walletDebit] = await db
    .select({ id: userWalletTransactions.id })
    .from(userWalletTransactions)
    .where(
      and(
        eq(userWalletTransactions.referenceType, WALLET_REFERENCE_TYPES.order),
        eq(userWalletTransactions.referenceId, orderId),
        eq(userWalletTransactions.type, "order_payment"),
        eq(userWalletTransactions.status, "completed"),
      ),
    )
    .limit(1);

  const shipment = order.shipments[0] ?? null;
  const flow = resolveSellerOrderFlow({
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    isDigitalOnly: order.isDigitalOnly,
    allLinesOwned: order.orderItems.every((i) => i.sellerId === sellerId),
    sellerFulfilled: order.orderItems.some(
      (i) => i.sellerId === sellerId && isSellerHandledLine(i.fulfillmentType),
    ),
    shipment: shipment
      ? { status: shipment.status, ownedBySeller: shipment.sellerId === sellerId, carrierManaged: Boolean(shipment.externalId) }
      : null,
    walletPaid: Boolean(walletDebit),
  });

  return { order, shipment, flow };
}

type LoadedOrder = Awaited<ReturnType<typeof loadOrder>>;

async function confirmOrder({ order }: LoadedOrder, sellerId: string) {
  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(orders)
      .set({ status: "confirmed", processedAt: now, updatedAt: now })
      .where(and(eq(orders.id, order.id), eq(orders.status, "pending")))
      .returning({ id: orders.id });
    if (updated.length === 0) throw new OrderActionError("alreadyUpdated");

    await tx
      .update(orderItems)
      .set({ status: "confirmed", updatedAt: now })
      .where(
        and(
          eq(orderItems.orderId, order.id),
          eq(orderItems.sellerId, sellerId),
          eq(orderItems.status, "pending"),
        ),
      );
  });
}

/**
 * Cancels an order that hasn't left yet and wasn't paid in advance (the flow
 * hides cancel on prepaid orders; the guards here repeat it). Restocks the
 * lines and drops pending affiliate commission, like a customer cancel. No
 * money moves: nothing was collected.
 */
async function cancelOrder({ order, shipment }: LoadedOrder, sellerId: string) {
  const now = new Date().toISOString();
  const stockLines: StockLine[] = order.orderItems.map((item) =>
    item.variantId
      ? { kind: "variant" as const, id: item.variantId, quantity: item.quantity }
      : { kind: "product" as const, id: item.productId, quantity: item.quantity },
  );

  const stockResults = await db.transaction(async (tx) => {
    const updated = await tx
      .update(orders)
      .set({ status: "cancelled", cancelledAt: now, updatedAt: now })
      .where(
        and(
          eq(orders.id, order.id),
          inArray(orders.status, [...CANCELLABLE_ORDER_STATUSES]),
          sql`coalesce(${orders.paymentStatus}::text, 'pending') not in ('paid', 'collected')`,
        ),
      )
      .returning({ id: orders.id });
    if (updated.length === 0) throw new OrderActionError("alreadyUpdated");

    await tx
      .update(orderItems)
      .set({ status: "cancelled", cancelledAt: now, updatedAt: now })
      .where(and(eq(orderItems.orderId, order.id), eq(orderItems.sellerId, sellerId)));

    if (shipment) {
      const cancelled = await tx
        .update(shipments)
        .set({ status: "cancelled", updatedAt: now })
        .where(
          and(
            eq(shipments.id, shipment.id),
            eq(shipments.sellerId, sellerId),
            inArray(shipments.status, [...CANCELLABLE_SHIPMENT_STATUSES]),
          ),
        )
        .returning({ id: shipments.id });
      if (cancelled.length === 0) throw new OrderActionError("alreadyUpdated");
    }

    const results = await restoreStock(tx, stockLines);
    await cancelPendingAffiliateCommission(tx, order.id);
    return results;
  });

  await applyInvalidation(
    invalidateProductInventory(
      stockResults.map((r) => {
        const item = order.orderItems.find((i) => (i.variantId ?? i.productId) === r.id)!;
        return {
          snapshot: {
            id: item.productId,
            sellerId: item.sellerId,
            categoryId: item.product?.categoryId ?? null,
            brandId: item.product?.brandId ?? null,
          },
          stockBoundaryCrossed: r.stockBoundaryCrossed,
        };
      }),
    ),
    { from: "dashboard", mode: "action" },
  );
  await sendOrderEventEmail(order.id, "cancelled", "seller");
}

async function moveShipment(
  { order, shipment }: LoadedOrder,
  sellerId: string,
  action: SellerOrderAction,
  reason: string | undefined,
) {
  const status = ACTION_SHIPMENT_STATUS[action]!;
  if (status === "failed" && !reason) throw new OrderActionError("reasonRequired");
  const from: ShippingStatus =
    shipment && isShippingStatus(shipment.status) ? shipment.status : "pending";

  try {
    await applySellerShipmentStatus({
      orderId: order.id,
      sellerId,
      shipmentId: shipment?.id ?? null,
      status,
      expectedFromStatus: from,
      failureReason: reason,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Shipment was already updated")) {
      throw new OrderActionError("alreadyUpdated");
    }
    throw error;
  }
}

/**
 * The one write behind every order button on /orders. The seller id comes
 * from the session; the order must have a line of theirs, and the move must
 * be one resolveSellerOrderFlow allows for the order as stored right now.
 */
export async function updateSellerOrder(input: unknown): Promise<ActionResult> {
  const t = await getTranslations("orders.errors");
  try {
    const { sellerId } = await requireSeller();
    const { orderId, action, reason } = inputSchema.parse(input);
    const loaded = await loadOrder(orderId, sellerId);

    if (loaded.flow.readOnly) throw new OrderActionError(`readOnly.${loaded.flow.readOnly}`);
    if (!loaded.flow.actions.includes(action)) throw new OrderActionError("notAllowed");

    if (action === "confirm") {
      await confirmOrder(loaded, sellerId);
      // Stores set to "ship with Bosta when I confirm" (BS-09): after the response, so the seller never waits on Bosta.
      const storeId = loaded.order.storeId;
      if (storeId) {
        after(() => autoShipOrderWithBosta(storeId, orderId, sellerId));
      }
    }
    else if (action === "cancel") await cancelOrder(loaded, sellerId);
    else await moveShipment(loaded, sellerId, action, reason);

    revalidatePath("/orders", "layout");
    return { success: true };
  } catch (error) {
    if (error instanceof OrderActionError) return { success: false, error: t(error.key) };
    if (error instanceof AccessError) return { success: false, error: t("unauthorized") };
    if (error instanceof z.ZodError) return { success: false, error: t("invalid") };
    console.error("updateSellerOrder:", error);
    return { success: false, error: t("generic") };
  }
}
