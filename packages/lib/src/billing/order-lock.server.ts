import { and, asc, db, eq, gte, inArray, ne, orderItems, orders, sellers, sellerWallet, sellerWalletTopUps, sql, walletTransactions } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { MANUAL_TOP_UP_METHODS } from "../store-wallet/top-up.lib";
import { getBillingState } from "./billing.server";
import type { BillingState } from "./billing.lib";
import { ORDERS_UNLOCKED, isActivated, orderGraceStart, orderLockState, type OrderLock } from "./order-lock.lib";

export type { OrderLock, OrderGrace } from "./order-lock.lib";
export { ORDER_GRACE_DAYS, ORDER_GRACE_DAYS_SHORT, daysUntilOffline, graceDaysLeft, storeMayBeBillingOffline, trialDaysOver } from "./order-lock.lib";

/**
 * What activates a seller, read fresh: a succeeded top-up row of any provider or a
 * `top_up` ledger entry, and ever having a store wallet balance above zero (the
 * balance now, or a USD ledger entry with `balance_after` above zero). One
 * statement: the aggregate over the seller's top-ups always returns one row, and
 * the other facts are uncorrelated sub-selects on the same seller. Throws on a
 * database error; the callers decide how to fail.
 */
async function loadActivationFacts(sellerId: string) {
  const [facts] = await db
    .select({
      succeeded: sql<boolean | null>`bool_or(${sellerWalletTopUps.status} = 'succeeded')`,
      pendingManual: sql<boolean | null>`bool_or(${sellerWalletTopUps.status} = 'pending' AND ${inArray(sellerWalletTopUps.provider, [...MANUAL_TOP_UP_METHODS])})`,
      hasTopUpEntry: sql<boolean>`EXISTS (SELECT 1 FROM ${walletTransactions} WHERE ${and(eq(walletTransactions.sellerId, sellerId), eq(walletTransactions.type, "top_up"))})`,
      balance: sql<string | null>`(SELECT ${sellerWallet.balance} FROM ${sellerWallet} WHERE ${eq(sellerWallet.sellerId, sellerId)} LIMIT 1)`,
      hasPositiveEntry: sql<boolean>`EXISTS (SELECT 1 FROM ${walletTransactions} WHERE ${and(eq(walletTransactions.sellerId, sellerId), eq(walletTransactions.currency, "USD"), sql`${walletTransactions.balanceAfter} > 0`)})`,
    })
    .from(sellerWalletTopUps)
    .where(eq(sellerWalletTopUps.sellerId, sellerId));
  return {
    hasTopUp: facts?.succeeded === true || facts?.hasTopUpEntry === true,
    hasHadPositiveBalance: Number(facts?.balance ?? 0) > 0 || facts?.hasPositiveEntry === true,
    hasPendingManualTopUp: facts?.pendingManual === true,
  };
}

/** The `sellers` columns the lock reads. */
export type OrderLockSeller = {
  plan: string;
  planExpiresAt: string | null;
  planGraceUntil: string | null;
  createdAt: string | null;
};

/**
 * Reads getOrderLock can take from its caller instead of running them again
 * (a dashboard render already has billing and the seller row, memoized per
 * request with React cache()). Each defaults to a fresh read. A caller must
 * never pass a value cached across requests (CLAUDE.md rule 8).
 */
export type OrderLockReads = {
  billing?: () => Promise<BillingState>;
  seller?: () => Promise<OrderLockSeller | null>;
};

async function readLockSeller(sellerId: string): Promise<OrderLockSeller | null> {
  const [seller] = await db
    .select({
      plan: sellers.plan,
      planExpiresAt: sellers.planExpiresAt,
      planGraceUntil: sellers.planGraceUntil,
      createdAt: sellers.createdAt,
    })
    .from(sellers)
    .where(eq(sellers.id, sellerId))
    .limit(1);
  return seller ?? null;
}

/**
 * Activated by money, which can never be undone: an approved top-up, or a store
 * wallet balance that was ever above zero. Active Pro alone is NOT counted (a Pro
 * granted by an admin can end), nor is "before the USD switch", so `true` is safe
 * to cache for long (the storefront does). Unlike getOrderLock it does not fail
 * open: it throws on a database error, so an error is never cached as "activated".
 */
export async function isActivatedByMoney(sellerId: string): Promise<boolean> {
  const { usdLive } = await getBillingState();
  if (!usdLive) return false;
  const facts = await loadActivationFacts(sellerId);
  return facts.hasTopUp || facts.hasHadPositiveBalance;
}

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
export async function getOrderLock(sellerId: string, reads: OrderLockReads = {}): Promise<OrderLock> {
  try {
    return await readOrderLockStrict(sellerId, reads);
  } catch (error) {
    logServerError("wallet", "order lock check failed", { sellerId }, error);
    return ORDERS_UNLOCKED;
  }
}

/**
 * The same answer as getOrderLock, but a database error throws instead of
 * failing open. For a caller where "unlocked" after an error would do the
 * wrong thing, such as the store-offline email (ROADMAP.md F-113), which must
 * skip the seller for that run rather than guess.
 */
export async function readOrderLockStrict(sellerId: string, reads: OrderLockReads = {}): Promise<OrderLock> {
  const { usdLive } = await (reads.billing ?? getBillingState)();
  // No more queries before the switch.
  if (!usdLive) return ORDERS_UNLOCKED;

  const [seller, facts] = await Promise.all([
    (reads.seller ?? (() => readLockSeller(sellerId)))(),
    loadActivationFacts(sellerId),
  ]);

  const activation = {
    usdLive,
    seller: seller ?? null,
    hasTopUp: facts.hasTopUp,
    hasHadPositiveBalance: facts.hasHadPositiveBalance,
  };
  if (isActivated(activation)) return ORDERS_UNLOCKED;

  return orderLockState({
    ...activation,
    hasPendingManualTopUp: facts.hasPendingManualTopUp,
    firstOrders: await loadGraceOrders(sellerId, orderGraceStart(seller?.createdAt)),
  });
}

/**
 * The seller's first two real orders since `since`, oldest first: orders with a
 * line of this seller (order_items.seller_id, like every seller order query), not
 * test orders (F-76), not an online payment that isn't paid yet (not a real order
 * until it is, as in 0098/0116), and not one the seller typed in themselves
 * (manual, F-05). Cancelled orders count. They only date the grace window now
 * (no order stays visible while locked, owner 2026-11-16). Migration 0159's
 * first-order bell uses the same rule.
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
