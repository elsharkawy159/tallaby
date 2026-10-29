import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  BarChart3,
  ChartLine,
  CircleUserRound,
  Globe,
  Megaphone,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import type { NavKey } from "../layout/dashboard-routes.lib";
import type { SidebarCounts } from "./sidebar.types";

/**
 * The seller dashboard sitemap (PLAN.md §7.2) as data. `Sidebar.tsx` renders
 * whatever `resolveSidebar` returns, so moving or shipping a page is a one-line
 * change here.
 *
 * status:
 *   live    → shown.
 *   soon    → shown disabled with a "Soon" badge.
 *   planned → hidden until its task ships (then flip it to live and add the
 *             route to DASHBOARD_ROUTES; the config test enforces that).
 * `[storeId]` in an href is replaced with the selected store; such links are
 * hidden when the seller has no store.
 */

export type NavStatus = "live" | "soon" | "planned";
export type NavFeature = "storeBuilder";

export type NavLinkConfig = {
  key: NavKey;
  href: string;
  icon?: LucideIcon;
  countKey?: keyof SidebarCounts;
  status: NavStatus;
  feature?: NavFeature;
  /** Active only on this exact path (for parents of sibling links, e.g. /products vs /products/add). */
  exact?: boolean;
};

export type NavGroupConfig = {
  kind: "group";
  key: NavKey;
  icon: LucideIcon;
  feature?: NavFeature;
  items: NavLinkConfig[];
};

/** A thin rule between sidebar sections. */
export type NavDivider = { kind: "divider" };

export type NavEntry = ({ kind: "link" } & NavLinkConfig) | NavGroupConfig | NavDivider;

export const SIDEBAR_CONFIG: NavEntry[] = [
  // Daily operations.
  { kind: "link", key: "dashboard", href: "/", icon: BarChart3, countKey: "dashboard", status: "live" },
  {
    kind: "group",
    key: "products",
    icon: Package,
    items: [
      { key: "manageProducts", href: "/products", countKey: "products", status: "live", exact: true },
      { key: "addProducts", href: "/products/add", status: "live" },
      // The seller's own category list (0068). Which products a store shows is in Store settings › General.
      { key: "sellerCategories", href: "/products/categories", status: "live" },
      { key: "reviews", href: "/reviews", countKey: "reviews", status: "live" },
    ],
  },
  {
    kind: "group",
    key: "ordersGroup",
    icon: ShoppingBag,
    items: [
      { key: "orders", href: "/orders", countKey: "orders", status: "live", exact: true },
      // Tracking individual orders; /shipping redirects here (P3-06).
      { key: "deliveryTracking", href: "/orders/delivery", countKey: "shipping", status: "live" },
    ],
  },
  // How orders get shipped: riders, shipping zones and rates, the fulfillment service.
  {
    kind: "group",
    key: "fulfillmentShipping",
    icon: Truck,
    items: [
      { key: "riders", href: "/orders/riders", status: "live" },
      { key: "shippingSettings", href: "/stores/[storeId]/shipping", status: "live" },
      { key: "fulfillment", href: "/settings/fulfillment", status: "live" },
    ],
  },
  // Customers belongs here once it has a page; there is no customers route yet.
  // Money (balance, ledger) first, then analytics.
  {
    kind: "group",
    key: "finance",
    icon: Wallet,
    items: [
      { key: "walletBalance", href: "/wallet", status: "live" },
      { key: "accountStatements", href: "/financial", countKey: "financial", status: "live" },
      // Hidden until the page has content (owner, 2026-10-19).
      // { key: "reports", href: "/reports", status: "live" },
    ],
  },
  { kind: "divider" },
  // Growing and configuring the selected store.
  // The store builder: the site itself, then what goes on it.
  {
    kind: "group",
    key: "websiteContent",
    icon: Globe,
    feature: "storeBuilder",
    items: [
      { key: "websiteOverview", href: "/stores/[storeId]/website", status: "live", exact: true },
      { key: "websiteBuilder", href: "/stores/[storeId]/editor", status: "live" },
      { key: "templates", href: "/stores/[storeId]/website/templates", status: "live" },
      { key: "designSystem", href: "/stores/[storeId]/website/design", status: "live" },
      { key: "domainSeo", href: "/stores/[storeId]/website/domain", status: "live" },
      { key: "socialMedia", href: "/stores/[storeId]/website/social", status: "live" },
      { key: "pages", href: "/stores/[storeId]/website/pages", status: "live" },
      { key: "blog", href: "/stores/[storeId]/website/blog", status: "live" },
      { key: "forms", href: "/stores/[storeId]/website/forms", countKey: "forms", status: "live" },
      { key: "mediaLibrary", href: "/stores/[storeId]/website/media", status: "live" },
    ],
  },
  {
    kind: "group",
    key: "marketing",
    icon: Megaphone,
    items: [
      { key: "coupons", href: "/coupons", countKey: "promotions", status: "live" },
      { key: "campaigns", href: "/marketing", countKey: "marketing", status: "live" },
    ],
  },
  // Store views from Tallaby's GA4 (SA-01).
  { kind: "link", key: "storeAnalytics", href: "/stores/[storeId]/analytics", icon: ChartLine, status: "live" },
  { kind: "link", key: "apps", href: "/stores/[storeId]/apps", icon: AppWindow, status: "live" },
  {
    kind: "group",
    key: "settingsGroup",
    icon: Settings,
    items: [
      { key: "general", href: "/stores/[storeId]/settings", status: "live", exact: true },
      { key: "paymentMethods", href: "/stores/[storeId]/settings/payments", status: "live" },
    ],
  },
  { kind: "divider" },
  // Account-wide, not tied to the selected store.
  {
    kind: "group",
    key: "accountHelp",
    icon: CircleUserRound,
    items: [
      { key: "myStores", href: "/stores", status: "live", exact: true },
      { key: "settings", href: "/settings", status: "live", exact: true },
      { key: "planUsage", href: "/settings/plan", status: "live" },
      { key: "help", href: "/help", status: "live" },
      { key: "roadmap", href: "/roadmap", status: "live" },
      // Affiliate program (F-37): referral link, commissions, withdrawals.
      { key: "earn", href: "/earn", status: "live" },
    ],
  },
];

