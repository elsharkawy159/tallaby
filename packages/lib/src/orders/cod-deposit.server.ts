/**
 * COD deposit (عربون) on the server, ROADMAP.md F-21 (owner approval 2026-11-12).
 *
 * - `confirmOrderDeposit` / `rejectOrderDeposit`: the seller's "Deposit
 *   received" / "Not received" on a transfer, store-scoped (the order's store
 *   must be the seller's and every line theirs), status-guarded, idempotent.
 * - `markDepositReported`: the customer said they sent it (with or without a
 *   screenshot); the bell tells the seller.
 * - `expireUnpaidDeposits`: the 48 h cron. Cancels orders still `awaiting`
 *   through the same steps as every other cancel (status, lines, shipment,
 *   stock back with reason `cancel`, pending affiliate commission dropped).
 *
 * No money moves anywhere here: the deposit is paid to the seller's own
 * account, and the platform fee was taken when the order was created, as for
 * any COD order (PLAN.md §13.1).
 */
import {
  and,
  db,
  eq,
  inArray,
  isNotNull,
  orderItems,
  orders,
  sellerNotifications,
  shipments,
  sql,
  stores,
} from "@workspace/db";
import { cancelPendingAffiliateCommission } from "@workspace/db/affiliates";
import { restoreStock, type StockLine } from "@workspace/db/inventory";
import { depositCutoff } from "./cod-deposit.lib";
import { sendOrderEventEmail } from "./notify";

export type DepositActionError = "not_found" | "not_pending" | "already_paid";

type DepositOrder = { id: string; orderNumber: string; storeId: string | null; sellerId: string };

/** The order, only when it was placed on one of this seller's stores and every line is theirs. */
async function loadSellerDepositOrder(sellerId: string, orderId: string) {
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      storeId: orders.storeId,
      status: orders.status,
      depositStatus: orders.depositStatus,
      metadata: orders.metadata,
      foreignLines: sql<number>`(SELECT count(*)::int FROM ${orderItems} oi WHERE oi.order_id = ${orders.id} AND oi.seller_id <> ${sellerId})`,
    })
    .from(orders)
    .innerJoin(stores, and(eq(stores.id, orders.storeId), eq(stores.sellerId, sellerId)))
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order || order.foreignLines > 0) return null;
  return order;
}

/**
 * "Deposit received": the seller saw the transfer in their own account. Only
 * an open order whose deposit is awaiting or reported; a second press is a
 * no-op success. The order keeps its status: the seller confirms and ships it
 * as usual, and the courier now collects only the remainder.
 */
export async function confirmOrderDeposit(
  sellerId: string,
  orderId: string,
  now: Date = new Date(),
): Promise<{ success: true; alreadyPaid: boolean } | { success: false; error: DepositActionError }> {
  const order = await loadSellerDepositOrder(sellerId, orderId);
  if (!order || !order.depositStatus) return { success: false, error: "not_found" };
  if (order.depositStatus === "paid") return { success: true, alreadyPaid: true };
  const stamp = now.toISOString();
  const updated = await db
    .update(orders)
    .set({
      depositStatus: "paid",
      depositPaidAt: stamp,
      updatedAt: stamp,
      metadata: sql`coalesce(${orders.metadata}, '{}'::jsonb) || jsonb_build_object('depositPaidVia', 'transfer', 'depositConfirmedBy', ${sellerId}::text)`,
    })
    .where(
      and(
        eq(orders.id, order.id),
        inArray(orders.depositStatus, ["awaiting", "reported"]),
        inArray(orders.status, ["pending", "confirmed"]),
      ),
    )
    .returning({ id: orders.id });
  if (updated.length > 0) return { success: true, alreadyPaid: false };
  const [current] = await db.select({ depositStatus: orders.depositStatus }).from(orders).where(eq(orders.id, order.id));
  return current?.depositStatus === "paid" ? { success: true, alreadyPaid: true } : { success: false, error: "not_pending" };
}

/**
 * "Not received": the screenshot doesn't match a transfer. The deposit goes
 * back to `awaiting` (the customer can send it again from the order page) and
 * the 48 h window keeps running from when the order was placed.
 */
export async function rejectOrderDeposit(
  sellerId: string,
  orderId: string,
  now: Date = new Date(),
): Promise<{ success: true } | { success: false; error: DepositActionError }> {
  const order = await loadSellerDepositOrder(sellerId, orderId);
  if (!order || !order.depositStatus) return { success: false, error: "not_found" };
  if (order.depositStatus === "paid") return { success: false, error: "already_paid" };
  if (order.depositStatus === "awaiting") return { success: true };
  const stamp = now.toISOString();
  await db
    .update(orders)
    .set({
      depositStatus: "awaiting",
      updatedAt: stamp,
      metadata: sql`(coalesce(${orders.metadata}, '{}'::jsonb) - 'paymentSelfReported') || jsonb_build_object('depositRejectedAt', ${stamp}::text)`,
    })
    .where(and(eq(orders.id, order.id), eq(orders.depositStatus, "reported")));
  return { success: true };
}

