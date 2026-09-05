export interface SidebarCounts {
  dashboard: number;
  customers: number;
  pendingCarts: number;
  orders: number;
  products: number;
  categories: number;
  brands: number;
  sellers: number;
}

export interface SidebarProps {
  counts: SidebarCounts;
}

export const SIDEBAR_COUNT_BADGE_CLASS =
  "ml-2 shrink-0 tabular-nums text-[11px] px-1.5 py-0 h-4 min-w-4 font-normal leading-none";

export const EMPTY_SIDEBAR_COUNTS: SidebarCounts = {
  dashboard: 0,
  customers: 0,
  pendingCarts: 0,
  orders: 0,
  products: 0,
  categories: 0,
  brands: 0,
  sellers: 0,
};
