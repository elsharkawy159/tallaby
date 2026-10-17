import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  BarChart3,
  Globe,
  Megaphone,
  Package,
  ShoppingBag,
  Store,
  UserCog,
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

export type NavEntry = ({ kind: "link" } & NavLinkConfig) | NavGroupConfig;

export const SIDEBAR_CONFIG: NavEntry[] = [
  { kind: "link", key: "dashboard", href: "/", icon: BarChart3, countKey: "dashboard", status: "live" },
  {
    kind: "group",
    key: "ordersShipping",
    icon: ShoppingBag,
    items: [
      { key: "orders", href: "/orders", countKey: "orders", status: "live" },
      // Moves to /orders/delivery in P3-06 (with a redirect).
      { key: "deliveryTracking", href: "/shipping", countKey: "shipping", status: "live" },
      { key: "riders", href: "/orders/riders", status: "planned" },
      { key: "shippingSettings", href: "/stores/[storeId]/shipping", status: "planned" },
    ],
  },
  {
    kind: "group",
    key: "products",
    icon: Package,
    items: [
      { key: "manageProducts", href: "/products", countKey: "products", status: "live", exact: true },
      { key: "addProducts", href: "/products/add", status: "live" },
      { key: "reviews", href: "/reviews", countKey: "reviews", status: "live" },
    ],
  },
  {
    kind: "group",
    key: "website",
    icon: Globe,
    feature: "storeBuilder",
    items: [
      { key: "websiteOverview", href: "/stores/[storeId]/website", status: "planned" },
      { key: "websiteBuilder", href: "/stores/[storeId]/editor", status: "planned" },
      { key: "templates", href: "/stores/[storeId]/website/templates", status: "planned" },
      { key: "designSystem", href: "/stores/[storeId]/website/design", status: "planned" },
      { key: "pages", href: "/stores/[storeId]/website/pages", status: "planned" },
      { key: "domainSeo", href: "/stores/[storeId]/website/domain", status: "planned" },
      { key: "socialMedia", href: "/stores/[storeId]/website/social", status: "planned" },
      { key: "blog", href: "/stores/[storeId]/website/blog", status: "planned" },
      { key: "forms", href: "/stores/[storeId]/website/forms", status: "planned" },
      { key: "mediaLibrary", href: "/stores/[storeId]/website/media", status: "planned" },
    ],
  },
  {
    kind: "group",
    key: "marketing",
    icon: Megaphone,
    items: [
      { key: "promotions", href: "/coupons", countKey: "promotions", status: "live" },
      { key: "advertiseProducts", href: "/marketing", countKey: "marketing", status: "live" },
    ],
  },
  { kind: "link", key: "apps", href: "/stores/[storeId]/apps", icon: AppWindow, status: "planned" },
  {
    kind: "group",
    key: "finance",
    icon: Wallet,
    items: [
      { key: "accountStatements", href: "/financial", countKey: "financial", status: "live" },
      { key: "reports", href: "/reports", status: "live" },
    ],
  },
  {
    kind: "group",
    key: "storeSettings",
    icon: Store,
    items: [
      { key: "general", href: "/stores/[storeId]/settings", status: "live", exact: true },
      { key: "paymentMethods", href: "/stores/[storeId]/settings/payments", status: "soon" },
      { key: "policies", href: "/stores/[storeId]/settings/policies", status: "live" },
    ],
  },
  {
    kind: "group",
    key: "account",
    icon: UserCog,
    items: [
      { key: "myStores", href: "/stores", status: "live", exact: true },
      { key: "settings", href: "/settings", status: "live", exact: true },
      { key: "planUsage", href: "/settings/plan", status: "live" },
      { key: "fulfillment", href: "/settings/fulfillment", status: "live" },
      { key: "help", href: "/help", status: "live" },
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
export type ResolvedEntry = ResolvedLink | ResolvedGroup;

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
    if (entry.kind === "link") {
      const link = resolveLink(entry, ctx);
      if (link) out.push(link);
      continue;
    }
    if (entry.feature && !ctx.features[entry.feature]) continue;
    const items = entry.items.map((item) => resolveLink(item, ctx)).filter((l): l is ResolvedLink => l !== null);
    if (items.length) out.push({ kind: "group", key: entry.key, icon: entry.icon, items });
  }
  return out;
}

/** Whether a sidebar link is the current page (or its section). Home only matches exactly. */
export function isActiveHref(pathname: string, href: string, options: { exact?: boolean } = {}): boolean {
  if (href === "/" || options.exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Store-builder rollout flag (PLAN.md P3-01): STORE_BUILDER_SELLER_IDS = "all" or a comma list of seller ids. */
export function storeBuilderEnabled(sellerId: string, flag = process.env.STORE_BUILDER_SELLER_IDS ?? ""): boolean {
  const value = flag.trim();
  if (value === "all") return true;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(sellerId);
}
