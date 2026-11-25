/**
 * A shopper's confirm or cancel from outside the store: the WhatsApp quick
 * replies (ROADMAP.md F-109, docs/whatsapp.md §4 Buttons). The order, store
 * and seller come from our own whatsapp_messages row, never from the shopper.
 *
 * The writes are the existing ones, with their guards:
 * - confirm = the dashboard's confirm (apps/dashboard orders.server.ts
 *   `confirmOrder`): `pending` → `confirmed` with `processed_at`, the seller's
 *   pending lines → `confirmed`, then Bosta auto-ship (`autoShipOrderWithBosta`,
 *   a no-op unless the store ships on confirm). No email, as there.
 * - cancel = the store's customer cancel (apps/ecommerce actions/order.ts
 *   `cancelOrder`): status guard, every line cancelled, stock back (unless a
 *   test order), pending affiliate commission dropped, cache purge, then the
 *   "cancelled" email by the customer. Only for orders with no money taken
 *   and no shipment (customer-order-actions.lib.ts), so no refund path runs.
 *
 * A repeated tap answers `already`; an order that moved on answers `refused`.
 */
import { invalidateProductInventory } from "@workspace/cache/invalidate";
import { broadcastInvalidation } from "@workspace/cache/broadcast";
import {
  and,
  db,
  eq,
  inArray,
  orderItems,
  orders,
  shipments,
  sql,
  stores,
  userWalletTransactions,
} from "@workspace/db";
import { cancelPendingAffiliateCommission } from "@workspace/db/affiliates";
import { restoreStock, type StockLine, type StockResult } from "@workspace/db/inventory";
import { orderMovesStock, WALLET_REFERENCE_TYPES } from "@workspace/db/wallet";
import { autoShipOrderWithBosta } from "../shipping/bosta-ship.server";
import {
  BUTTON_CANCELLABLE_STATUSES,
  customerCanCancel,
  customerCanConfirm,
  type CustomerOrderActionResult,
} from "./customer-order-actions.lib";
import { sendOrderEventEmail } from "./notify";

export interface CustomerOrderRef {
  orderId: string;
  /** The store the message was sent for; the order must still belong to it. */
  storeId: string;
  /** The store's owner (the message row's seller). */
  sellerId: string;
}

class AlreadyMoved extends Error {}

async function loadOrder({ orderId, storeId, sellerId }: CustomerOrderRef) {
  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      isTest: orders.isTest,
      isDigitalOnly: orders.isDigitalOnly,
      depositStatus: orders.depositStatus,
      storeId: orders.storeId,
      foreignLines: sql<number>`(SELECT count(*)::int FROM ${orderItems} oi WHERE oi.order_id = ${orders.id} AND oi.seller_id IS DISTINCT FROM ${sellerId})`,
    })
    .from(orders)
    .innerJoin(stores, and(eq(stores.id, orders.storeId), eq(stores.sellerId, sellerId)))
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
    .limit(1);
  return order ?? null;
}

async function loadShipments(orderId: string) {
  return db
    .select({ status: shipments.status, externalId: shipments.externalId })
    .from(shipments)
    .where(eq(shipments.orderId, orderId));
}

/** `pending` → `confirmed`, as the seller's Confirm button does, then Bosta auto-ship. */
export async function confirmOrderByCustomer(ref: CustomerOrderRef): Promise<CustomerOrderActionResult> {
  const order = await loadOrder(ref);
  if (!order) return "not_found";
  if (order.status === "confirmed") return "already";
  const shipmentRows = await loadShipments(order.id);
  const allowed = customerCanConfirm({
    status: order.status,
    isTest: order.isTest,
    isDigitalOnly: order.isDigitalOnly,
    depositStatus: order.depositStatus,
    foreignLines: order.foreignLines,
    carrierManaged: shipmentRows.some((s) => Boolean(s.externalId)),
  });
  if (!allowed) return "refused";

  const now = new Date().toISOString();
  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(orders)
        .set({ status: "confirmed", processedAt: now, updatedAt: now })
        .where(and(eq(orders.id, order.id), eq(orders.status, "pending")))
        .returning({ id: orders.id });
      if (updated.length === 0) throw new AlreadyMoved();
      await tx
        .update(orderItems)
        .set({ status: "confirmed", updatedAt: now })
        .where(and(eq(orderItems.orderId, order.id), eq(orderItems.sellerId, ref.sellerId), eq(orderItems.status, "pending")));
    });
  } catch (error) {
    if (!(error instanceof AlreadyMoved)) throw error;
    const [current] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, order.id));
    return current?.status === "confirmed" ? "already" : "refused";
  }

  // Stores set to "ship with Bosta when I confirm" (BS-09); never throws.
  await autoShipOrderWithBosta(ref.storeId, order.id, ref.sellerId);
  return "confirmed";
}

