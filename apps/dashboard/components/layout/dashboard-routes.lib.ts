import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  LayoutGrid,
  Palette,
  Share2,
  LayoutTemplate,
  Map as MapIcon,
  BarChart3,
  Bike,
  ChartLine,
  CircleHelp,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileBarChart,
  FileText,
  FolderTree,
  Gem,
  Globe,
  Gift,
  HandCoins,
  Images,
  Newspaper,
  MapPinned,
  Package,
  PackagePlus,
  Settings,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Truck,
  Wallet,
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
  // Sidebar groups and items added with the multi-store sitemap (PLAN.md §7.2)
  | "ordersGroup"
  | "deliveryTracking"
  | "fulfillmentShipping"
  | "riders"
  | "shippingSettings"
  | "websiteContent"
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
  | "settingsGroup"
  | "storeSettings"
  | "general"
  | "catalog"
  | "paymentMethods"
  | "myStores"
  | "planUsage"
  | "wallet"
  // Sidebar regrouping (operations / grow / account & help)
  | "walletBalance"
  | "coupons"
  | "campaigns"
  | "accountHelp"
  | "sellerCategories"
  | "storeAnalytics"
  | "roadmap"
  // Affiliate program (F-37)
  | "earn";

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
  { href: "/products", title: "manageProducts", parent: "products", parentHref: "/products", icon: Package },
  { href: "/products/add", title: "addProducts", parent: "products", parentHref: "/products", icon: PackagePlus },
  { href: "/products/categories", title: "sellerCategories", parent: "products", parentHref: "/products", icon: FolderTree },
  { href: "/reviews", title: "reviews", parent: "products", icon: Star },
  { href: "/orders", title: "orders", parent: "ordersGroup", icon: ShoppingBag },
  { href: "/orders/delivery", title: "deliveryTracking", parent: "ordersGroup", icon: Truck },
  { href: "/orders/riders", title: "riders", parent: "fulfillmentShipping", icon: Bike },
  { href: "/stores/[storeId]/shipping", title: "shippingSettings", parent: "fulfillmentShipping", icon: MapPinned },
  { href: "/settings/fulfillment", title: "fulfillment", parent: "fulfillmentShipping", icon: Warehouse },
  { href: "/wallet", title: "walletBalance", parent: "finance", icon: Wallet },
  { href: "/financial", title: "accountStatements", parent: "finance", icon: DollarSign },
  { href: "/reports", title: "reports", parent: "finance", icon: FileBarChart },
  { href: "/stores/[storeId]/website", title: "websiteOverview", parent: "websiteContent", icon: Globe },
  { href: "/stores/[storeId]/editor", title: "websiteBuilder", parent: "websiteContent", icon: LayoutTemplate },
  { href: "/stores/[storeId]/website/templates", title: "templates", parent: "websiteContent", icon: LayoutGrid },
  { href: "/stores/[storeId]/website/design", title: "designSystem", parent: "websiteContent", icon: Palette },
  { href: "/stores/[storeId]/website/domain", title: "domainSeo", parent: "websiteContent", icon: Globe },
  { href: "/stores/[storeId]/website/social", title: "socialMedia", parent: "websiteContent", icon: Share2 },
  { href: "/stores/[storeId]/website/pages", title: "pages", parent: "websiteContent", icon: FileText },
  { href: "/stores/[storeId]/website/blog", title: "blog", parent: "websiteContent", icon: Newspaper },
  { href: "/stores/[storeId]/website/forms", title: "forms", parent: "websiteContent", icon: ClipboardList },
  { href: "/stores/[storeId]/website/media", title: "mediaLibrary", parent: "websiteContent", icon: Images },
  { href: "/coupons", title: "coupons", parent: "marketing", icon: Gift },
  { href: "/marketing", title: "campaigns", parent: "marketing", icon: TrendingUp },
  { href: "/stores/[storeId]/analytics", title: "storeAnalytics", icon: ChartLine },
  { href: "/stores/[storeId]/apps", title: "apps", icon: AppWindow },
  { href: "/stores/[storeId]/settings", title: "general", parent: "settingsGroup", icon: Store },
  { href: "/stores/[storeId]/settings/payments", title: "paymentMethods", parent: "settingsGroup", icon: CreditCard },
  { href: "/stores", title: "myStores", parent: "accountHelp", icon: Store },
  { href: "/settings", title: "settings", parent: "accountHelp", icon: Settings },
  { href: "/settings/plan", title: "planUsage", parent: "accountHelp", icon: Gem },
  { href: "/help", title: "help", parent: "accountHelp", icon: CircleHelp },
  { href: "/roadmap", title: "roadmap", parent: "accountHelp", icon: MapIcon },
  { href: "/earn", title: "earn", parent: "accountHelp", icon: HandCoins },
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
