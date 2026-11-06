import { and, eq, isNull, ne, sql } from "drizzle-orm";

import type { db as dbType } from "../drizzle/database";
import { logServerError } from "../log";
import { orderItems, orders, sellerWallet, stores, walletTransactions } from "../drizzle/schema";
import { postStoreWalletEntryOnce, STORE_WALLET_REFERENCE_TYPES } from "./store-wallet";
import { orderPaysPlatformFee } from "./test-order.lib";

type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

const toPiastres = (value: string | number | null | undefined) => Math.round(Number(value ?? 0) * 100);
const fromPiastres = (piastres: number) => (piastres / 100).toFixed(2);

type FeeLine = { sellerId: string; commissionAmount: string; metadata: unknown };

const hasFeeSnapshot = (line: FeeLine) =>
  (line.metadata as { platformFee?: unknown } | null)?.platformFee != null;

/** The USD fee in the line's snapshot; undefined on an order from before the switch (0136). */
const feeUsdCentsOf = (line: FeeLine) =>
  (line.metadata as { platformFee?: { feeUsdCents?: number } } | null)?.platformFee?.feeUsdCents;

/** The wallet's currency, or what a new wallet would start in. */
async function walletCurrency(tx: Tx, sellerId: string): Promise<string> {
  const [wallet] = await tx
    .select({ currency: sql<string>`coalesce(${sellerWallet.currency}, 'EGP')` })
    .from(sellerWallet)
    .where(eq(sellerWallet.sellerId, sellerId));
  if (wallet) return wallet.currency;
  const rows = await tx.execute<{ currency: string }>(sql`SELECT billing_wallet_currency() AS currency`);
  return rows[0]?.currency ?? "EGP";
}

/** `orders.metadata.feeHolds[sellerId]`: why that seller's fee waits for delivery (fee-hold.lib.ts). */
function heldSellers(metadata: unknown): Set<string> {
  const holds = (metadata as { feeHolds?: unknown } | null)?.feeHolds;
  if (!holds || typeof holds !== "object" || Array.isArray(holds)) return new Set();
  return new Set(
    Object.entries(holds as Record<string, unknown>)
      .filter(([, reasons]) => Array.isArray(reasons) && reasons.length > 0)
      .map(([sellerId]) => sellerId)
  );
}

type FeeMoment = "placed" | "delivered";

/**
 * Posts each seller's EGP 5 `fee` for one order (PLAN.md §13.3, owner
 * 2026-10-31). The claim is `order:<orderId>` per seller and type, the same
 * at creation and at delivery, so a seller pays at most once per order.
 * No `sale` entry is ever posted: the order amount never enters the store
 * wallet (owner, 2026-10-31).
 */
async function postOrderFees(tx: Tx, orderId: string, moment: FeeMoment): Promise<void> {
  const lines: FeeLine[] = await tx
    .select({
      sellerId: orderItems.sellerId,
      commissionAmount: orderItems.commissionAmount,
      metadata: orderItems.metadata,
    })
    .from(orderItems)
    .where(
      moment === "delivered"
        ? and(eq(orderItems.orderId, orderId), eq(orderItems.status, "delivered"), eq(orderItems.isRefunded, false))
        : and(eq(orderItems.orderId, orderId), ne(orderItems.status, "cancelled"))
    );
  if (lines.length === 0) return;

  const [order] = await tx
    .select({ metadata: orders.metadata, storeId: orders.storeId, isTest: orders.isTest })
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) return;
  // A test order (0155, F-76) pays no fee at any moment: placed, paid or delivered.
  if (!orderPaysPlatformFee(order)) return;

  // Storefront orders carry their store; entries keep it for per-store reports.
  const [store] = order.storeId
    ? await tx.select({ sellerId: stores.sellerId }).from(stores).where(eq(stores.id, order.storeId))
    : [];
  const held = moment === "placed" ? heldSellers(order.metadata) : new Set<string>();

  const bySeller = new Map<string, FeeLine[]>();
  for (const line of lines) bySeller.set(line.sellerId, [...(bySeller.get(line.sellerId) ?? []), line]);

  for (const [sellerId, sellerLines] of bySeller) {
    // A held order (looks fake or duplicated) pays only once it is delivered.
    if (held.has(sellerId)) continue;
    // Orders from before the flat fee (5% snapshots) never post a fee.
    if (!sellerLines.every(hasFeeSnapshot)) continue;

    // Delivered before the store wallet: the old code wrote one net sale row
    // without a reference, which already took the commission.
    const [legacySale] = await tx
      .select({ id: walletTransactions.id })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.sellerId, sellerId),
          eq(walletTransactions.orderId, orderId),
          eq(walletTransactions.type, "sale"),
          isNull(walletTransactions.referenceType)
        )
      )
      .limit(1);
    if (legacySale) continue;

    // USD wallet: the snapshot's cents. A fee from before the switch that wasn't
    // charged yet is cancelled (owner, 2026-11-03), so it posts nothing.
    const usd = (await walletCurrency(tx, sellerId)) === "USD";
    const fee = usd
      ? (feeUsdCentsOf(sellerLines[0]!) ?? 0)
      : sellerLines.every((line) => feeUsdCentsOf(line) === undefined)
        ? sellerLines.reduce((sum, line) => sum + Math.max(0, toPiastres(line.commissionAmount)), 0)
        : 0;
    if (fee <= 0) continue;

    await postStoreWalletEntryOnce(tx, {
      sellerId,
      storeId: store?.sellerId === sellerId ? order.storeId : null,
      orderId,
      referenceType: STORE_WALLET_REFERENCE_TYPES.order,
      referenceId: orderId,
      type: "fee",
      amount: fromPiastres(-fee),
      currency: usd ? "USD" : "EGP",
      description: "Tallaby platform fee",
      metadata: { chargedAt: moment },
    });
  }
}

/**
 * The EGP 5 fee when an order is created (or, for a card order, when its
 * payment is confirmed). Sellers whose part is held (fake or duplicate,
 * `orders.metadata.feeHolds`) are skipped; delivery charges them.
 *
 * Never fails the order: it runs in a savepoint and a failure is only logged
 * as `[fee]`; the delivery charge then takes the fee instead.
 */
export async function chargeOrderPlacementFee(tx: Tx, orderId: string): Promise<void> {
  try {
    await tx.transaction((sp) => postOrderFees(sp as unknown as Tx, orderId, "placed"));
  } catch (error) {
    logServerError("fee", "placement fee failed", { orderId }, error);
  }
}

/**
 * Called from every delivered path (shipping app, seller shipments, admin)
 * inside their transaction. Posts the fee for any seller not charged yet
 * (held orders, card orders whose payment never confirmed, orders placed
 * before 2026-10-31); the shared claim makes it a no-op otherwise.
 *
 * A failure is logged as `[fee]` (P9-03) and rethrown, so the caller's
 * transaction (the delivered status change) rolls back as before.
 */
export async function creditSellerOnDelivery(tx: Tx, orderId: string): Promise<void> {
  try {
    await postOrderFees(tx, orderId, "delivered");
  } catch (error) {
    logServerError("fee", "delivery fee failed", { orderId }, error);
    throw error;
  }
}
