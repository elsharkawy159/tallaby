export interface SidebarCounts {
  dashboard: number;
  orders: number;
  shipping: number;
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
  shipping: 0,
  products: 0,
  reviews: 0,
  promotions: 0,
  marketing: 0,
  financial: 0,
};