/** The store owner of a storefront order (the bell row's seller). */
async function orderStoreSeller(orderId: string): Promise<DepositOrder | null> {
  const [row] = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber, storeId: orders.storeId, sellerId: stores.sellerId })
    .from(orders)
    .innerJoin(stores, eq(stores.id, orders.storeId))
    .where(eq(orders.id, orderId))
    .limit(1);
  return row ?? null;
}

/** One bell row per order and type (`dedupe_key`); never fails the caller. */
export async function notifyDeposit(orderId: string, type: "deposit_reported" | "deposit_paid"): Promise<void> {
  try {
    const order = await orderStoreSeller(orderId);
    if (!order) return;
    await db
      .insert(sellerNotifications)
      .values({
        sellerId: order.sellerId,
        storeId: order.storeId,
        type,
        data: { orderId: order.id, orderNumber: order.orderNumber },
        // A re-sent screenshot after a rejection notifies again.
        dedupeKey: `${type}:${order.id}${type === "deposit_reported" ? `:${Date.now().toString(36)}` : ""}`,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error("[cod-deposit] bell failed", orderId, (error as Error)?.message);
  }
}

/**
 * The customer said they sent the deposit (from the payment or order page).
 * `awaiting` → `reported`; a paid deposit stays paid. Returns whether it moved.
 */
export async function markDepositReported(orderId: string, now: Date = new Date()): Promise<boolean> {
  const stamp = now.toISOString();
  const updated = await db
    .update(orders)
    .set({ depositStatus: "reported", updatedAt: stamp })
    .where(and(eq(orders.id, orderId), eq(orders.depositStatus, "awaiting"), inArray(orders.status, ["pending", "confirmed"])))
    .returning({ id: orders.id });
  return updated.length > 0;
}

/**
 * Daily-or-faster cron: cancels COD orders whose deposit is still `awaiting`
 * 48 h after they were placed (owner, 2026-11-12). A `reported` deposit waits
 * for the seller's answer instead. One transaction per order; the status
 * guard makes a late payment or a seller confirm win or lose cleanly.
 */
export async function expireUnpaidDeposits(now: Date = new Date()): Promise<{ expired: number; failed: number }> {
  const cutoff = depositCutoff(now).toISOString();
  const due = await db
    .select({ id: orders.id, storeId: orders.storeId, isTest: orders.isTest })
    .from(orders)
    .where(
      and(
        eq(orders.depositStatus, "awaiting"),
        isNotNull(orders.depositAmount),
        inArray(orders.status, ["pending", "confirmed"]),
        sql`${orders.createdAt} < ${cutoff}`,
      ),
    )
    .limit(200);

  const counts = { expired: 0, failed: 0 };
  for (const order of due) {
    try {
      const stamp = now.toISOString();
      const done = await db.transaction(async (tx) => {
        const updated = await tx
          .update(orders)
          .set({
            status: "cancelled",
            cancelledAt: stamp,
            updatedAt: stamp,
            metadata: sql`coalesce(${orders.metadata}, '{}'::jsonb) || jsonb_build_object('cancelReason', 'deposit_unpaid')`,
          })
          .where(
            and(
              eq(orders.id, order.id),
              eq(orders.depositStatus, "awaiting"),
              inArray(orders.status, ["pending", "confirmed"]),
            ),
          )
          .returning({ id: orders.id });
        if (updated.length === 0) return false;

        const lines = await tx
          .update(orderItems)
          .set({ status: "cancelled", cancelledAt: stamp, updatedAt: stamp })
          .where(eq(orderItems.orderId, order.id))
          .returning({ productId: orderItems.productId, variantId: orderItems.variantId, quantity: orderItems.quantity });
        await tx
          .update(shipments)
          .set({ status: "cancelled", updatedAt: stamp })
          .where(and(eq(shipments.orderId, order.id), inArray(shipments.status, ["pending", "assigned"])));
        // A test order never took stock (F-76), so nothing goes back.
        if (!order.isTest) {
          const stockLines: StockLine[] = lines.map((line) =>
            line.variantId
              ? { kind: "variant", id: line.variantId, quantity: line.quantity }
              : { kind: "product", id: line.productId, quantity: line.quantity },
          );
          await restoreStock(tx, stockLines, { reason: "cancel", orderId: order.id, storeId: order.storeId });
        }
        await cancelPendingAffiliateCommission(tx, order.id);
        return true;
      });
      if (done) {
        counts.expired += 1;
        await sendOrderEventEmail(order.id, "cancelled", "system").catch(() => undefined);
      }
    } catch (error) {
      counts.failed += 1;
      console.error("[cod-deposit] expiry failed", order.id, error instanceof Error ? error.message : error);
    }
  }
  return counts;
}