export type ResolvedLink = {
  kind: "link";
  key: NavKey;
  href: string;
  icon?: LucideIcon;
  countKey?: keyof SidebarCounts;
  disabled: boolean;
  exact: boolean;
};

export type ResolvedGroup = { kind: "group"; key: NavKey; icon: LucideIcon; items: ResolvedLink[] };
export type ResolvedEntry = ResolvedLink | ResolvedGroup | NavDivider;

export type SidebarContext = {
  storeId: string | null;
  features: Partial<Record<NavFeature, boolean>>;
};

function resolveLink(link: NavLinkConfig, ctx: SidebarContext): ResolvedLink | null {
  if (link.status === "planned") return null;
  if (link.feature && !ctx.features[link.feature]) return null;
  const scoped = link.href.includes("[storeId]");
  if (scoped && !ctx.storeId) return null;
  return {
    kind: "link",
    key: link.key,
    href: scoped ? link.href.replaceAll("[storeId]", ctx.storeId!) : link.href,
    icon: link.icon,
    countKey: link.countKey,
    disabled: link.status === "soon",
    exact: link.exact ?? false,
  };
}

export function resolveSidebar(config: NavEntry[], ctx: SidebarContext): ResolvedEntry[] {
  const out: ResolvedEntry[] = [];
  for (const entry of config) {
    if (entry.kind === "divider") {
      // Never first or doubled (a whole section can resolve to nothing).
      if (out.length && out.at(-1)!.kind !== "divider") out.push(entry);
      continue;
    }
    if (entry.kind === "link") {
      const link = resolveLink(entry, ctx);
      if (link) out.push(link);
      continue;
    }
    if (entry.feature && !ctx.features[entry.feature]) continue;
    const items = entry.items.map((item) => resolveLink(item, ctx)).filter((l): l is ResolvedLink => l !== null);
    if (items.length) out.push({ kind: "group", key: entry.key, icon: entry.icon, items });
  }
  if (out.at(-1)?.kind === "divider") out.pop();
  return out;
}

/** Whether a sidebar link is the current page (or its section). Home only matches exactly. */
export function isActiveHref(pathname: string, href: string, options: { exact?: boolean } = {}): boolean {
  if (href === "/" || options.exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The one sidebar link for the current page: the most specific link that
 * matches, so /settings/plan picks Plan & usage rather than Settings, and only
 * one group opens. Null when no link matches.
 */
export function findActiveHref(entries: ResolvedEntry[], pathname: string): string | null {
  let best: string | null = null;
  for (const link of entries.flatMap((e) => (e.kind === "group" ? e.items : e.kind === "link" ? [e] : []))) {
    if (link.disabled || !isActiveHref(pathname, link.href, { exact: link.exact })) continue;
    if (!best || link.href.length > best.length) best = link.href;
  }
  return best;
}

/**
 * Store-builder rollout flag (PLAN.md P3-01): STORE_BUILDER_SELLER_IDS = "all" or a comma list of seller ids.
 * Unset means "all" (released to every seller, 2026-10-18); set it to a list, or empty, to narrow or switch it off.
 */
export function storeBuilderEnabled(sellerId: string, flag = process.env.STORE_BUILDER_SELLER_IDS ?? "all"): boolean {
  const value = flag.trim();
  if (value === "all") return true;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(sellerId);
}
