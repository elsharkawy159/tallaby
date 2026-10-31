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
  isNull,
  orderItems,
  orders,
  productVariants,
  shipments,
  sql,
  userWalletTransactions,
} from "@workspace/db";
import { cancelPendingAffiliateCommission, reverseAffiliateCommission } from "@workspace/db/affiliates";
import {
  decrementStock,
  InsufficientStockError,
  restoreStock,
  type StockLine,
  type StockResult,
} from "@workspace/db/inventory";
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
import { BULK_MAX_ORDERS, BULK_ORDER_ACTIONS } from "./orders-bulk.lib";

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
  const stockLines = orderStockLines(order);

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

    const results = await restoreStock(tx, stockLines, { reason: "cancel", orderId: order.id, actorId: sellerId });
    await cancelPendingAffiliateCommission(tx, order.id);
    return results;
  });

  await invalidateOrderStock(order, stockResults);
  await sendOrderEventEmail(order.id, "cancelled", "seller");
}

function orderStockLines(order: LoadedOrder["order"]): StockLine[] {
  return order.orderItems.map((item) =>
    item.variantId
      ? { kind: "variant" as const, id: item.variantId, quantity: item.quantity }
      : { kind: "product" as const, id: item.productId, quantity: item.quantity },
  );
}

async function invalidateOrderStock(order: LoadedOrder["order"], stockResults: StockResult[]) {
  if (stockResults.length === 0) return;
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
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * A cancelled order's stock went back on the shelf, so moving it back on its
 * way takes the stock again. Untracked (null-stock) variants are skipped, as
 * restoreStock skips them. Not enough stock stops the move.
 */
async function takeStockAgain(tx: Tx, order: LoadedOrder["order"], sellerId: string): Promise<StockResult[]> {
  const lines = orderStockLines(order);
  const variantIds = lines.filter((l) => l.kind === "variant").map((l) => l.id);
  const untracked = new Set<string>();
  if (variantIds.length > 0) {
    const rows = await tx
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(and(inArray(productVariants.id, variantIds), isNull(productVariants.stock)));
    for (const r of rows) untracked.add(r.id);
  }
  try {
    return await decrementStock(
      tx,
      lines.filter((l) => !(l.kind === "variant" && untracked.has(l.id))),
      { reason: "order", orderId: order.id, actorId: sellerId },
    );
  } catch (error) {
    if (error instanceof InsufficientStockError) throw new OrderActionError("outOfStock");
    throw error;
  }
}

/** Shipment status each status change on a closed order lands on ("reopen" has its own write). */
const CORRECTION_SHIPMENT_STATUS: Partial<Record<SellerOrderAction, ShippingStatus>> = {
  ...ACTION_SHIPMENT_STATUS,
  cancel: "cancelled",
};

/**
 * Moves a closed order (delivered, returned, cancelled) to another status
 * (owner, 2026-10-31). Stock follows "cancelled": it goes back on the shelf
 * when the order is cancelled and is taken again when it leaves cancelled.
 * No money moves here: leaving "delivered" keeps the delivery fee entry, and
 * delivering again never posts it twice (its claim is per order).
 */
async function correctClosedOrder(
  loaded: LoadedOrder,
  sellerId: string,
  action: SellerOrderAction,
  reason: string | undefined,
) {
  const { order } = loaded;
  const wasCancelled = loaded.flow.stage === "cancelled";
  let stockResults: StockResult[] = [];

  if (action === "reopen") {
    stockResults = await reopenOrder(loaded, sellerId, wasCancelled);
  } else {
    const status = CORRECTION_SHIPMENT_STATUS[action];
    if (!status) throw new OrderActionError("notAllowed");
    await moveShipment(loaded, sellerId, status, reason, async (tx) => {
      if (wasCancelled) {
        stockResults = await takeStockAgain(tx, order, sellerId);
      } else if (status === "cancelled") {
        stockResults = await restoreStock(tx, orderStockLines(order), {
          reason: "cancel",
          orderId: order.id,
          actorId: sellerId,
        });
        // A delivered order's commission may already be scheduled, not just pending.
        await reverseAffiliateCommission(tx, order.id);
      }
    });
  }

  await invalidateOrderStock(order, stockResults);
}

/** Back to "ready to ship": order and lines confirmed, shipment pending. */
async function reopenOrder(
  { order, shipment }: LoadedOrder,
  sellerId: string,
  wasCancelled: boolean,
): Promise<StockResult[]> {
  const now = new Date().toISOString();
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(orders)
      .set({ status: "confirmed", updatedAt: now })
      .where(and(eq(orders.id, order.id), eq(orders.status, order.status ?? "pending")))
      .returning({ id: orders.id });
    if (updated.length === 0) throw new OrderActionError("alreadyUpdated");

    await tx
      .update(orderItems)
      .set({ status: "confirmed", updatedAt: now })
      .where(and(eq(orderItems.orderId, order.id), eq(orderItems.sellerId, sellerId)));

    if (shipment) {
      const moved = await tx
        .update(shipments)
        .set({ status: "pending", failureReason: null, updatedAt: now })
        .where(
          and(
            eq(shipments.id, shipment.id),
            eq(shipments.sellerId, sellerId),
            eq(shipments.status, shipment.status),
          ),
        )
        .returning({ id: shipments.id });
      if (moved.length === 0) throw new OrderActionError("alreadyUpdated");
    }

    return wasCancelled ? takeStockAgain(tx, order, sellerId) : [];
  });
}

