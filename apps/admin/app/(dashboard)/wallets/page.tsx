import {
  getPayoutRequests,
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
};

export default async function WalletsPage({ searchParams }: WalletsPageProps) {
  const resolved = await searchParams;

  const [statsResult, payoutsResult, walletsResult] = await Promise.all([
    getWalletStats(),
    getPayoutRequests({}),
    getWallets({}),
  ]);

  return (
    <WalletsClientWrapper
      initialStats={statsResult.success ? statsResult.data : EMPTY_STATS}
      initialPayoutRequests={payoutsResult.success ? payoutsResult.data : []}
      initialWallets={walletsResult.success ? walletsResult.data : []}
      initialTab={resolved?.tab === "wallets" ? "wallets" : "payouts"}
    />
  );
}
