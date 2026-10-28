import {
  Banknote,
  Globe,
  // Handshake, // affiliates tab is commented out below
  History,
  Home,
  LineChart,
  Megaphone,
  Newspaper,
  Package,
  PlugZap,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  TicketPercent,
  Truck,
  UserRound,
  Users,
  Wallet,
  Warehouse,
  CreditCard,
  Award,
} from "lucide-react";
import type { SidebarCounts } from "./sidebar.types";

/**
 * Admin sidebar map (docs/admin-saas.md §2.1). The order reads overview →
 * people → their stores → what they sell → sales → money → Tallaby services →
 * system (the design library is code-only since 2026-10-27). Every section but Overview renders as a
 * collapsible group. `sidebar.tsx` and the mobile drawer only render this.
 */
export interface SidebarLink {
  key: string;
  title: string;
  href: string;
  icon: React.ElementType;
  /** Omitted for links that have nothing to count. */
  countKey?: keyof SidebarCounts;
  /** Tooltip explaining what the badge number counts. */
  countLabel?: string;
  /** Active only on this exact path (not its children). */
  exact?: boolean;
  /** Kept in the map but not rendered (a page that is hidden for now). */
  hidden?: boolean;
}

export interface SidebarSection {
  key: string;
  title: string;
  links: SidebarLink[];
}

export const sidebarSections: SidebarSection[] = [
  {
    key: "overview",
    title: "Overview",
    links: [
      { key: "dashboard", title: "Dashboard", href: "/", icon: Home, exact: true },
      { key: "analytics", title: "Analytics", href: "/analytics", icon: LineChart },
    ],
  },
  {
    key: "people",
    title: "People",
    links: [
      {
        key: "sellers",
        title: "Sellers",
        href: "/sellers",
        icon: UserRound,
        countKey: "newSellers",
        countLabel: "New sellers today",
      },
      {
        key: "customers",
        title: "Customers",
        href: "/customers",
        icon: Users,
        countKey: "newCustomers",
        countLabel: "New customers today",
      },
      // Affiliate program is disabled for now.
      // { key: "affiliates", title: "Affiliates", href: "/affiliate", icon: Handshake },
    ],
  },
  {
    key: "stores",
    title: "Stores",
    links: [
      { key: "stores", title: "Stores", href: "/stores", icon: Store },
      {
        key: "domains",
        title: "Domains",
        href: "/domains",
        icon: Globe,
        countKey: "failingDomains",
        countLabel: "Custom domains that are not active",
      },
      {
        key: "integrations",
        title: "Integrations",
        href: "/integrations",
        icon: PlugZap,
        countKey: "integrationErrors",
        countLabel: "Store integrations in error",
      },
    ],
  },
  {
    key: "catalog",
    title: "Catalog",
    links: [
      {
        key: "products",
        title: "Products",
        href: "/products",
        icon: Package,
        countKey: "pendingProducts",
        countLabel: "Products awaiting approval",
      },
      { key: "categories", title: "Categories", href: "/categories", icon: Tag },
      { key: "brands", title: "Brands", href: "/brands", icon: Award },
    ],
  },
  {
    key: "sales",
    title: "Sales",
    links: [
      {
        key: "orders",
        title: "Orders",
        href: "/orders",
        icon: ShoppingCart,
        countKey: "pendingOrders",
        countLabel: "Pending orders",
      },
      {
        key: "pendingCarts",
        title: "Pending carts",
        href: "/pending-carts",
        icon: ShoppingBag,
        countKey: "unremindedCarts",
        countLabel: "Carts not reminded yet",
      },
      { key: "coupons", title: "Coupons", href: "/coupons", icon: TicketPercent },
      // Hidden 2026-10-18 (SaaS pivot), see docs/admin-saas.md §2.2.
      { key: "externalOrders", title: "External orders", href: "/external-orders", icon: ShoppingCart, hidden: true },
    ],
  },
  {
    key: "money",
    title: "Money",
    links: [
      { key: "wallets", title: "Store wallets", href: "/wallets", icon: Wallet },
      {
        key: "storeTopUps",
        title: "Store top-ups",
        href: "/store-top-ups",
        icon: Banknote,
        countKey: "pendingStoreTopUps",
        countLabel: "Store top-ups waiting for review",
      },
      { key: "payments", title: "Payments", href: "/payments", icon: CreditCard },
      // Hidden 2026-10-18 (SaaS pivot), see docs/admin-saas.md §2.2.
      { key: "pricingCalculator", title: "Pricing calculator", href: "/pricing-calculator", icon: Banknote, hidden: true },
    ],
  },
  {
    key: "services",
    title: "Services",
    links: [
      {
        key: "fulfillment",
        title: "Fulfillment",
        href: "/fulfillment",
        icon: Warehouse,
        countKey: "fulfillmentOpenSellers",
        countLabel: "Sellers with open fulfillment requests",
      },
      { key: "shipping", title: "Shipping", href: "/shipping", icon: Truck },
      {
        key: "adRequests",
        title: "Ad campaigns",
        href: "/ad-requests",
        icon: Megaphone,
        countKey: "pendingAdRequests",
        countLabel: "Ad requests waiting for review",
      },
      { key: "aiUsage", title: "AI usage", href: "/ai-usage", icon: Sparkles },
    ],
  },
  // Design library (Templates, Sections): code-only since 2026-10-27 (0109); its admin screens are disabled.
  // {
  //   key: "library",
  //   title: "Design library",
  //   links: [
  //     { key: "templates", title: "Templates", href: "/templates", icon: LayoutTemplate },
  //     { key: "sections", title: "Sections", href: "/sections", icon: Blocks },
  //   ],
  // },
  {
    key: "system",
    title: "Tallaby site & system",
    links: [
      { key: "blog", title: "Blog", href: "/blog", icon: Newspaper },
      { key: "audit", title: "Audit log", href: "/audit", icon: History },
      { key: "settings", title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/** The one section that is always open: it renders without a group trigger. */
export const PINNED_SECTION_KEY = "overview";

/** Sections with their hidden links removed; empty sections are dropped. */
export function visibleSections(sections: SidebarSection[] = sidebarSections): SidebarSection[] {
  return sections
    .map((section) => ({ ...section, links: section.links.filter((link) => !link.hidden) }))
    .filter((section) => section.links.length > 0);
}

/** Whether `href` is the current page or one of its children. Home only matches exactly. */
export function isActiveHref(pathname: string, href: string, options: { exact?: boolean } = {}): boolean {
  if (href === "/" || options.exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The single link to highlight: the longest matching href wins. */
export function activeHref(pathname: string, sections: SidebarSection[] = sidebarSections): string | null {
  let best: string | null = null;
  for (const section of sections) {
    for (const link of section.links) {
      if (link.hidden || !isActiveHref(pathname, link.href, { exact: link.exact })) continue;
      if (!best || link.href.length > best.length) best = link.href;
    }
  }
  return best;
}

/** The key of the section holding the active link, so that group opens on load. */
export function activeSectionKey(pathname: string, sections: SidebarSection[] = sidebarSections): string | null {
  const href = activeHref(pathname, sections);
  if (!href) return null;
  return sections.find((section) => section.links.some((link) => !link.hidden && link.href === href))?.key ?? null;
}

/** Sum of a section's visible badge counts, shown on its trigger while it is closed. */
export function sectionCount(section: SidebarSection, counts: SidebarCounts): number {
  return section.links.reduce(
    (sum, link) => sum + (link.countKey && !link.hidden ? counts[link.countKey] : 0),
    0,
  );
}
