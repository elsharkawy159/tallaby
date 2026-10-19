import {
  Banknote,
  Globe,
  Handshake,
  History,
  Home,
  LayoutTemplate,
  LineChart,
  Megaphone,
  Package,
  PlugZap,
  Settings,
  ShoppingBag,
  ShoppingCart,
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
 * people → what sellers built → what they sell → Tallaby services → money →
 * system. `sidebar.tsx` and the mobile drawer only render this.
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
        countKey: "pendingSellers",
        countLabel: "Sellers awaiting approval",
      },
      {
        key: "customers",
        title: "Customers",
        href: "/customers",
        icon: Users,
        countKey: "newCustomers",
        countLabel: "New customers today",
      },
      { key: "affiliates", title: "Affiliates", href: "/affiliate", icon: Handshake },
    ],
  },
  {
    key: "stores",
    title: "Stores & websites",
    links: [
      { key: "stores", title: "Stores", href: "/stores", icon: Store },
      { key: "templates", title: "Templates", href: "/templates", icon: LayoutTemplate },
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
    key: "commerce",
    title: "Commerce",
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
        key: "products",
        title: "Products",
        href: "/products",
        icon: Package,
        countKey: "pendingProducts",
        countLabel: "Products awaiting approval",
      },
      { key: "categories", title: "Categories", href: "/categories", icon: Tag },
      { key: "brands", title: "Brands", href: "/brands", icon: Award },
      { key: "coupons", title: "Coupons", href: "/coupons", icon: TicketPercent },
      {
        key: "pendingCarts",
        title: "Pending carts",
        href: "/pending-carts",
        icon: ShoppingBag,
        countKey: "unremindedCarts",
        countLabel: "Carts not reminded yet",
      },
      // Hidden 2026-10-18 (SaaS pivot), see docs/admin-saas.md §2.2.
      { key: "externalOrders", title: "External orders", href: "/external-orders", icon: ShoppingCart, hidden: true },
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
      {
        key: "adRequests",
        title: "Ad campaigns",
        href: "/ad-requests",
        icon: Megaphone,
        countKey: "pendingAdRequests",
        countLabel: "Ad requests waiting for review",
      },
      { key: "shipping", title: "Shipping", href: "/shipping", icon: Truck },
    ],
  },
  {
    key: "finance",
    title: "Finance",
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
    ],
  },
  {
    key: "system",
    title: "System",
    links: [
      { key: "audit", title: "Audit log", href: "/audit", icon: History },
      { key: "settings", title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

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
