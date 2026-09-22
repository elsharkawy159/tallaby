import {
  parseTableSearchParams,
  pickAllowed,
  type RawSearchParams,
  type TableSort,
} from "../_components/data-table/search-params";
import type {
  PayoutRequestFilters,
  PayoutRequestSortId,
  TopUpRequestFilters,
  TopUpRequestSortId,
  WalletFilters,
  WalletSortId,
} from "./wallets.types";
import {
  PAYOUT_STATUS_OPTIONS,
  TOP_UP_STATUS_OPTIONS,
  WALLET_STATUS_OPTIONS,
} from "./wallets.lib";

const STATUSES = {
  payouts: PAYOUT_STATUS_OPTIONS.map((option) => option.value),
  topups: TOP_UP_STATUS_OPTIONS.map((option) => option.value),
  wallets: WALLET_STATUS_OPTIONS.map((option) => option.value),
};

export const WALLETS_TAB_PARAM = "tab";
export type WalletsTab = "payouts" | "topups" | "wallets";

export const WALLETS_DEFAULT_SORT: Record<WalletsTab, TableSort> = {
  payouts: { id: "createdAt", desc: true },
  topups: { id: "createdAt", desc: true },
  wallets: { id: "balance", desc: true },
};

const SORTABLE = {
  payouts: ["createdAt", "amount"] as readonly PayoutRequestSortId[],
  topups: ["createdAt", "amount"] as readonly TopUpRequestSortId[],
  wallets: ["availableBalance", "balance", "createdAt"] as readonly WalletSortId[],
};

export function resolveWalletsTab(value: string | string[] | undefined): WalletsTab {
  if (value === "wallets") return "wallets";
  if (value === "topups") return "topups";
  return "payouts";
}

/**
 * One table is visible at a time, so the tabs share the table params
 * (page/sort/search/status); switching tabs clears them.
 */
export function parseWalletsParams(searchParams: RawSearchParams) {
  const tab = resolveWalletsTab(searchParams[WALLETS_TAB_PARAM]);
  const query = parseTableSearchParams(searchParams, {
    filters: ["status"] as const,
    sortable: SORTABLE[tab],
    defaultSort: WALLETS_DEFAULT_SORT[tab],
  });

  // Drop unknown statuses so the zod DTO doesn't reject the whole request.
  const status = pickAllowed(query.filters.status, STATUSES[tab]);
  const base = {
    limit: query.pageSize,
    offset: query.offset,
    search: query.search || undefined,
  };

  switch (tab) {
    case "wallets":
      return {
        tab,
        query: {
          ...base,
          status,
          sort: query.sort,
        } as WalletFilters,
      };
    case "topups":
      return {
        tab,
        query: {
          ...base,
          status,
          sort: query.sort,
        } as TopUpRequestFilters,
      };
    default:
      return {
        tab,
        query: {
          ...base,
          status,
          sort: query.sort,
        } as PayoutRequestFilters,
      };
  }
}
