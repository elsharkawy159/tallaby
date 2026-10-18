import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  LayoutTemplate,
  BarChart3,
  Bike,
  CircleHelp,
  CreditCard,
  DollarSign,
  FileBarChart,
  Gem,
  Gift,
  Images,
  MapPinned,
  Package,
  PackagePlus,
  ScrollText,
  Settings,
  ShoppingBag,
  Star,
  Store,
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
  | "fulfillment"
  | "account"
  // Sidebar groups and items added with the multi-store sitemap (PLAN.md §7.2)
  | "ordersShipping"
  | "deliveryTracking"
  | "riders"
  | "shippingSettings"
  | "website"
  | "websiteOverview"
  | "websiteBuilder"
  | "templates"
  | "designSystem"
  | "pages"
  | "domainSeo"
  | "socialMedia"
  | "blog"
  | "forms"
  | "mediaLibrary"
  | "marketing"
  | "apps"
  | "finance"
  | "storeSettings"
  | "general"
  | "catalog"
  | "paymentMethods"
  | "policies"
  | "myStores"
  | "planUsage";

export interface DashboardRoute {
  /** A path, or a pattern with `[storeId]` for store-scoped pages. */
  href: string;
  title: NavKey;
  /** Section shown before the title in the header, e.g. Products › Add products. */
  parent?: NavKey;
  parentHref?: string;
  icon: LucideIcon;
}

/**
 * Every dashboard page, in sidebar order. Used by the command palette and the
 * header title; the sidebar config test checks every sidebar link is here.
 */
export const DASHBOARD_ROUTES: DashboardRoute[] = [
  { href: "/", title: "dashboard", icon: BarChart3 },
  { href: "/orders", title: "orders", parent: "ordersShipping", icon: ShoppingBag },
  { href: "/orders/delivery", title: "deliveryTracking", parent: "ordersShipping", icon: Truck },
  { href: "/orders/riders", title: "riders", parent: "ordersShipping", icon: Bike },
  { href: "/stores/[storeId]/shipping", title: "shippingSettings", parent: "ordersShipping", icon: MapPinned },
  { href: "/products", title: "manageProducts", parent: "products", parentHref: "/products", icon: Package },
  { href: "/products/add", title: "addProducts", parent: "products", parentHref: "/products", icon: PackagePlus },
  { href: "/reviews", title: "reviews", parent: "products", icon: Star },
  { href: "/coupons", title: "promotions", parent: "marketing", icon: Gift },
  { href: "/marketing", title: "advertiseProducts", parent: "marketing", icon: TrendingUp },
  { href: "/stores/[storeId]/editor", title: "websiteBuilder", parent: "website", icon: LayoutTemplate },
  { href: "/stores/[storeId]/website/media", title: "mediaLibrary", parent: "website", icon: Images },
  { href: "/stores/[storeId]/apps", title: "apps", icon: AppWindow },
  { href: "/financial", title: "accountStatements", parent: "finance", icon: DollarSign },
  { href: "/reports", title: "reports", parent: "finance", icon: FileBarChart },
  { href: "/stores/[storeId]/settings", title: "general", parent: "storeSettings", icon: Store },
  { href: "/stores/[storeId]/settings/catalog", title: "catalog", parent: "storeSettings", icon: Package },
  { href: "/stores/[storeId]/settings/payments", title: "paymentMethods", parent: "storeSettings", icon: CreditCard },
  { href: "/stores/[storeId]/settings/policies", title: "policies", parent: "storeSettings", icon: ScrollText },
  { href: "/stores", title: "myStores", parent: "account", icon: Store },
  { href: "/settings", title: "settings", parent: "account", icon: Settings },
  { href: "/settings/plan", title: "planUsage", parent: "account", icon: Gem },
  { href: "/settings/fulfillment", title: "fulfillment", parent: "settings", parentHref: "/settings", icon: Warehouse },
  { href: "/help", title: "help", parent: "account", icon: CircleHelp },
];

const EDIT_PRODUCT: DashboardRoute = {
  href: "/products",
  title: "editProduct",
  parent: "products",
  parentHref: "/products",
  icon: Package,
};

const UUID = "[0-9a-fA-F-]{36}";

function routeRegex(href: string, prefix: boolean): RegExp {
  const escaped = href
    .split("[storeId]")
    .map((part) => part.replace(/[.*+?^${}()|\\]/g, "\\$&"))
    .join(UUID);
  return new RegExp(`^${escaped}${prefix ? "/" : "/?$"}`);
}

/** True for store-scoped route patterns such as `/stores/[storeId]/settings`. */
export const isStoreScopedHref = (href: string) => href.includes("[storeId]");

/** Resolve the header title for a pathname; falls back to the closest section. */
export function resolveDashboardRoute(pathname: string): DashboardRoute {
  if (/^\/products\/[^/]+\/edit\/?$/.test(pathname)) return EDIT_PRODUCT;

  const exact = DASHBOARD_ROUTES.find((route) => routeRegex(route.href, false).test(pathname));
  if (exact) return exact;

  // Longest prefix wins so /settings/x resolves to Settings, not Dashboard.
  const prefix = DASHBOARD_ROUTES.filter(
    (route) => route.href !== "/" && routeRegex(route.href, true).test(pathname)
  ).sort((a, b) => b.href.length - a.href.length)[0];

  return prefix ?? DASHBOARD_ROUTES[0]!;
}
