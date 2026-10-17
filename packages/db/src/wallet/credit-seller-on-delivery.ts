import { and, eq, isNull } from "drizzle-orm";

import type { db as dbType } from "../drizzle/database";
import { orderItems, orders, shipments, stores, walletTransactions } from "../drizzle/schema";
import { resolveCollectionParty } from "./collection-party";
import { postStoreWalletEntryOnce, STORE_WALLET_REFERENCE_TYPES } from "./store-wallet";

type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

const toPiastres = (value: string | number | null | undefined) => Math.round(Number(value ?? 0) * 100);
const fromPiastres = (piastres: number) => (piastres / 100).toFixed(2);

type DeliveredLine = {
  sellerId: string;
  total: string;
  commissionAmount: string;
  sellerEarning: string;
  metadata: unknown;
};

const hasFeeSnapshot = (line: DeliveredLine) =>
  (line.metadata as { platformFee?: unknown } | null)?.platformFee != null;

/**
 * Posts each seller's store-wallet entries when an order is delivered
 * (PLAN.md §13.3–§13.4, P6-05). Called from every delivered path (shipping
 * app, seller shipments, admin) inside their transaction. Idempotent: every
 * entry is claimed by reference `order:<orderId>`, so replays post nothing.
 *
 * - Orders placed with the platform fee (P6-04 snapshot on the lines): a
 *   gross `sale` (the seller's line totals) and a `fee` debit when Tallaby
 *   collected the money; only the `fee` when the seller did.
 * - Older orders (5% snapshot): the legacy single net `sale`
 *   (Σ seller_earning), as before.
 */
export async function creditSellerOnDelivery(tx: Tx, orderId: string): Promise<void> {
  const items: DeliveredLine[] = await tx
    .select({
      sellerId: orderItems.sellerId,
      total: orderItems.total,
      commissionAmount: orderItems.commissionAmount,
      sellerEarning: orderItems.sellerEarning,
      metadata: orderItems.metadata,
    })
    .from(orderItems)
    .where(
      and(eq(orderItems.orderId, orderId), eq(orderItems.status, "delivered"), eq(orderItems.isRefunded, false))
    );
  if (items.length === 0) return;

  const [order] = await tx
    .select({ paymentMethod: orders.paymentMethod, metadata: orders.metadata, storeId: orders.storeId })
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) return;

  const [shipment] = await tx
    .select({ sellerId: shipments.sellerId, status: shipments.status })
    .from(shipments)
    .where(eq(shipments.orderId, orderId));

  // Storefront orders carry their store; entries keep it for per-store reports.
  const [store] = order.storeId
    ? await tx.select({ sellerId: stores.sellerId }).from(stores).where(eq(stores.id, order.storeId))
    : [];

  const bySeller = new Map<string, DeliveredLine[]>();
  for (const item of items) bySeller.set(item.sellerId, [...(bySeller.get(item.sellerId) ?? []), item]);

  for (const [sellerId, lines] of bySeller) {
    // Delivered before the store wallet: the old code wrote one net sale row
    // without a reference. Never post on top of it.
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

    const base = {
      sellerId,
      storeId: store?.sellerId === sellerId ? order.storeId : null,
      orderId,
      referenceType: STORE_WALLET_REFERENCE_TYPES.order,
      referenceId: orderId,
    };

    if (!lines.every(hasFeeSnapshot)) {
      const earning = lines.reduce((sum, line) => sum + Math.max(0, toPiastres(line.sellerEarning)), 0);
      if (earning > 0) {
        await postStoreWalletEntryOnce(tx, {
          ...base,
          type: "sale",
          amount: fromPiastres(earning),
          description: "Earnings from delivered order",
          metadata: { model: "legacy_net" },
        });
      }
      continue;
    }

    const party = resolveCollectionParty(order, shipment, sellerId);
    const gross = lines.reduce((sum, line) => sum + Math.max(0, toPiastres(line.total)), 0);
    const fee = lines.reduce((sum, line) => sum + Math.max(0, toPiastres(line.commissionAmount)), 0);

    if (party === "tallaby" && gross > 0) {
      await postStoreWalletEntryOnce(tx, {
        ...base,
        type: "sale",
        amount: fromPiastres(gross),
        description: "Sale from delivered order",
        metadata: { collectedBy: party },
      });
    }
    if (fee > 0) {
      await postStoreWalletEntryOnce(tx, {
        ...base,
        type: "fee",
        amount: fromPiastres(-fee),
        description: "Tallaby platform fee",
        metadata: { collectedBy: party },
      });
    }
  }
}
