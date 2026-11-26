import { and, eq, isNull, ne, notInArray, sql } from "drizzle-orm";

import type { db as dbType } from "../drizzle/database";
import { logServerError } from "../log";
import { orderItems, orders, sellerWallet, stores, walletTransactions } from "../drizzle/schema";
import { postStoreWalletEntryOnce, STORE_WALLET_REFERENCE_TYPES } from "./store-wallet";
import { orderPaysPlatformFee } from "./test-order.lib";
import { AGED_FEE_CLOSED_LINE_STATUSES, orderOpenForAgedFee } from "./aged-fee.lib";
import { readFeeOnDeliverySwitch } from "./fee-switch";

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

/**
 * When the fee is posted: `placed` (created, or a card order paid), `delivered`
 * (that seller's part delivered) or `aged` (the daily job, 14 days after an
 * order that was never closed; only while `fee_on_delivery` is on).
 */
type FeeMoment = "placed" | "delivered" | "aged";

function linesWhere(orderId: string, moment: FeeMoment) {
  if (moment === "delivered") {
    return and(eq(orderItems.orderId, orderId), eq(orderItems.status, "delivered"), eq(orderItems.isRefunded, false));
  }
  if (moment === "aged") {
    return and(
      eq(orderItems.orderId, orderId),
      notInArray(orderItems.status, [...AGED_FEE_CLOSED_LINE_STATUSES]),
      sql`coalesce(${orderItems.isRefunded}, false) = false`
    );
  }
  return and(eq(orderItems.orderId, orderId), ne(orderItems.status, "cancelled"));
}

/**
 * Posts each seller's `fee` for one order (PLAN.md §13.3, owner 2026-10-31)
 * and returns how many entries it posted. The claim is `order:<orderId>` per
 * seller and type, the same at every moment, so a seller pays at most once
 * per order. No `sale` entry is ever posted: the order amount never enters
 * the store wallet (owner, 2026-10-31).
 */
async function postOrderFees(tx: Tx, orderId: string, moment: FeeMoment): Promise<number> {
  // `aged` locks the order first, so a cancel or return committing meanwhile
  // is waited for and then seen: the job never charges a just-closed order.
  if (moment === "aged") {
    await tx.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).for("update");
  }

  const lines: FeeLine[] = await tx
    .select({
      sellerId: orderItems.sellerId,
      commissionAmount: orderItems.commissionAmount,
      metadata: orderItems.metadata,
    })
    .from(orderItems)
    .where(linesWhere(orderId, moment));
  if (lines.length === 0) return 0;

  const [order] = await tx
    .select({
      metadata: orders.metadata,
      storeId: orders.storeId,
      isTest: orders.isTest,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) return 0;
  // A test order (0155, F-76) pays no fee at any moment: placed, paid or delivered.
  if (!orderPaysPlatformFee(order)) return 0;
  if (moment === "aged" && !orderOpenForAgedFee(order)) return 0;

  // Storefront orders carry their store; entries keep it for per-store reports.
  const [store] = order.storeId
    ? await tx.select({ sellerId: stores.sellerId }).from(stores).where(eq(stores.id, order.storeId))
    : [];
  // A held part pays only once it is delivered: never when placed, never through the job.
  const held = moment === "delivered" ? new Set<string>() : heldSellers(order.metadata);

  const bySeller = new Map<string, FeeLine[]>();
  for (const line of lines) bySeller.set(line.sellerId, [...(bySeller.get(line.sellerId) ?? []), line]);

  let posted = 0;
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

    const entry = await postStoreWalletEntryOnce(tx, {
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
    if (entry) posted += 1;
  }
  return posted;
}

/**
 * The fee when an order is created (or, for a card order, when its payment is
 * confirmed). Sellers whose part is held (fake or duplicate,
 * `orders.metadata.feeHolds`) are skipped; delivery charges them.
 *
 * While the `fee_on_delivery` switch is on (owner, 2026-11-26) it charges
 * nothing: the fee waits for delivery or the 14-day job. The switch is read
 * inside the same savepoint, so every placement and payment path (checkout,
 * card callbacks, seller gateways, manual order links) follows it with no
 * change at the caller.
 *
 * Never fails the order: it runs in a savepoint and a failure is only logged
 * as `[fee]`; the delivery charge then takes the fee instead.
 */
export async function chargeOrderPlacementFee(tx: Tx, orderId: string): Promise<void> {
  try {
    await tx.transaction(async (sp) => {
      const savepoint = sp as unknown as Tx;
      if ((await readFeeOnDeliverySwitch(savepoint)).on) return;
      await postOrderFees(savepoint, orderId, "placed");
    });
  } catch (error) {
    logServerError("fee", "placement fee failed", { orderId }, error);
  }
}

/**
 * Called from every delivered path (shipping app, seller shipments, admin,
 * the dashboard's line status action) inside their transaction. Posts the fee
 * for any seller not charged yet (held orders, card orders whose payment never
 * confirmed, orders placed before 2026-10-31, and every order while
 * `fee_on_delivery` is on); the shared claim makes it a no-op otherwise.
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

/**
 * The 14-day charge for one order (aged-order-fees.ts runs it daily while
 * `fee_on_delivery` is on). Same claim as placement and delivery, so it never
 * charges a seller twice; held parts, test orders and closed orders pay
 * nothing. Returns how many fee entries it posted. Errors are thrown: the job
 * logs them and goes on with the next order.
 */
export async function chargeAgedOrderFee(tx: Tx, orderId: string): Promise<number> {
  return postOrderFees(tx, orderId, "aged");
}
