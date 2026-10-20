"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";

import {
  PayoutRequestList,
  WalletBalanceCard,
  WalletTransactionList,
} from "./_components/wallet.chunks";
import { WALLET_TRANSACTIONS_PAGE_SIZE } from "./_components/wallet.lib";
import { getWalletTransactions } from "./_components/wallet.server";
import type {
  WalletOverview,
  WalletTransactionView,
} from "./_components/wallet.types";

export function WalletClient({ overview }: { overview: WalletOverview }) {
  const t = useTranslations("wallet");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoadingMore, startLoadingMore] = useTransition();

  const [transactions, setTransactions] = useState<WalletTransactionView[]>(
    overview.transactions
  );
  const [hasMore, setHasMore] = useState(
    overview.transactions.length === WALLET_TRANSACTIONS_PAGE_SIZE
  );

  // Server-rendered data is the source of truth; re-sync whenever the page
  // re-renders after a mutation (revalidatePath) so the list never drifts.
  useEffect(() => {
    setTransactions(overview.transactions);
    setHasMore(overview.transactions.length === WALLET_TRANSACTIONS_PAGE_SIZE);
  }, [overview.transactions]);

  /**
   * Legacy Paymob redirect lands here with ?topup=. Manual top-ups no longer
   * use this; kept so a late card-payment return still shows a waiting toast.
   */
  const topUpId = searchParams.get("topup");
  useEffect(() => {
    if (!topUpId) return;
    toast.info(t("topUpProcessing"));
    router.replace("/profile/wallet");
  }, [topUpId, router, t]);

  const handleLoadMore = () => {
    startLoadingMore(async () => {
      const result = await getWalletTransactions({
        limit: WALLET_TRANSACTIONS_PAGE_SIZE,
        offset: transactions.length,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setTransactions((current) => [...current, ...result.data]);
      setHasMore(result.data.length === WALLET_TRANSACTIONS_PAGE_SIZE);
    });
  };

  return (
    <div className="space-y-6">
      <WalletBalanceCard
        wallet={overview.wallet}
        canRequestPayout={overview.canRequestPayout}
        hasOpenPayoutRequest={overview.hasOpenPayoutRequest}
      />

      <PayoutRequestList requests={overview.payoutRequests} />

      <WalletTransactionList
        transactions={transactions}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
      />
    </div>
  );
}
