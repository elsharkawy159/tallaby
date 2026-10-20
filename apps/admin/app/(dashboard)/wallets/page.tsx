import { Suspense } from "react";
import {
  getPayoutRequests,
  getTopUpRequests,
  getWalletStats,
  getWallets,
} from "./wallets.server";
import { WalletsClientWrapper } from "./wallets.client";
import { parseWalletsParams } from "./wallets.params";
import { WalletsTableSkeleton } from "./wallets.skeleton";
import { StoreWalletTables, type StoreWalletTabData } from "./store-wallets.client";
import { StoreWalletTotalsCards, WalletsScopeNav } from "./store-wallets.chunks";
import {
  loadStoreTopUps,
  loadStoreWalletAudit,
  loadStoreWalletEntries,
  loadStoreWalletTotals,
  loadStoreWallets,
  type LoadResult,
} from "./store-wallets.data";
import {
  parseAuditParams,
  parseStoreTopUpParams,
  parseStoreWalletEntryParams,
  parseStoreWalletListParams,
  resolveStoreWalletsTab,
  resolveWalletsScope,
  STORE_WALLETS_TAB_PARAM,
  WALLETS_SCOPE_PARAM,
} from "./store-wallets.params";
import type {
  PayoutRequestFilters,
  TopUpRequestFilters,
  WalletFilters,
  WalletsPageProps,
} from "./wallets.types";

export const dynamic = "force-dynamic";

const EMPTY_STATS = {
  totalWallets: 0,
  totalBalance: "0",
  totalReserved: "0",
  pendingPayouts: 0,
  pendingPayoutAmount: "0",
  pendingTopUps: 0,
  pendingTopUpAmount: "0",
};

/**
 * Seller (store) wallets: the seller ledger every order fee, sale, top-up and
 * adjustment goes through. Loaded one tab at a time, sequentially for the DB
 * pool. Writes happen in the row and seller-page actions, never here.
 */
async function StoreWalletsPageData({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const tab = resolveStoreWalletsTab(searchParams[STORE_WALLETS_TAB_PARAM]);
  const totals = await loadStoreWalletTotals();

  let result: LoadResult<{ rows: StoreWalletTabData["rows"]; totalCount: number }>;
  if (tab === "topups") result = await loadStoreTopUps(parseStoreTopUpParams(searchParams));
  else if (tab === "ledger") result = await loadStoreWalletEntries(parseStoreWalletEntryParams(searchParams));
  else if (tab === "audit") result = await loadStoreWalletAudit(parseAuditParams(searchParams));
  else result = await loadStoreWallets(parseStoreWalletListParams(searchParams));

  const pendingReview = totals.ok ? totals.data.pendingReviewCount : 0;
  const tabs = [
    { value: "wallets" as const, label: "Wallets" },
    { value: "topups" as const, label: pendingReview > 0 ? `Top-ups (${pendingReview} to review)` : "Top-ups" },
    { value: "ledger" as const, label: "Transactions" },
    { value: "audit" as const, label: "Admin log" },
  ];

  return (
    <div className="space-y-6">
      {totals.ok ? <StoreWalletTotalsCards totals={totals.data} /> : <LoadError message={totals.error} />}
      {!result.ok && <LoadError message={result.error} />}
      <StoreWalletTables
        tabs={tabs}
        data={{ tab, rows: result.ok ? result.data.rows : [] } as StoreWalletTabData}
        totalCount={result.ok ? result.data.totalCount : 0}
        showSeller
      />
    </div>
  );
}

async function CustomerWalletsPageData({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { tab, query } = parseWalletsParams(searchParams);
  // Only the visible tab's table is loaded; sequential for the DB pool.
  const statsResult = await getWalletStats();
  const stats = statsResult.success ? statsResult.data : EMPTY_STATS;

  if (tab === "wallets") {
    const result = await getWallets(query as WalletFilters);
    return (
      <>
        {!result.success && <LoadError message={result.error} />}
        <WalletsClientWrapper
          stats={stats}
          data={{ tab, rows: result.success ? result.data.rows : [] }}
          totalCount={result.success ? result.data.totalCount : 0}
        />
      </>
    );
  }

  if (tab === "topups") {
    const result = await getTopUpRequests(query as TopUpRequestFilters);
    return (
      <>
        {!result.success && <LoadError message={result.error} />}
        <WalletsClientWrapper
          stats={stats}
          data={{ tab, rows: result.success ? result.data.rows : [] }}
          totalCount={result.success ? result.data.totalCount : 0}
        />
      </>
    );
  }

  const result = await getPayoutRequests(query as PayoutRequestFilters);
  return (
    <>
      {!result.success && <LoadError message={result.error} />}
      <WalletsClientWrapper
        stats={stats}
        data={{ tab, rows: result.success ? result.data.rows : [] }}
        totalCount={result.success ? result.data.totalCount : 0}
      />
    </>
  );
}

async function WalletsPageData({ searchParams }: WalletsPageProps) {
  const params = await searchParams;
  const scope = resolveWalletsScope(params[WALLETS_SCOPE_PARAM]);
  return (
    <div className="space-y-6">
      <WalletsScopeNav scope={scope} />
      {scope === "customers" ? (
        <CustomerWalletsPageData searchParams={params} />
      ) : (
        <StoreWalletsPageData searchParams={params} />
      )}
    </div>
  );
}

function LoadError({ message }: { message: string }) {
  return <p className="text-center text-red-600">{message}</p>;
}

export default function WalletsPage({ searchParams }: WalletsPageProps) {
  return (
    <Suspense fallback={<WalletsTableSkeleton />}>
      <WalletsPageData searchParams={searchParams} />
    </Suspense>
  );
}
