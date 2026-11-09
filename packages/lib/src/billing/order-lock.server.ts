import { and, asc, db, eq, gte, inArray, ne, orderItems, orders, sellers, sellerWallet, sellerWalletTopUps, sql, walletTransactions } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { MANUAL_TOP_UP_METHODS } from "../store-wallet/top-up.lib";
import { getBillingState } from "./billing.server";
import { ORDERS_UNLOCKED, isActivated, orderGraceStart, orderLockState, type OrderLock } from "./order-lock.lib";

export type { OrderLock, OrderGrace } from "./order-lock.lib";
export { ORDER_GRACE_DAYS, graceDaysLeft } from "./order-lock.lib";

/**
 * This seller's activation and grace window (ROADMAP.md F-68, F-84; order-lock.lib.ts
 * says what each flag means). A succeeded top-up row of any provider, old EGP ones
 * included, or any `top_up` ledger entry activates for good. So does ever having a
 * store wallet balance above zero (a gift, an admin credit): the balance now, or a USD
 * ledger entry with `balance_after` above zero. USD only, so an old EGP gift spent
 * before the switch doesn't count, while a wallet with money at the switch has a
 * positive USD conversion entry and does. Read fresh for one seller, never cached. If
 * the check throws nothing is locked: an error must not hide someone's orders.
 */
export async function getOrderLock(sellerId: string): Promise<OrderLock> {
  try {
    const { usdLive } = await getBillingState();
    // No more queries before the switch.
    if (!usdLive) return ORDERS_UNLOCKED;

    const [[seller], [topUps], [ledger], [wallet], [positiveEntry]] = await Promise.all([
      db
        .select({
          plan: sellers.plan,
          planExpiresAt: sellers.planExpiresAt,
          planGraceUntil: sellers.planGraceUntil,
          createdAt: sellers.createdAt,
        })
        .from(sellers)
        .where(eq(sellers.id, sellerId))
        .limit(1),
      db
        .select({
          succeeded: sql<boolean>`bool_or(${sellerWalletTopUps.status} = 'succeeded')`,
          pendingManual: sql<boolean>`bool_or(${sellerWalletTopUps.status} = 'pending' AND ${inArray(sellerWalletTopUps.provider, [...MANUAL_TOP_UP_METHODS])})`,
        })
        .from(sellerWalletTopUps)
        .where(eq(sellerWalletTopUps.sellerId, sellerId)),
      db
        .select({ one: sql<number>`1` })
        .from(walletTransactions)
        .where(and(eq(walletTransactions.sellerId, sellerId), eq(walletTransactions.type, "top_up")))
        .limit(1),
      db.select({ balance: sellerWallet.balance }).from(sellerWallet).where(eq(sellerWallet.sellerId, sellerId)).limit(1),
      db
        .select({ one: sql<number>`1` })
        .from(walletTransactions)
        .where(and(eq(walletTransactions.sellerId, sellerId), eq(walletTransactions.currency, "USD"), sql`${walletTransactions.balanceAfter} > 0`))
        .limit(1),
    ]);

    const activation = {
      usdLive,
      seller: seller ?? null,
      hasTopUp: topUps?.succeeded === true || Boolean(ledger),
      hasHadPositiveBalance: Number(wallet?.balance ?? 0) > 0 || Boolean(positiveEntry),
    };
    if (isActivated(activation)) return ORDERS_UNLOCKED;

    return orderLockState({
      ...activation,
      hasPendingManualTopUp: topUps?.pendingManual === true,
      firstOrders: await loadGraceOrders(sellerId, orderGraceStart(seller?.createdAt)),
    });
  } catch (error) {
    logServerError("wallet", "order lock check failed", { sellerId }, error);
    return ORDERS_UNLOCKED;
  }
}

/**
 * The seller's first two real orders since `since`, oldest first: orders with a
 * line of this seller (order_items.seller_id, like every seller order query), not
 * test orders (F-76), not an online payment that isn't paid yet (not a real order
 * until it is, as in 0098/0116), and not one the seller typed in themselves
 * (manual, F-05). Cancelled orders count, so cancelling the visible first order
 * never shows the next one. Migration 0159's first-order bell uses the same rule.
 */
async function loadGraceOrders(sellerId: string, since: Date): Promise<{ id: string; createdAt: string }[]> {
  const rows = await db
    .select({ id: orders.id, createdAt: orders.createdAt })
    .from(orders)
    .where(
      and(
        inArray(orders.id, db.select({ id: orderItems.orderId }).from(orderItems).where(eq(orderItems.sellerId, sellerId))),
        eq(orders.isTest, false),
        sql`${orders.status} IS DISTINCT FROM 'payment_processing'`,
        ne(orders.orderSource, "manual"),
        gte(orders.createdAt, since.toISOString()),
      ),
    )
    .orderBy(asc(orders.createdAt), asc(orders.id))
    .limit(2);
  return rows.flatMap((row) => (row.createdAt ? [{ id: row.id, createdAt: row.createdAt }] : []));
}
