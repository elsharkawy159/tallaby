import { and, eq, sql } from "drizzle-orm";

import type { db as dbType } from "../drizzle/database";
import {
  orderItems,
  sellerWallet,
  sellers,
  walletTransactions,
} from "../drizzle/schema";

type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

interface SellerEarningGroup {
  sellerId: string;
  totalEarning: number;
}

/**
 * Credits each seller's wallet when an order is marked delivered.
 * Idempotent per (sellerId, orderId, type=sale).
 */
export async function creditSellerOnDelivery(
  tx: Tx,
  orderId: string
): Promise<void> {
  const items = await tx.query.orderItems.findMany({
    where: and(
      eq(orderItems.orderId, orderId),
      eq(orderItems.status, "delivered"),
      eq(orderItems.isRefunded, false)
    ),
    columns: {
      sellerId: true,
      sellerEarning: true,
    },
  });

  if (items.length === 0) return;

  const earningsBySeller = new Map<string, number>();
  for (const item of items) {
    const earning = Number(item.sellerEarning ?? 0);
    if (earning <= 0) continue;
    earningsBySeller.set(
      item.sellerId,
      (earningsBySeller.get(item.sellerId) ?? 0) + earning
    );
  }

  const groups: SellerEarningGroup[] = Array.from(
    earningsBySeller.entries()
  ).map(([sellerId, totalEarning]) => ({ sellerId, totalEarning }));

  const now = new Date().toISOString();

  for (const { sellerId, totalEarning } of groups) {
    const existing = await tx.query.walletTransactions.findFirst({
      where: and(
        eq(walletTransactions.sellerId, sellerId),
        eq(walletTransactions.orderId, orderId),
        eq(walletTransactions.type, "sale")
      ),
      columns: { id: true },
    });

    if (existing) continue;

    const amountStr = totalEarning.toFixed(2);

    await tx.insert(walletTransactions).values({
      sellerId,
      type: "sale",
      amount: amountStr,
      currency: "EGP",
      orderId,
      description: `Earnings from delivered order`,
      createdAt: now,
    });

    const existingWallet = await tx.query.sellerWallet.findFirst({
      where: eq(sellerWallet.sellerId, sellerId),
      columns: { id: true },
    });

    if (existingWallet) {
      await tx
        .update(sellerWallet)
        .set({
          balance: sql`${sellerWallet.balance} + ${amountStr}::numeric`,
          updatedAt: now,
        })
        .where(eq(sellerWallet.sellerId, sellerId));
    } else {
      await tx.insert(sellerWallet).values({
        sellerId,
        balance: amountStr,
        currency: "EGP",
        updatedAt: now,
      });
    }

    await tx
      .update(sellers)
      .set({
        walletBalance: sql`COALESCE(${sellers.walletBalance}, 0) + ${amountStr}::numeric`,
        updatedAt: now,
      })
      .where(eq(sellers.id, sellerId));
  }
}
