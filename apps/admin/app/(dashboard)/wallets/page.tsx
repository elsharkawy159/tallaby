import {
  getPayoutRequests,
  getTopUpRequests,
  getWalletStats,
  getWallets,
} from "./wallets.server";
import { WalletsClientWrapper } from "./wallets.client";
import type { WalletsPageProps } from "./wallets.types";

const EMPTY_STATS = {
  totalWallets: 0,
  totalBalance: "0",
  totalReserved: "0",
  pendingPayouts: 0,
  pendingPayoutAmount: "0",
  pendingTopUps: 0,
  pendingTopUpAmount: "0",
};

function resolveInitialTab(tab: string | undefined): string {
  if (tab === "wallets") return "wallets";
  if (tab === "topups") return "topups";
  return "payouts";
}

export default async function WalletsPage({ searchParams }: WalletsPageProps) {
  const resolved = await searchParams;

  const [statsResult, payoutsResult, topUpsResult, walletsResult] =
    await Promise.all([
      getWalletStats(),
      getPayoutRequests({}),
      getTopUpRequests({}),
      getWallets({}),
    ]);

  return (
    <WalletsClientWrapper
      initialStats={statsResult.success ? statsResult.data : EMPTY_STATS}
      initialPayoutRequests={payoutsResult.success ? payoutsResult.data : []}
      initialTopUpRequests={topUpsResult.success ? topUpsResult.data : []}
      initialWallets={walletsResult.success ? walletsResult.data : []}
      initialTab={resolveInitialTab(resolved?.tab)}
    />
  );
}
