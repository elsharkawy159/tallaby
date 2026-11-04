import { and, db, eq, inArray, sellers, sellerWalletTopUps, sql, walletTransactions } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { MANUAL_TOP_UP_METHODS } from "../store-wallet/top-up.lib";
import { getBillingState } from "./billing.server";
import { ORDERS_UNLOCKED, orderLockState, type OrderLock } from "./order-lock.lib";

export type { OrderLock } from "./order-lock.lib";

/**
 * Whether this seller's orders are hidden until a first top-up (ROADMAP.md F-68).
 * A succeeded top-up row of any provider, old EGP ones included, or any `top_up`
 * ledger entry unlocks. A welcome gift or an admin adjustment doesn't. Read fresh
 * for one seller, never cached. If the check throws the seller stays unlocked: an
 * error must not hide someone's orders.
 */
export async function getOrderLock(sellerId: string): Promise<OrderLock> {
  try {
    const { usdLive } = await getBillingState();
    // No more queries before the switch.
    if (!usdLive) return ORDERS_UNLOCKED;

    const [[seller], [topUps], [ledger]] = await Promise.all([
      db
        .select({ plan: sellers.plan, planExpiresAt: sellers.planExpiresAt, planGraceUntil: sellers.planGraceUntil })
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
    ]);

    return orderLockState({
      usdLive,
      seller: seller ?? null,
      hasTopUp: topUps?.succeeded === true || Boolean(ledger),
      hasPendingManualTopUp: topUps?.pendingManual === true,
    });
  } catch (error) {
    logServerError("wallet", "order lock check failed", { sellerId }, error);
    return ORDERS_UNLOCKED;
  }
}
