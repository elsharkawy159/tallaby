import { and, db, eq, inArray, sellers, sellerWallet, sellerWalletTopUps, sql, walletTransactions } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { MANUAL_TOP_UP_METHODS } from "../store-wallet/top-up.lib";
import { getBillingState } from "./billing.server";
import { ORDERS_UNLOCKED, orderLockState, type OrderLock } from "./order-lock.lib";

export type { OrderLock } from "./order-lock.lib";

/**
 * Whether this seller isn't activated yet (ROADMAP.md F-68): orders hidden, campaign
 * emails off, fewer AI requests. A succeeded top-up row of any provider, old EGP ones
 * included, or any `top_up` ledger entry activates for good. So does ever having a
 * store wallet balance above zero (a gift, an admin credit): the balance now, or a USD
 * ledger entry with `balance_after` above zero. USD only, so an old EGP gift spent
 * before the switch doesn't count, while a wallet with money at the switch has a
 * positive USD conversion entry and does. Read fresh for one seller, never cached. If
 * the check throws the seller stays unlocked: an error must not hide someone's orders.
 */
export async function getOrderLock(sellerId: string): Promise<OrderLock> {
  try {
    const { usdLive } = await getBillingState();
    // No more queries before the switch.
    if (!usdLive) return ORDERS_UNLOCKED;

    const [[seller], [topUps], [ledger], [wallet], [positiveEntry]] = await Promise.all([
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
      db.select({ balance: sellerWallet.balance }).from(sellerWallet).where(eq(sellerWallet.sellerId, sellerId)).limit(1),
      db
        .select({ one: sql<number>`1` })
        .from(walletTransactions)
        .where(and(eq(walletTransactions.sellerId, sellerId), eq(walletTransactions.currency, "USD"), sql`${walletTransactions.balanceAfter} > 0`))
        .limit(1),
    ]);

    return orderLockState({
      usdLive,
      seller: seller ?? null,
      hasTopUp: topUps?.succeeded === true || Boolean(ledger),
      hasHadPositiveBalance: Number(wallet?.balance ?? 0) > 0 || Boolean(positiveEntry),
      hasPendingManualTopUp: topUps?.pendingManual === true,
    });
  } catch (error) {
    logServerError("wallet", "order lock check failed", { sellerId }, error);
    return ORDERS_UNLOCKED;
  }
}
