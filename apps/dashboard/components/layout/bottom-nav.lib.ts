import {
  findActiveHref,
  isActiveHref,
  isGroupActive,
  resolveSidebar,
  SIDEBAR_CONFIG,
  type ResolvedEntry,
} from "../dashboard/sidebar.config";

/** The bottom nav's links, named by their sidebar entries (labels are `nav.<key>` except Home). */
export type BottomNavKey = "dashboard" | "products" | "ordersGroup";

export type BottomNavLink = { key: BottomNavKey; href: string };

const KEYS: BottomNavKey[] = ["dashboard", "products", "ordersGroup"];

/**
 * The sidebar for a store, resolved exactly as Sidebar.tsx does. Features only
 * decide whether a group is listed, so every one is on here: a page of a hidden
 * group then still belongs to that group, not to Products or Orders.
 */
export function bottomNavEntries(storeId: string | null): ResolvedEntry[] {
  return resolveSidebar(SIDEBAR_CONFIG, { storeId, features: { storeBuilder: true } });
}

/** Home, Products and Orders with the sidebar's own hrefs (Products is store-scoped, /products with no store). */
export function bottomNavLinks(entries: ResolvedEntry[]): BottomNavLink[] {
  return KEYS.flatMap((key) => {
    const entry = entries.find((e) => e.kind !== "divider" && e.key === key);
    if (!entry || entry.kind === "divider" || !entry.href) return [];
    return [{ key, href: entry.href }];
  });
}

/**
 * Which bottom link is the current page. The sidebar's match wins (so
 * /orders/delivery stays Shipping, not Orders); a page the sidebar doesn't list
 * (an order, bulk edit) falls back to the section it sits under. Home only matches "/".
 */
export function activeBottomNavKey(entries: ResolvedEntry[], links: BottomNavLink[], pathname: string): BottomNavKey | null {
  const activeHref = findActiveHref(entries, pathname);
  if (activeHref) {
    if (activeHref === "/") return pathname === "/" ? "dashboard" : null;
    for (const entry of entries) {
      if (entry.kind === "group" && (entry.key === "products" || entry.key === "ordersGroup") && isGroupActive(entry, activeHref)) {
        return entry.key;
      }
    }
    return null;
  }
  return links.find((link) => link.key !== "dashboard" && isActiveHref(pathname, link.href))?.key ?? null;
}

/**
 * Pages with their own fixed bar at the bottom of a phone screen, where the nav
 * would cover it: the product add and edit forms (publish bar, bulk link import)
 * and the ad flow's summary bar. Floating save and bulk bars are handled in CSS
 * (`[data-save-bar][data-open]`, app/globals.css).
 */
const HIDDEN_ROUTES: RegExp[] = [
  /^\/stores\/[^/]+\/products\/add(\/|$)/,
  /^\/stores\/[^/]+\/products\/[^/]+\/edit(\/|$)/,
  /^\/products\/add(\/|$)/,
  /^\/marketing$/,
];

export function bottomNavHiddenOn(pathname: string): boolean {
  return HIDDEN_ROUTES.some((route) => route.test(pathname));
}
