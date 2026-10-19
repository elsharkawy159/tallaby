"use client";

import { useMemo } from "react";
import type {
  AdminStoreWalletEntryRow,
  AdminStoreWalletRow,
  StoreWalletAuditRow,
} from "@workspace/lib/admin/server";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

import { DataTable } from "../_components/data-table/data-table";
import { PAGE_PARAM, SEARCH_PARAM, SORT_PARAM } from "../_components/data-table/search-params";
import { useTableUrlState } from "../_components/data-table/use-table-url-state";
import {
  getStoreTopUpColumns,
  getStoreWalletAuditColumns,
  getStoreWalletColumns,
  getStoreWalletEntryColumns,
  storeTopUpFilters,
  storeWalletEntryFilters,
  storeWalletFilters,
} from "./_components/store-wallet-columns";
import type { StoreTopUpWithProof } from "./store-wallets.data";
import { STORE_WALLETS_DEFAULT_SORT, STORE_WALLETS_TAB_PARAM, type StoreWalletsTab } from "./store-wallets.params";

export type StoreWalletTabData =
  | { tab: "wallets"; rows: AdminStoreWalletRow[] }
  | { tab: "topups"; rows: StoreTopUpWithProof[] }
  | { tab: "ledger"; rows: AdminStoreWalletEntryRow[] }
  | { tab: "audit"; rows: StoreWalletAuditRow[] };

/** Every table param any tab uses; switching tabs clears them so each tab starts fresh. */
const TABLE_PARAMS = [
  "status",
  "balance",
  "check",
  "type",
  "direction",
  "provider",
  "createdFrom",
  "createdTo",
  SEARCH_PARAM,
  SORT_PARAM,
  PAGE_PARAM,
];

const SEARCH: Record<StoreWalletsTab, string | undefined> = {
  wallets: "Search seller name or email…",
  topups: "Search seller, reference or phone…",
  ledger: "Search seller, description, reference or order id…",
  audit: undefined,
};

/**
 * Tabs plus one server-paged table for the seller (store) wallet screens.
 * Used by /wallets (all sellers) and /wallets/sellers/[sellerId] (one seller,
 * `showSeller` false). Row actions refresh the server page themselves.
 */
export function StoreWalletTables({
  tabs,
  data,
  totalCount,
  showSeller,
}: {
  tabs: { value: StoreWalletsTab; label: string }[];
  data: StoreWalletTabData;
  totalCount: number;
  showSeller: boolean;
}) {
  const url = useTableUrlState();
  const defaultTab = tabs[0]!.value;

  const walletColumns = useMemo(() => getStoreWalletColumns(), []);
  const entryColumns = useMemo(() => getStoreWalletEntryColumns({ showSeller }), [showSeller]);
  const topUpColumns = useMemo(() => getStoreTopUpColumns({ showSeller }), [showSeller]);
  const auditColumns = useMemo(() => getStoreWalletAuditColumns({ showSeller }), [showSeller]);

  const serverSide = {
    rowCount: totalCount,
    defaultSort: STORE_WALLETS_DEFAULT_SORT[data.tab],
    searchPlaceholder: SEARCH[data.tab],
  };
  const common = { enableRowSelection: false, serverSide, isLoading: url.isPending };

  return (
    <div className="space-y-4">
      <Tabs
        value={data.tab}
        onValueChange={(value) =>
          url.setParams({
            [STORE_WALLETS_TAB_PARAM]: value === defaultTab ? null : value,
            ...Object.fromEntries(TABLE_PARAMS.map((key) => [key, null])),
          })
        }
      >
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {data.tab === "wallets" && (
        <DataTable
          key="wallets"
          {...common}
          columns={walletColumns}
          data={data.rows}
          getRowId={(row) => row.sellerId}
          filterableColumns={storeWalletFilters}
          emptyMessage="No seller wallets match these filters."
        />
      )}
      {data.tab === "topups" && (
        <DataTable
          key="topups"
          {...common}
          columns={topUpColumns}
          data={data.rows}
          getRowId={(row) => row.id}
          filterableColumns={storeTopUpFilters}
          emptyMessage="No top-ups match these filters."
        />
      )}
      {data.tab === "ledger" && (
        <DataTable
          key="ledger"
          {...common}
          columns={entryColumns}
          data={data.rows}
          getRowId={(row) => row.id}
          filterableColumns={storeWalletEntryFilters}
          emptyMessage="No transactions match these filters."
        />
      )}
      {data.tab === "audit" && (
        <DataTable
          key="audit"
          {...common}
          columns={auditColumns}
          data={data.rows}
          getRowId={(row) => row.id}
          emptyMessage="No admin wallet actions yet."
        />
      )}
    </div>
  );
}
