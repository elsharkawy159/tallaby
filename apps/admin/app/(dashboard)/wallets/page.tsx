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

async function WalletsPageData({ searchParams }: WalletsPageProps) {
  const { tab, query } = parseWalletsParams(await searchParams);
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
