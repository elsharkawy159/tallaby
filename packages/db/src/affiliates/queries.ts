import { and, desc, eq } from "drizzle-orm";

import type { db as dbType } from "../drizzle/database";
import { affiliateCommissions } from "../drizzle/schema";
import { getUserWalletSummary } from "../wallet/user-wallet";
import { getAffiliateAccount } from "./join";

type Queryable = typeof dbType;

export interface AffiliateOverview {
  code: string;
  status: "active" | "inactive";
  totals: {
    totalOrders: number;
    /** Orders whose commission has reached (or passed through) 'earned' — i.e. the order was Delivered at least once. */
    deliveredOrders: number;
    pendingProfit: string;
    /** Currently-earned, not-since-reversed commission — matches the wallet credit those orders produced. */
    totalProfit: string;
  };
  wallet: { balance: string; availableBalance: string; currency: string } | null;
}

/** Everything the /profile/affiliate summary cards render. Null when the caller isn't an affiliate. */
export async function getAffiliateOverview(
  db: Queryable,
  userId: string
): Promise<AffiliateOverview | null> {
  const account = await getAffiliateAccount(db, userId);
  if (!account) return null;

  const rows = await db
    .select({
      status: affiliateCommissions.status,
      commissionAmount: affiliateCommissions.commissionAmount,
    })
    .from(affiliateCommissions)
    .where(
      and(
        eq(affiliateCommissions.affiliateId, account.affiliateId),
        eq(affiliateCommissions.type, "commission")
      )
    );

  let deliveredOrders = 0;
  let pendingProfit = 0;
  let totalProfit = 0;

  for (const row of rows) {
    if (row.status === "earned" || row.status === "reversed") deliveredOrders++;
    if (row.status === "pending") pendingProfit += Number(row.commissionAmount);
    if (row.status === "earned") totalProfit += Number(row.commissionAmount);
  }

  const wallet = await getUserWalletSummary(db, userId);

  return {
    code: account.code,
    status: account.status,
    totals: {
      totalOrders: rows.length,
      deliveredOrders,
      pendingProfit: pendingProfit.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
    },
    wallet: wallet
      ? {
          balance: wallet.balance,
          availableBalance: wallet.availableBalance,
          currency: wallet.currency,
        }
      : null,
  };
}

export interface AffiliateOrderView {
  orderId: string;
  orderReference: string;
  orderDate: string | null;
  orderEligibleAmount: string;
  orderStatus: string;
  commissionStatus: "pending" | "earned" | "reversed" | "cancelled";
  /** Only set when commissionStatus === 'earned' — every other state renders as "Pending" in the UI, never a number. */
  yourProfit: string | null;
}

/**
 * Referred orders for the affiliate's own /profile/affiliate list.
 *
 * Privacy-safe by construction: this only ever selects order id/number/status/
 * createdAt columns, never the buyer's name, address, phone, or email — there
 * is no `with: { user: ... }` here to accidentally widen later.
 */
export async function getAffiliateOrders(
  db: Queryable,
  userId: string,
  params: { limit?: number; offset?: number } = {}
): Promise<AffiliateOrderView[]> {
  const account = await getAffiliateAccount(db, userId);
  if (!account) return [];

  const rows = await db.query.affiliateCommissions.findMany({
    where: and(
      eq(affiliateCommissions.affiliateId, account.affiliateId),
      eq(affiliateCommissions.type, "commission")
    ),
    orderBy: [desc(affiliateCommissions.createdAt)],
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    columns: {
      orderId: true,
      orderEligibleAmount: true,
      status: true,
      createdAt: true,
      commissionAmount: true,
    },
    with: {
      order: {
        columns: { orderNumber: true, status: true, createdAt: true },
      },
    },
  });

  return rows.map((row) => ({
    orderId: row.orderId,
    orderReference: row.order?.orderNumber ?? "",
    orderDate: row.order?.createdAt ?? row.createdAt,
    orderEligibleAmount: row.orderEligibleAmount,
    orderStatus: row.order?.status ?? "pending",
    commissionStatus: row.status as AffiliateOrderView["commissionStatus"],
    yourProfit: row.status === "earned" ? row.commissionAmount : null,
  }));
}
