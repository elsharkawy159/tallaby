import {
  STORE_TOP_UP_PROVIDERS,
  STORE_TOP_UP_STATUSES,
  STORE_WALLET_BALANCE_FILTERS,
  STORE_WALLET_ENTRY_TYPES,
  STORE_WALLET_STATUSES,
  type StoreTopUpListInput,
  type StoreWalletEntryListInput,
  type StoreWalletListInput,
} from "@workspace/lib/admin";
import {
  parseTableSearchParams,
  pickAllowed,
  type RawSearchParams,
  type TableSort,
} from "../_components/data-table/search-params";

/**
 * URL contract for the seller (store) wallet screens. `/wallets` shows seller
 * wallets by default; `?scope=customers` shows the customer wallet tabs.
 */
export const WALLETS_SCOPE_PARAM = "scope";
export type WalletsScope = "sellers" | "customers";

export function resolveWalletsScope(value: string | string[] | undefined): WalletsScope {
  return value === "customers" ? "customers" : "sellers";
}

export const STORE_WALLETS_TAB_PARAM = "tab";
export type StoreWalletsTab = "wallets" | "topups" | "ledger" | "audit";
/** Tabs of the one-seller wallet page. */
export type SellerWalletTab = "ledger" | "topups" | "audit";

export const STORE_WALLETS_DEFAULT_SORT: Record<StoreWalletsTab, TableSort | null> = {
  wallets: { id: "balance", desc: false },
  topups: { id: "createdAt", desc: true },
  ledger: { id: "createdAt", desc: true },
  audit: null,
};

export function resolveStoreWalletsTab(value: string | string[] | undefined): StoreWalletsTab {
  return value === "topups" || value === "ledger" || value === "audit" ? value : "wallets";
}

export function resolveSellerWalletTab(value: string | string[] | undefined): SellerWalletTab {
  return value === "topups" || value === "audit" ? value : "ledger";
}

/** Date-range filter id "created" writes `createdFrom` / `createdTo` (YYYY-MM-DD). */
function day(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseStoreWalletListParams(searchParams: RawSearchParams): StoreWalletListInput {
  const query = parseTableSearchParams(searchParams, {
    filters: ["balance", "status", "check"] as const,
    sortable: ["balance", "lastEntryAt", "name"] as const,
    defaultSort: STORE_WALLETS_DEFAULT_SORT.wallets as TableSort<"balance">,
  });
  return {
    limit: query.pageSize,
    offset: query.offset,
    search: query.search || undefined,
    sort: query.sort,
    balance: pickAllowed(query.filters.balance, STORE_WALLET_BALANCE_FILTERS),
    status: pickAllowed(query.filters.status, STORE_WALLET_STATUSES),
    mismatchOnly: query.filters.check.includes("mismatch") || undefined,
  };
}

export function parseStoreWalletEntryParams(searchParams: RawSearchParams, sellerId?: string): StoreWalletEntryListInput {
  const query = parseTableSearchParams(searchParams, {
    filters: ["type"] as const,
    sortable: ["createdAt", "amount"] as const,
    defaultSort: STORE_WALLETS_DEFAULT_SORT.ledger as TableSort<"createdAt">,
  });
  const direction = one(searchParams.direction);
  return {
    limit: query.pageSize,
    offset: query.offset,
    search: query.search || undefined,
    sort: query.sort,
    sellerId,
    type: pickAllowed(query.filters.type, STORE_WALLET_ENTRY_TYPES),
    direction: direction === "credit" || direction === "debit" ? direction : undefined,
    from: day(searchParams.createdFrom),
    to: day(searchParams.createdTo),
  };
}

export function parseStoreTopUpParams(searchParams: RawSearchParams, sellerId?: string): StoreTopUpListInput {
  const query = parseTableSearchParams(searchParams, {
    filters: ["status", "provider"] as const,
    sortable: ["createdAt", "amount"] as const,
    defaultSort: STORE_WALLETS_DEFAULT_SORT.topups as TableSort<"createdAt">,
  });
  return {
    limit: query.pageSize,
    offset: query.offset,
    search: query.search || undefined,
    sort: query.sort,
    sellerId,
    status: pickAllowed(query.filters.status, STORE_TOP_UP_STATUSES),
    provider: pickAllowed(query.filters.provider, STORE_TOP_UP_PROVIDERS),
  };
}

export function parseAuditParams(searchParams: RawSearchParams, sellerId?: string) {
  const query = parseTableSearchParams(searchParams, {});
  return { limit: query.pageSize, offset: query.offset, sellerId };
}
