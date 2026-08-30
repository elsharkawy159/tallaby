export interface SidebarCounts {
  dashboard: number;
  orders: number;
  products: number;
  reviews: number;
  promotions: number;
  marketing: number;
  financial: number;
}

export interface SidebarProps {
  counts: SidebarCounts;
}

export const EMPTY_SIDEBAR_COUNTS: SidebarCounts = {
  dashboard: 0,
  orders: 0,
  products: 0,
  reviews: 0,
  promotions: 0,
  marketing: 0,
  financial: 0,
};

export const SIDEBAR_COUNT_BADGE_CLASS =
  "ml-2 shrink-0 tabular-nums text-[10px] px-1.5 py-0 h-4 min-w-4 font-normal leading-none";