async function moveShipment(
  { order, shipment }: LoadedOrder,
  sellerId: string,
  status: ShippingStatus,
  reason: string | undefined,
  inTransaction?: (tx: Tx) => Promise<void>,
) {
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
      inTransaction,
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
 * Status changes on a closed order run one order at a time only, so a bulk
 * move never reopens delivered or cancelled orders.
 */
async function runSellerOrderAction(
  sellerId: string,
  orderId: string,
  action: SellerOrderAction,
  reason: string | undefined,
  { allowCorrections = false }: { allowCorrections?: boolean } = {},
) {
  const loaded = await loadOrder(orderId, sellerId);

  if (loaded.flow.readOnly) throw new OrderActionError(`readOnly.${loaded.flow.readOnly}`);
  if (!loaded.flow.actions.includes(action)) {
    if (allowCorrections && loaded.flow.corrections.includes(action)) {
      await correctClosedOrder(loaded, sellerId, action, reason);
      return;
    }
    throw new OrderActionError("notAllowed");
  }

  if (action === "confirm") {
    await confirmOrder(loaded, sellerId);
    // Stores set to "ship with Bosta when I confirm" (BS-09): after the response, so the seller never waits on Bosta.
    const storeId = loaded.order.storeId;
    if (storeId) {
      after(() => autoShipOrderWithBosta(storeId, orderId, sellerId));
    }
  }
  else if (action === "cancel") await cancelOrder(loaded, sellerId);
  else {
    const status = ACTION_SHIPMENT_STATUS[action];
    if (!status) throw new OrderActionError("notAllowed");
    await moveShipment(loaded, sellerId, status, reason);
  }
}

export async function updateSellerOrder(input: unknown): Promise<ActionResult> {
  const t = await getTranslations("orders.errors");
  try {
    const { sellerId } = await requireSeller();
    const { orderId, action, reason } = inputSchema.parse(input);
    await runSellerOrderAction(sellerId, orderId, action, reason, { allowCorrections: true });

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

const bulkInputSchema = z.object({
  orderIds: z.array(z.uuid()).min(1).max(BULK_MAX_ORDERS),
  action: z.enum(BULK_ORDER_ACTIONS),
});

type BulkResult = { success: true; done: number; skipped: number } | { success: false; error: string };

/**
 * One stage move on many orders (ROADMAP.md F-04c). Each order goes through
 * the same checks and write as its own button, one at a time, so an order
 * that changed meanwhile or isn't the seller's is skipped, never forced.
 */
export async function bulkUpdateSellerOrders(input: unknown): Promise<BulkResult> {
  const t = await getTranslations("orders.errors");
  try {
    const { sellerId } = await requireSeller();
    const { orderIds, action } = bulkInputSchema.parse(input);

    let done = 0;
    let skipped = 0;
    for (const orderId of new Set(orderIds)) {
      try {
        await runSellerOrderAction(sellerId, orderId, action, undefined);
        done += 1;
      } catch (error) {
        if (!(error instanceof OrderActionError)) console.error("bulkUpdateSellerOrders:", orderId, error);
        skipped += 1;
      }
    }

    if (done > 0) revalidatePath("/orders", "layout");
    return { success: true, done, skipped };
  } catch (error) {
    if (error instanceof AccessError) return { success: false, error: t("unauthorized") };
    if (error instanceof z.ZodError) return { success: false, error: t("invalid") };
    console.error("bulkUpdateSellerOrders:", error);
    return { success: false, error: t("generic") };
  }
}
