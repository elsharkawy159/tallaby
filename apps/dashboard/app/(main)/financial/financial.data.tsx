import { Suspense } from "react";
import {
  getWalletBalance,
  getPendingEarnings,
  getSellerPayouts,
  getPayoutStats,
  getWalletTransactions,
  getDashboardAnalytics,
} from "@/actions/payouts";
import { FinancialDashboardContent } from "./financial.chunks";
import { FinancialSkeleton } from "./financial.skeleton";

export async function FinancialData() {
  const [walletRes, pendingRes, payoutsRes, statsRes, txRes, analyticsRes] =
    await Promise.all([
      getWalletBalance(),
      getPendingEarnings(),
      getSellerPayouts({ limit: 10 }),
      getPayoutStats(),
      getWalletTransactions({ limit: 20 }),
      getDashboardAnalytics(),
    ]);

  return (
    <FinancialDashboardContent
      wallet={walletRes.success ? walletRes.data : null}
      pending={pendingRes.success ? pendingRes.data : null}
      payouts={payoutsRes.success ? (payoutsRes.data ?? []) : []}
      stats={statsRes.success ? statsRes.data : null}
      transactions={txRes.success ? (txRes.data ?? []) : []}
      analytics={analyticsRes.success ? analyticsRes.data?.sales : null}
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