/** The store's customer cancel, for orders with nothing paid and nothing shipped. */
export interface CancelByCustomerOptions {
  /**
   * Sends the "cancelled" mail by the customer. Defaults to the internal
   * backend call (sendOrderEventEmail); the backend itself passes its own
   * senders, since it has no route to itself.
   */
  sendCancelledEmail?: (orderId: string) => Promise<unknown>;
}

export async function cancelOrderByCustomer(
  ref: CustomerOrderRef,
  { sendCancelledEmail = (id) => sendOrderEventEmail(id, "cancelled", "customer") }: CancelByCustomerOptions = {},
): Promise<CustomerOrderActionResult> {
  const order = await loadOrder(ref);
  if (!order) return "not_found";
  if (order.status === "cancelled") return "already";

  const [walletDebit] = await db
    .select({ id: userWalletTransactions.id })
    .from(userWalletTransactions)
    .where(
      and(
        eq(userWalletTransactions.referenceType, WALLET_REFERENCE_TYPES.order),
        eq(userWalletTransactions.referenceId, order.id),
        eq(userWalletTransactions.type, "order_payment"),
        eq(userWalletTransactions.status, "completed"),
      ),
    )
    .limit(1);
  const shipmentRows = await loadShipments(order.id);
  const allowed = customerCanCancel({
    status: order.status,
    isTest: order.isTest,
    paymentStatus: order.paymentStatus,
    depositStatus: order.depositStatus,
    walletPaid: Boolean(walletDebit),
    hasOpenShipment: shipmentRows.some((s) => s.status !== "cancelled"),
  });
  if (!allowed) return "refused";

  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, order.id),
    columns: { productId: true, variantId: true, quantity: true, sellerId: true },
    with: { product: { columns: { categoryId: true, brandId: true } } },
  });

  const now = new Date().toISOString();
  let stockResults: StockResult[] = [];
  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(orders)
        .set({ status: "cancelled", cancelledAt: now, updatedAt: now })
        .where(
          and(
            eq(orders.id, order.id),
            inArray(orders.status, [...BUTTON_CANCELLABLE_STATUSES]),
            sql`coalesce(${orders.paymentStatus}::text, 'pending') not in ('paid', 'collected')`,
            sql`${orders.depositStatus} IS DISTINCT FROM 'paid'`,
          ),
        )
        .returning({ id: orders.id });
      if (updated.length === 0) throw new AlreadyMoved();

      await tx
        .update(orderItems)
        .set({ status: "cancelled", cancelledAt: now, updatedAt: now })
        .where(eq(orderItems.orderId, order.id));

      const stockLines: StockLine[] = items.map((item) =>
        item.variantId
          ? { kind: "variant" as const, id: item.variantId, quantity: item.quantity }
          : { kind: "product" as const, id: item.productId, quantity: item.quantity },
      );
      // A test order never took stock (F-76), so nothing goes back.
      if (orderMovesStock(order)) {
        stockResults = await restoreStock(tx, stockLines, { reason: "cancel", orderId: order.id, actorId: order.userId });
      }
      await cancelPendingAffiliateCommission(tx, order.id);
    });
  } catch (error) {
    if (!(error instanceof AlreadyMoved)) throw error;
    const [current] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, order.id));
    return current?.status === "cancelled" ? "already" : "refused";
  }

  if (stockResults.length > 0) {
    const inventory = invalidateProductInventory(
      stockResults.map((r) => {
        const item = items.find((i) => (i.variantId ?? i.productId) === r.id)!;
        return {
          snapshot: {
            id: item.productId,
            sellerId: item.sellerId,
            storeId: order.storeId ?? null,
            categoryId: item.product?.categoryId ?? null,
            brandId: item.product?.brandId ?? null,
          },
          stockBoundaryCrossed: r.stockBoundaryCrossed,
        };
      }),
    );
    await broadcastInvalidation(inventory, "backend");
  }

  // The customer's and the seller's cancellation mail (the backend sends each once).
  await sendCancelledEmail(order.id).catch((error) => console.error("[orders] cancel email failed", order.id, (error as Error)?.name));
  return "cancelled";
}
