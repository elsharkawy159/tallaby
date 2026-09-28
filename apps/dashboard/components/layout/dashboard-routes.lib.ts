import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CircleHelp,
  DollarSign,
  FileBarChart,
  Gift,
  Package,
  PackagePlus,
  Settings,
  ShoppingBag,
  Star,
  TrendingUp,
  Truck,
  Warehouse,
} from "lucide-react";

/** Keys under the `nav` message namespace. */
export type NavKey =
  | "dashboard"
  | "orders"
  | "shipping"
  | "products"
  | "manageProducts"
  | "addProducts"
  | "editProduct"
  | "reviews"
  | "promotions"
  | "advertiseProducts"
  | "accountStatements"
  | "reports"
  | "help"
  | "settings"
  | "fulfillment";

export interface DashboardRoute {
  href: string;
  title: NavKey;
  /** Section shown before the title in the header, e.g. Products › Add products. */
  parent?: NavKey;
  parentHref?: string;
  icon: LucideIcon;
}

/** Every page reachable from the command palette, in sidebar order. */
export const DASHBOARD_ROUTES: DashboardRoute[] = [
  { href: "/", title: "dashboard", icon: BarChart3 },
  { href: "/orders", title: "orders", icon: ShoppingBag },
  { href: "/shipping", title: "shipping", icon: Truck },
  { href: "/products", title: "manageProducts", parent: "products", parentHref: "/products", icon: Package },
  { href: "/products/add", title: "addProducts", parent: "products", parentHref: "/products", icon: PackagePlus },
  { href: "/reviews", title: "reviews", icon: Star },
  { href: "/coupons", title: "promotions", icon: Gift },
  { href: "/marketing", title: "advertiseProducts", icon: TrendingUp },
  { href: "/financial", title: "accountStatements", icon: DollarSign },
  { href: "/reports", title: "reports", icon: FileBarChart },
  { href: "/settings", title: "settings", icon: Settings },
  { href: "/settings/fulfillment", title: "fulfillment", parent: "settings", parentHref: "/settings", icon: Warehouse },
  { href: "/help", title: "help", icon: CircleHelp },
];

const EDIT_PRODUCT: DashboardRoute = {
  href: "/products",
  title: "editProduct",
  parent: "products",
  parentHref: "/products",
  icon: Package,
};

/** Resolve the header title for a pathname; falls back to the closest section. */
export function resolveDashboardRoute(pathname: string): DashboardRoute {
  if (/^\/products\/[^/]+\/edit\/?$/.test(pathname)) return EDIT_PRODUCT;

  const exact = DASHBOARD_ROUTES.find((route) => route.href === pathname);
  if (exact) return exact;

  // Longest prefix wins so /settings/x resolves to Settings, not Dashboard.
  const prefix = DASHBOARD_ROUTES.filter(
    (route) => route.href !== "/" && pathname.startsWith(`${route.href}/`)
  ).sort((a, b) => b.href.length - a.href.length)[0];

  return prefix ?? DASHBOARD_ROUTES[0]!;
}
