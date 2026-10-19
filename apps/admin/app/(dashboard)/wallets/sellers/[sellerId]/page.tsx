import { Suspense } from "react";
import { notFound } from "next/navigation";
import { WalletsTableSkeleton } from "../../wallets.skeleton";
import { StoreWalletTables, type StoreWalletTabData } from "../../store-wallets.client";
import {
  loadSellerWallet,
  loadStoreTopUps,
  loadStoreWalletAudit,
  loadStoreWalletEntries,
  type LoadResult,
} from "../../store-wallets.data";
import {
  parseAuditParams,
  parseStoreTopUpParams,
  parseStoreWalletEntryParams,
  resolveSellerWalletTab,
  STORE_WALLETS_TAB_PARAM,
} from "../../store-wallets.params";
import { SellerWalletOverview } from "./seller-wallet-overview";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SellerWalletPageProps {
  params: Promise<{ sellerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** One seller's store wallet: balance, checks, actions, breakdown, full ledger, top-ups and admin log. */
async function SellerWalletData({ params, searchParams }: SellerWalletPageProps) {
  const [{ sellerId }, query] = await Promise.all([params, searchParams]);
  if (!UUID_RE.test(sellerId)) notFound();

  const header = await loadSellerWallet(sellerId);
  if (!header.ok) return <p className="text-center text-red-600">{header.error}</p>;
  if (!header.data) notFound();

  const tab = resolveSellerWalletTab(query[STORE_WALLETS_TAB_PARAM]);
  let result: LoadResult<{ rows: StoreWalletTabData["rows"]; totalCount: number }>;
  if (tab === "topups") result = await loadStoreTopUps(parseStoreTopUpParams(query, sellerId));
  else if (tab === "audit") result = await loadStoreWalletAudit(parseAuditParams(query, sellerId));
  else result = await loadStoreWalletEntries(parseStoreWalletEntryParams(query, sellerId));

  return (
    <div className="space-y-6">
      <SellerWalletOverview sellerId={sellerId} header={header.data} />
      {!result.ok && <p className="text-center text-red-600">{result.error}</p>}
      <StoreWalletTables
        tabs={[
          { value: "ledger", label: "Transactions" },
          { value: "topups", label: "Top-ups" },
          { value: "audit", label: "Admin log" },
        ]}
        data={{ tab, rows: result.ok ? result.data.rows : [] } as StoreWalletTabData}
        totalCount={result.ok ? result.data.totalCount : 0}
        showSeller={false}
      />
    </div>
  );
}

export default function SellerWalletPage(props: SellerWalletPageProps) {
  return (
    <Suspense fallback={<WalletsTableSkeleton />}>
      <SellerWalletData {...props} />
    </Suspense>
  );
}
