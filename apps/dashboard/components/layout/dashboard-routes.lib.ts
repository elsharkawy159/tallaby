import type { LucideIcon } from "lucide-react";
import { STORE_PRODUCTS_PATTERN as PRODUCTS } from "@/lib/products/product-routes.lib";
import { TALLABY_SERVICES_ENABLED } from "@workspace/lib/fulfillment";
import {
  AppWindow,
  BadgePercent,
  PhoneMissed,
  // ScanBarcode, // scan returns hidden (owner, 2026-10-31)
  LayoutGrid,
  Palette,
  Share2,
  LayoutTemplate,
  Map as MapIcon,
  LayoutDashboard,
  Bike,
  ChartLine,
  CircleHelp,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileBarChart,
  FileText,
  FolderTree,
  Trash2,
  Boxes,
  Gem,
  Globe,
  SearchCheck,
  Gift,
  Percent,
  HandCoins,
  Images,
  Mail,
  MailCheck,
  Newspaper,
  MapPinned,
  Package,
  PackagePlus,
  Settings,
  ShieldCheck,
  Smartphone,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  TrendingUp,
  Truck,
  Users,
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
  | "missedOrders"
  | "pendingCarts"
  | "crossSellReport"
  | "customers"
  | "scanReturns"
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
  | "seo"
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
  | "checkoutForm"
  | "orderProtection"
  | "storeApp"
  | "salesPopup"
  | "myStores"
  | "planUsage"
  | "wallet"
  // Sidebar regrouping (operations / grow / account & help)
  | "walletBalance"
  | "coupons"
  | "campaigns"
  | "subscribers"
  | "automaticDiscounts"
  | "emailCampaigns"
  | "catalogShare"
  | "accountHelp"
  | "sellerCategories"
  | "productTrash"
  | "inventory"
  | "storeAnalytics"
  | "roadmap"
  // Affiliate program (F-37)
  | "earn"
  // Sidebar section headings
  | "sectionSell"
  | "sectionStore"
  | "sectionAccount";

export interface DashboardRoute {
  /** A path, or a pattern with `[storeId]` for store-scoped pages. */
  href: string;
  title: NavKey;
  /** Section shown before the title in the header, e.g. Products › Add products. */
  parent?: NavKey;
  parentHref?: string;
  icon: LucideIcon;
  /** Keeps its header title but stays out of the command palette. */
  hiddenFromPalette?: boolean;
}

/**
 * Every dashboard page, in sidebar order. Used by the command palette and the
 * header title; the sidebar config test checks every sidebar link is here.
 * /marketing and Store views have no sidebar link but keep their header title.
 */
export const DASHBOARD_ROUTES: DashboardRoute[] = [
  { href: "/", title: "dashboard", icon: LayoutDashboard },
  // Under their store since F-87c; the old /products URLs redirect there.
  { href: PRODUCTS, title: "manageProducts", parent: "products", parentHref: PRODUCTS, icon: Package },
  { href: `${PRODUCTS}/add`, title: "addProducts", parent: "products", parentHref: PRODUCTS, icon: PackagePlus },
  { href: `${PRODUCTS}/categories`, title: "sellerCategories", parent: "products", parentHref: PRODUCTS, icon: FolderTree },
  { href: `${PRODUCTS}/inventory`, title: "inventory", parent: "products", parentHref: PRODUCTS, icon: Boxes },
  { href: `${PRODUCTS}/trash`, title: "productTrash", parent: "products", parentHref: PRODUCTS, icon: Trash2 },
  { href: "/reviews", title: "reviews", parent: "products", icon: Star },
  { href: "/orders", title: "orders", parent: "ordersGroup", icon: ShoppingBag },
  { href: "/orders/missed", title: "missedOrders", parent: "ordersGroup", icon: PhoneMissed },
  { href: "/orders/pending-carts", title: "pendingCarts", parent: "ordersGroup", icon: ShoppingCart },
  { href: "/orders/cross-sell", title: "crossSellReport", parent: "ordersGroup", icon: BadgePercent },
  { href: "/orders/customers", title: "customers", parent: "ordersGroup", icon: Users },
  // Scan returns hidden for now (owner, 2026-10-31).
  // { href: "/orders/scan", title: "scanReturns", parent: "ordersGroup", icon: ScanBarcode },
  { href: "/orders/delivery", title: "deliveryTracking", parent: "fulfillmentShipping", icon: Truck },
  { href: "/orders/riders", title: "riders", parent: "fulfillmentShipping", icon: Bike },
  { href: "/stores/[storeId]/shipping", title: "shippingSettings", parent: "fulfillmentShipping", icon: MapPinned },
  // Hidden while Tallaby offers no storage, packing or delivery (owner, 2026-10-31).
  ...(TALLABY_SERVICES_ENABLED
    ? [{ href: "/settings/fulfillment", title: "fulfillment", parent: "fulfillmentShipping", icon: Warehouse } satisfies DashboardRoute]
    : []),
  { href: "/wallet", title: "walletBalance", parent: "finance", icon: Wallet },
  { href: "/financial", title: "accountStatements", parent: "finance", icon: DollarSign },
  { href: "/reports", title: "reports", parent: "finance", icon: FileBarChart },
  { href: "/stores/[storeId]/website", title: "websiteOverview", parent: "websiteContent", icon: Globe },
  { href: "/stores/[storeId]/editor", title: "websiteBuilder", parent: "websiteContent", icon: LayoutTemplate },
  { href: "/stores/[storeId]/website/templates", title: "templates", parent: "websiteContent", icon: LayoutGrid },
  { href: "/stores/[storeId]/website/design", title: "designSystem", parent: "websiteContent", icon: Palette },
  { href: "/stores/[storeId]/website/domain", title: "domainSeo", parent: "websiteContent", icon: Globe },
  { href: "/stores/[storeId]/website/seo", title: "seo", parent: "websiteContent", icon: SearchCheck },
  { href: "/stores/[storeId]/website/social", title: "socialMedia", parent: "websiteContent", icon: Share2 },
  { href: "/stores/[storeId]/website/pages", title: "pages", parent: "websiteContent", icon: FileText },
  { href: "/stores/[storeId]/website/blog", title: "blog", parent: "websiteContent", icon: Newspaper },
  { href: "/stores/[storeId]/website/forms", title: "forms", parent: "websiteContent", icon: ClipboardList },
  { href: "/stores/[storeId]/website/media", title: "mediaLibrary", parent: "websiteContent", icon: Images },
  { href: "/coupons", title: "coupons", parent: "marketing", icon: Gift },
  { href: "/marketing/discounts", title: "automaticDiscounts", parent: "marketing", icon: Percent },
  // Paid ads: reachable only by its URL for now (owner, 2026-11-04, F-65a).
  { href: "/marketing", title: "campaigns", parent: "marketing", icon: TrendingUp, hiddenFromPalette: true },
  { href: "/marketing/subscribers", title: "subscribers", parent: "marketing", icon: MailCheck },
  { href: "/marketing/emails", title: "emailCampaigns", parent: "marketing", icon: Mail },
  { href: "/marketing/catalog", title: "catalogShare", parent: "marketing", icon: Share2 },
  { href: "/stores/[storeId]/analytics", title: "storeAnalytics", icon: ChartLine },
  { href: "/stores/[storeId]/apps", title: "apps", icon: AppWindow },
  { href: "/stores/[storeId]/settings", title: "general", parent: "settingsGroup", icon: Store },
  { href: "/stores/[storeId]/settings/payments", title: "paymentMethods", parent: "settingsGroup", icon: CreditCard },
  { href: "/stores/[storeId]/settings/checkout", title: "checkoutForm", parent: "settingsGroup", icon: ClipboardList },
  { href: "/stores/[storeId]/settings/protection", title: "orderProtection", parent: "settingsGroup", icon: ShieldCheck },
  { href: "/stores/[storeId]/settings/app", title: "storeApp", parent: "settingsGroup", icon: Smartphone },
  { href: "/stores/[storeId]/settings/sales-popup", title: "salesPopup", parent: "settingsGroup", icon: ShoppingBag },
  { href: "/stores", title: "myStores", parent: "accountHelp", icon: Store },
  { href: "/settings", title: "settings", parent: "accountHelp", icon: Settings },
  { href: "/settings/plan", title: "planUsage", parent: "accountHelp", icon: Gem },
  { href: "/help", title: "help", parent: "accountHelp", icon: CircleHelp },
  { href: "/roadmap", title: "roadmap", parent: "accountHelp", icon: MapIcon },
  { href: "/earn", title: "earn", parent: "accountHelp", icon: HandCoins },
];

const EDIT_PRODUCT: DashboardRoute = {
  href: `${PRODUCTS}/[productId]/edit`,
  title: "editProduct",
  parent: "products",
  parentHref: PRODUCTS,
  icon: Package,
  hiddenFromPalette: true,
};

const LIST_PRODUCTS = DASHBOARD_ROUTES.find((route) => route.href === PRODUCTS)!;

const UUID = "[0-9a-fA-F-]{36}";
const STORE_IN_PATH = new RegExp(`^/stores/(${UUID})(?=/|$)`);
const EDIT_PRODUCT_PATH = new RegExp(`^/stores/${UUID}/products/[^/]+/edit/?$`);

function routeRegex(href: string, prefix: boolean): RegExp {
  const escaped = href
    .split("[storeId]")
    .map((part) => part.replace(/[.*+?^${}()|\\]/g, "\\$&"))
    .join(UUID);
  return new RegExp(`^${escaped}${prefix ? "/" : "/?$"}`);
}

/** True for store-scoped route patterns such as `/stores/[storeId]/settings`. */
export const isStoreScopedHref = (href: string) => href.includes("[storeId]");

/** Fills `[storeId]` in a route pattern; null when it needs a store and there is none. */
export function fillStoreHref(href: string, storeId: string | null | undefined): string | null {
  if (!isStoreScopedHref(href)) return href;
  return storeId ? href.replaceAll("[storeId]", storeId) : null;
}

/**
 * The Products pages moved under their store in F-87c but were account-wide
 * pages before, so they stay in the palette, filled with the selected store.
 * Other store-scoped pages are still left out.
 */
const keepsPaletteSpot = (href: string) => href === PRODUCTS || href.startsWith(`${PRODUCTS}/`);

/** The pages the command palette lists (fill store-scoped ones with `fillStoreHref`). */
export const COMMAND_PALETTE_ROUTES = DASHBOARD_ROUTES.filter(
  (route) => (!isStoreScopedHref(route.href) || keepsPaletteSpot(route.href)) && !route.hiddenFromPalette,
);

/**
 * Resolve the header title for a pathname; falls back to the closest section.
 * A store-scoped `parentHref` gets the pathname's store.
 */
export function resolveDashboardRoute(pathname: string): DashboardRoute {
  const route = matchDashboardRoute(pathname);
  if (!route.parentHref || !isStoreScopedHref(route.parentHref)) return route;
  const parentHref = fillStoreHref(route.parentHref, STORE_IN_PATH.exec(pathname)?.[1]);
  return { ...route, parentHref: parentHref ?? undefined };
}

function matchDashboardRoute(pathname: string): DashboardRoute {
  if (EDIT_PRODUCT_PATH.test(pathname)) return EDIT_PRODUCT;
  // The old list, still shown to a seller with no store (app/(main)/products).
  if (pathname === "/products" || pathname === "/products/") return { ...LIST_PRODUCTS, href: "/products", parentHref: "/products" };

  const exact = DASHBOARD_ROUTES.find((route) => routeRegex(route.href, false).test(pathname));
  if (exact) return exact;

  // Longest prefix wins so /settings/x resolves to Settings, not Dashboard.
  const prefix = DASHBOARD_ROUTES.filter(
    (route) => route.href !== "/" && routeRegex(route.href, true).test(pathname)
  ).sort((a, b) => b.href.length - a.href.length)[0];

  return prefix ?? DASHBOARD_ROUTES[0]!;
}
