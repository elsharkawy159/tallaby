import { Suspense } from "react";
import { db, eq, orderItems, orders, sql } from "@workspace/db";
import {
  getWalletBalance,
  getPendingEarnings,
  getSellerPayouts,
  getPayoutStats,
  getWalletTransactions,
  getDashboardAnalytics,
} from "@/actions/payouts";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { FinancialDashboardContent } from "./financial.chunks";
import { FinancialSkeleton } from "./financial.skeleton";
import { buildSalesSources, startOfMonth, type SalesSourceRow } from "./financial.lib";

/**
 * The seller's earnings grouped by store (NULL = marketplace) and payment
 * method, for this month and all time. Same rows as the "This month sales"
 * card (every order item of this seller, by created_at), so the totals match.
 */
async function getSalesSources() {
  const [seller, { stores }] = await Promise.all([requireSeller(), getSellerStores()]);
  const monthStart = startOfMonth().toISOString();
  const inMonth = sql`${orderItems.createdAt} >= ${monthStart}`;

  const rows = await db
    .select({
      storeId: orders.storeId,
      paymentMethod: orders.paymentMethod,
      monthEarning: sql<string>`coalesce(sum(${orderItems.sellerEarning}) filter (where ${inMonth}), 0)`,
      monthOrders: sql<string>`count(distinct ${orderItems.orderId}) filter (where ${inMonth})`,
      allEarning: sql<string>`coalesce(sum(${orderItems.sellerEarning}), 0)`,
      allOrders: sql<string>`count(distinct ${orderItems.orderId})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orderItems.sellerId, seller.sellerId))
    .groupBy(orders.storeId, orders.paymentMethod);

  const pick = (earning: "monthEarning" | "allEarning", count: "monthOrders" | "allOrders") =>
    rows.map<SalesSourceRow>((r) => ({
      storeId: r.storeId,
      paymentMethod: r.paymentMethod,
      earning: r[earning],
      orders: r[count],
    }));
  const names = stores.map((s) => ({ id: s.id, name: s.name }));

  return {
    month: buildSalesSources(pick("monthEarning", "monthOrders"), names),
    allTime: buildSalesSources(pick("allEarning", "allOrders"), names),
  };
}

export async function FinancialData() {
  const [walletRes, pendingRes, payoutsRes, statsRes, txRes, analyticsRes, sources] =
    await Promise.all([
      getWalletBalance(),
      getPendingEarnings(),
      getSellerPayouts({ limit: 10 }),
      getPayoutStats(),
      getWalletTransactions({ limit: 20 }),
      getDashboardAnalytics(),
      getSalesSources().catch((error) => {
        console.error("[financial] sales sources failed", error);
        return null;
      }),
    ]);

  return (
    <FinancialDashboardContent
      wallet={walletRes.success ? (walletRes.data ?? null) : null}
      pending={pendingRes.success ? (pendingRes.data ?? null) : null}
      payouts={payoutsRes.success ? (payoutsRes.data ?? []) : []}
      stats={statsRes.success ? (statsRes.data ?? null) : null}
      transactions={txRes.success ? (txRes.data ?? []) : []}
      analytics={analyticsRes.success ? (analyticsRes.data?.sales ?? null) : null}
      sources={sources}
    />
  );
}

export function FinancialSection() {
  return (
    <Suspense fallback={<FinancialSkeleton />}>
      <FinancialData />
    </Suspense>
  );
}
