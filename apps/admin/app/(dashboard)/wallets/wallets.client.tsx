"use client";

import { useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

import { DataTable } from "../_components/data-table/data-table";
import {
  PAGE_PARAM,
  SEARCH_PARAM,
  SORT_PARAM,
} from "../_components/data-table/search-params";
import { useTableUrlState } from "../_components/data-table/use-table-url-state";
import {
  getPayoutColumns,
  getTopUpColumns,
  getWalletColumns,
  payoutFilters,
  topUpFilters,
  walletFilters,
} from "./_components/table-columns";
import { WalletStatsCards } from "./wallets.chunks";
import {
  WALLETS_DEFAULT_SORT,
  WALLETS_TAB_PARAM,
  type WalletsTab,
} from "./wallets.params";
import type {
  PayoutRequestRow,
  TopUpRequestRow,
  WalletRow,
  WalletStats,
} from "./wallets.types";

type WalletsTabData =
  | { tab: "payouts"; rows: PayoutRequestRow[] }
  | { tab: "topups"; rows: TopUpRequestRow[] }
  | { tab: "wallets"; rows: WalletRow[] };

const SEARCH_PLACEHOLDER = "Search by name or email…";

export function WalletsClientWrapper({
  stats,
  data,
  totalCount,
}: {
  stats: WalletStats;
  data: WalletsTabData;
  totalCount: number;
}) {
  const router = useRouter();
  const url = useTableUrlState();
  const [isRefreshing, startRefresh] = useTransition();

  // Row actions change balances and counts; re-render the server page in place.
  const refresh = useCallback(() => {
    startRefresh(() => router.refresh());
  }, [router]);

  const payoutColumns = useMemo(() => getPayoutColumns(refresh), [refresh]);
  const topUpColumns = useMemo(() => getTopUpColumns(refresh), [refresh]);
  const walletColumns = useMemo(() => getWalletColumns(), []);

  const serverSide = {
    rowCount: totalCount,
    defaultSort: WALLETS_DEFAULT_SORT[data.tab],
    searchPlaceholder: SEARCH_PLACEHOLDER,
  };

  const topUpsTabLabel =
    stats.pendingTopUps > 0 ? `Top-ups (${stats.pendingTopUps})` : "Top-ups";
  const payoutsTabLabel =
    stats.pendingPayouts > 0
      ? `Payout requests (${stats.pendingPayouts})`
      : "Payout requests";

  return (
    <div className="space-y-6">
      <WalletStatsCards stats={stats} />

      <Tabs
        value={data.tab}
        onValueChange={(value) =>
          url.setParams({
            [WALLETS_TAB_PARAM]: value === "payouts" ? null : (value as WalletsTab),
            // The tabs share table params; start each tab fresh.
            status: null,
            [SEARCH_PARAM]: null,
            [SORT_PARAM]: null,
            [PAGE_PARAM]: null,
          })
        }
      >
        <TabsList>
          <TabsTrigger value="payouts">{payoutsTabLabel}</TabsTrigger>
          <TabsTrigger value="topups">{topUpsTabLabel}</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
        </TabsList>
      </Tabs>

      {data.tab === "payouts" && (
        <DataTable
          key="payouts"
          columns={payoutColumns}
          data={data.rows}
          getRowId={(row) => row.id}
          filterableColumns={payoutFilters}
          enableRowSelection={false}
          isLoading={isRefreshing}
          emptyMessage="No payout requests match these filters."
          serverSide={serverSide}
        />
      )}
      {data.tab === "topups" && (
        <DataTable
          key="topups"
          columns={topUpColumns}
          data={data.rows}
          getRowId={(row) => row.id}
          filterableColumns={topUpFilters}
          enableRowSelection={false}
          isLoading={isRefreshing}
          emptyMessage="No top-up requests match these filters."
          serverSide={serverSide}
        />
      )}
      {data.tab === "wallets" && (
        <DataTable
          key="wallets"
          columns={walletColumns}
          data={data.rows}
          getRowId={(row) => row.id}
          filterableColumns={walletFilters}
          enableRowSelection={false}
          isLoading={isRefreshing}
          emptyMessage="No wallets match these filters."
          serverSide={serverSide}
        />
      )}
    </div>
  );
}
