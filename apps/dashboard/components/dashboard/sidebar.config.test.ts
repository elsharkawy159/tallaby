import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { COMMAND_PALETTE_ROUTES, DASHBOARD_ROUTES, fillStoreHref, resolveDashboardRoute } from "../layout/dashboard-routes.lib";
import {
  SIDEBAR_CONFIG,
  findActiveHref,
  isActiveHref,
  isGroupActive,
  resolveSidebar,
  storeBuilderEnabled,
  type NavEntry,
  type ResolvedGroup,
} from "./sidebar.config";

const STORE = "33333333-3333-4333-8333-333333333333";
/** The Products pages of STORE (under their store since F-87c). */
const P = `/stores/${STORE}/products`;

describe("storeBuilderEnabled", () => {
  const SELLER = "11111111-1111-4111-8111-111111111111";

  it("is on for every seller when the flag is unset or 'all'", () => {
    expect(storeBuilderEnabled(SELLER, undefined)).toBe(true);
    expect(storeBuilderEnabled(SELLER, " all ")).toBe(true);
  });

  it("can still be limited to a list or switched off", () => {
    expect(storeBuilderEnabled(SELLER, `x, ${SELLER}`)).toBe(true);
    expect(storeBuilderEnabled(SELLER, "x,y")).toBe(false);
    expect(storeBuilderEnabled(SELLER, "")).toBe(false);
  });
});

type AnyLink = { href: string; key: string; status?: string };
type AnyGroup = { key: string; href?: string | null; overviewKey?: string; items: AnyLink[] };
/**
 * Every link in the sidebar. Resolved groups already list their landing page
 * as the first item; in the config it is the group's `href` + `overviewKey`.
 */
const allLinks = (entries: readonly { kind: string }[]): AnyLink[] =>
  entries.flatMap((e) => {
    if (e.kind === "link") return [e as unknown as AnyLink];
    if (e.kind !== "group") return [];
    const g = e as unknown as AnyGroup;
    const own = g.href && g.overviewKey ? [{ href: g.href, key: g.overviewKey, status: "live" }] : [];
    return [...own, ...g.items];
  });

/** Top-level keys, with dividers shown as "|". */
const topLevel = (entries: { kind: string; key?: string }[]) => entries.map((e) => (e.kind === "divider" ? "|" : e.key));

describe("SIDEBAR_CONFIG", () => {
  it("only links to routes that exist in DASHBOARD_ROUTES (command palette + header)", () => {
    const routeHrefs = new Set(DASHBOARD_ROUTES.map((r) => r.href));
    for (const link of allLinks(SIDEBAR_CONFIG).filter((l) => l.status === "live")) {
      expect(routeHrefs.has(link.href), link.href).toBe(true);
    }
  });

  it("has a nav label in both languages for every group and link", () => {
    const keys = [
      ...SIDEBAR_CONFIG.flatMap((e) => (e.kind === "divider" ? [] : [e.key])),
      ...allLinks(SIDEBAR_CONFIG).map((l) => l.key),
    ];
    for (const key of keys) {
      expect((en.nav as Record<string, string>)[key], `en nav.${key}`).toBeTruthy();
      expect((ar.nav as Record<string, string>)[key], `ar nav.${key}`).toBeTruthy();
    }
  });

  it("keeps every existing page reachable", () => {
    const hrefs = allLinks(resolveSidebar(SIDEBAR_CONFIG, { storeId: STORE, features: {} })).map((l) => l.href);
    for (const href of ["/", "/orders", "/orders/delivery", "/orders/riders", P, `${P}/add`, `${P}/categories`, "/reviews", "/coupons", "/marketing/subscribers", "/marketing/emails", "/marketing/catalog", "/wallet", "/wallet/transactions", "/stores", "/settings", "/settings/plan", "/help"]) {
      expect(hrefs, href).toContain(href);
    }
  });

  it("keeps Finance to the wallet, Tallaby Pay earnings and transactions (owner, 2026-11-27)", () => {
    const finance = (features: { tallabyPayEarnings?: boolean }) => {
      const group = resolveSidebar(SIDEBAR_CONFIG, { storeId: STORE, features }).find(
        (e) => e.kind === "group" && e.key === "finance",
      );
      return group?.kind === "group" ? group.items.map((i) => i.href) : [];
    };
    expect(finance({ tallabyPayEarnings: true })).toEqual(["/wallet", `/stores/${STORE}/earnings`, "/wallet/transactions"]);
    expect(finance({})).toEqual(["/wallet", "/wallet/transactions"]);
    // Account statements and Reports left the sidebar but keep their header title (still open by URL).
    expect(resolveDashboardRoute("/financial").title).toBe("accountStatements");
    expect(resolveDashboardRoute("/wallet/transactions").title).toBe("transactions");
  });

  it("puts every store-scoped page in the sidebar once a store exists", () => {
    const linked = new Set(allLinks(SIDEBAR_CONFIG).map((l) => l.href));
    // Hidden from the sidebar, still open by URL (F-65a, F-65c; /financial and /reports since 2026-11-27, owner).
    const hidden = new Set(["/marketing", "/stores/[storeId]/analytics", "/financial", "/reports"]);
    for (const route of DASHBOARD_ROUTES) {
      if (hidden.has(route.href)) continue;
      expect(linked.has(route.href), route.href).toBe(true);
    }
  });

  it("links each page exactly once", () => {
    const hrefs = allLinks(SIDEBAR_CONFIG).map((l) => l.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("keeps the agreed top-level order: operations | grow & configure | account & help", () => {
    expect(topLevel(SIDEBAR_CONFIG)).toEqual([
      "dashboard",
      "|",
      "products",
      "ordersGroup",
      "fulfillmentShipping",
      "finance",
      "|",
      "websiteContent",
      "marketing",
      "apps",
      "settingsGroup",
      "|",
      "accountHelp",
      "earn",
    ]);
  });

  it("keeps account-wide pages out of the selected-store settings", () => {
    const hrefs = (key: string) =>
      SIDEBAR_CONFIG.flatMap((e) => (e.kind === "group" && e.key === key ? e.items.map((i) => i.href) : []));
    expect(hrefs("settingsGroup").every((h) => h.includes("[storeId]"))).toBe(true);
    expect(hrefs("accountHelp")).toEqual(["/stores", "/settings", "/settings/plan", "/help", "/roadmap"]);
  });

  it("hides Website & Content without the store-builder flag", () => {
    const keys = (storeBuilder: boolean) =>
      topLevel(resolveSidebar(SIDEBAR_CONFIG, { storeId: STORE, features: { storeBuilder } }));
    expect(keys(false)).not.toContain("websiteContent");
    expect(keys(true)).toContain("websiteContent");
  });

  it("keeps the dividers tidy when a store-less seller loses store-scoped sections", () => {
    expect(topLevel(resolveSidebar(SIDEBAR_CONFIG, { storeId: null, features: { storeBuilder: true } }))).toEqual([
      "dashboard",
      "|",
      "products",
      "ordersGroup",
      "fulfillmentShipping",
      "finance",
      "|",
      "marketing",
      "|",
      "accountHelp",
      "earn",
    ]);
  });

  it("files each page under the same section in the sidebar and the header", () => {
    for (const group of SIDEBAR_CONFIG) {
      if (group.kind !== "group") continue;
      for (const href of [...(group.href ? [group.href] : []), ...group.items.map((i) => i.href)]) {
        const route = DASHBOARD_ROUTES.find((r) => r.href === href);
        expect(route?.parent, href).toBe(group.key);
      }
    }
  });

  it("names each overview page, listed once as the group's first item (owner, 2026-11-27)", () => {
    const group = (key: string) => SIDEBAR_CONFIG.find((e) => e.kind === "group" && e.key === key) as AnyGroup;
    const landing: Record<string, [string, string]> = {
      products: ["/stores/[storeId]/products", "manageProducts"],
      ordersGroup: ["/orders", "allOrders"],
      websiteContent: ["/stores/[storeId]/website", "websiteOverview"],
      settingsGroup: ["/stores/[storeId]/settings", "general"],
    };
    for (const [key, [href, overviewKey]] of Object.entries(landing)) {
      expect(group(key), key).toMatchObject({ href, overviewKey });
      expect(group(key).items.map((i) => i.href), key).not.toContain(href);
    }
    // The other groups have no overview page.
    for (const key of ["fulfillmentShipping", "finance", "marketing", "accountHelp"]) {
      expect(group(key).href, key).toBeUndefined();
    }
  });
});

describe("hidden campaign and store views pages (F-65)", () => {
  const hrefs = allLinks(resolveSidebar(SIDEBAR_CONFIG, { storeId: STORE, features: { storeBuilder: true } })).map(
    (l) => l.href,
  );

  it("leaves the sidebar without paid ads, campaign tracking or store views", () => {
    expect(hrefs).not.toContain("/marketing");
    expect(hrefs).not.toContain("/reports/campaigns");
    expect(hrefs).not.toContain(`/stores/${STORE}/analytics`);
  });

  it("keeps the Marketing group, opening on a page that is still listed", () => {
    const group = SIDEBAR_CONFIG.find((e) => e.kind === "group" && e.key === "marketing");
    expect(group?.kind === "group" && group.items.map((i) => i.href)).toEqual([
      "/coupons",
      "/marketing/discounts",
      "/marketing/subscribers",
      "/marketing/emails",
      "/marketing/catalog",
    ]);
  });

  it("keeps the header title of the hidden pages", () => {
    expect(resolveDashboardRoute("/marketing").title).toBe("campaigns");
    expect(resolveDashboardRoute(`/stores/${STORE}/analytics`).title).toBe("storeAnalytics");
  });

  it("removes campaign tracking from the routes", () => {
    expect(DASHBOARD_ROUTES.some((r) => r.href === "/reports/campaigns")).toBe(false);
    expect(resolveDashboardRoute("/reports").title).toBe("reports");
  });

  it("keeps paid ads out of the command palette, and the rest of Marketing in it", () => {
    const palette = COMMAND_PALETTE_ROUTES.map((r) => r.href);
    expect(palette).not.toContain("/marketing");
    expect(palette).toContain("/marketing/emails");
  });

  it("has no active sidebar link on the hidden pages, and the right one in the group", () => {
    const entries = resolveSidebar(SIDEBAR_CONFIG, { storeId: STORE, features: { storeBuilder: true } });
    expect(findActiveHref(entries, "/marketing")).toBeNull();
    expect(findActiveHref(entries, `/stores/${STORE}/analytics`)).toBeNull();
    expect(findActiveHref(entries, "/marketing/emails")).toBe("/marketing/emails");
  });
});

describe("resolveSidebar", () => {
  it("fills the selected store into store-scoped links", () => {
    const resolved = resolveSidebar(
      [{ kind: "link", key: "general", href: "/stores/[storeId]/settings", status: "live" }],
      { storeId: STORE, features: {} },
    );
    expect(resolved).toEqual([expect.objectContaining({ href: `/stores/${STORE}/settings` })]);
  });

  it("drops store-scoped links when there is no store", () => {
    const resolved = resolveSidebar(
      [{ kind: "link", key: "general", href: "/stores/[storeId]/settings", status: "live" }],
      { storeId: null, features: {} },
    );
    expect(resolved).toEqual([]);
  });

  it("hides planned items and keeps soon items as disabled", () => {
    const resolved = resolveSidebar(
      [
        {
          kind: "group",
          key: "storeSettings",
          icon: undefined as never,
          items: [
            { key: "general", href: "/a", status: "planned" },
            { key: "paymentMethods", href: "/b", status: "soon" },
          ],
        },
      ],
      { storeId: STORE, features: {} },
    );
    expect(resolved).toEqual([
      expect.objectContaining({ kind: "group", items: [expect.objectContaining({ href: "/b", disabled: true })] }),
    ]);
  });

  it("never starts, ends or doubles up with a divider", () => {
    const resolved = resolveSidebar(
      [
        { kind: "divider" },
        { kind: "link", key: "dashboard", href: "/", status: "live" },
        { kind: "divider" },
        { kind: "link", key: "apps", href: "/stores/[storeId]/apps", status: "live" },
        { kind: "divider" },
        { kind: "link", key: "help", href: "/help", status: "live" },
        { kind: "divider" },
      ],
      { storeId: null, features: {} },
    );
    expect(topLevel(resolved)).toEqual(["dashboard", "|", "help"]);
  });

  it("drops groups that end up empty", () => {
    const resolved = resolveSidebar(
      [{ kind: "group", key: "websiteContent", icon: undefined as never, items: [{ key: "templates", href: "/t", status: "planned" }] }],
      { storeId: STORE, features: {} },
    );
    expect(resolved).toEqual([]);
  });

  it("lists each group's landing page as its first item, and points the group at its first enabled item", () => {
    const entries = resolveSidebar(SIDEBAR_CONFIG, { storeId: STORE, features: { storeBuilder: true } });
    const group = (key: string) => entries.find((e) => e.kind === "group" && e.key === key) as ResolvedGroup;
    const first = (key: string) => group(key).items[0];
    const landing: Record<string, [string, string]> = {
      products: [P, "manageProducts"],
      ordersGroup: ["/orders", "allOrders"],
      websiteContent: [`/stores/${STORE}/website`, "websiteOverview"],
      settingsGroup: [`/stores/${STORE}/settings`, "general"],
    };
    for (const [key, [href, itemKey]] of Object.entries(landing)) {
      expect(first(key), key).toEqual({ kind: "link", key: itemKey, href, disabled: false, exact: true });
      expect(group(key), key).not.toHaveProperty("ownHref");
      expect(group(key).href, key).toBe(href);
      // Listed once.
      expect(group(key).items.filter((i) => i.href === href), key).toHaveLength(1);
    }
    // The group label keeps its landing page's number.
    expect(group("products")).toMatchObject({ countKey: "products" });
    expect(group("ordersGroup")).toMatchObject({ countKey: "orders" });
    expect(group("fulfillmentShipping")).toMatchObject({ href: "/orders/delivery", countKey: undefined });
    expect(group("finance")).toMatchObject({ href: "/wallet" });
    expect(group("marketing")).toMatchObject({ href: "/coupons" });
    expect(group("accountHelp")).toMatchObject({ href: "/stores" });
  });

  it("hides a store-scoped landing item with no store, and points the group at its first enabled item", () => {
    const config: NavEntry[] = [
      {
        kind: "group",
        key: "settingsGroup",
        icon: undefined as never,
        href: "/stores/[storeId]/settings",
        overviewKey: "general",
        exact: true,
        items: [
          { key: "paymentMethods", href: "/soon", status: "soon" },
          { key: "help", href: "/help", status: "live" },
        ],
      },
    ];
    const [noStore] = resolveSidebar(config, { storeId: null, features: {} }) as ResolvedGroup[];
    expect(noStore?.href).toBe("/help");
    expect(noStore?.items.map((i) => i.href)).toEqual(["/soon", "/help"]);
    const [withStore] = resolveSidebar(config, { storeId: STORE, features: {} }) as ResolvedGroup[];
    expect(withStore?.href).toBe(`/stores/${STORE}/settings`);
    expect(withStore?.items[0]).toMatchObject({ key: "general", href: `/stores/${STORE}/settings`, exact: true });
    expect(withStore?.items.map((i) => i.href)).toEqual([`/stores/${STORE}/settings`, "/soon", "/help"]);
  });

  it("shows feature-gated items only when the feature is on", () => {
    const config: NavEntry[] = [
      { kind: "link", key: "websiteBuilder", href: "/e", status: "live", feature: "storeBuilder" },
    ];
    expect(resolveSidebar(config, { storeId: STORE, features: {} })).toEqual([]);
    expect(resolveSidebar(config, { storeId: STORE, features: { storeBuilder: true } })).toHaveLength(1);
  });
});

describe("isActiveHref", () => {
  it("matches the exact page or a sub-page", () => {
    expect(isActiveHref("/orders", "/orders")).toBe(true);
    expect(isActiveHref("/orders/123", "/orders")).toBe(true);
    expect(isActiveHref("/ordersx", "/orders")).toBe(false);
  });

  it("matches home only exactly", () => {
    expect(isActiveHref("/", "/")).toBe(true);
    expect(isActiveHref("/orders", "/")).toBe(false);
  });

  it("does not light up a parent for a sibling route that has its own link", () => {
    expect(isActiveHref(`${P}/add`, P, { exact: true })).toBe(false);
  });
});

describe("findActiveHref", () => {
  const entries = resolveSidebar(SIDEBAR_CONFIG, { storeId: STORE, features: { storeBuilder: true } });
  const active = (pathname: string) => findActiveHref(entries, pathname);

  it("picks the most specific link, so one group opens", () => {
    expect(active("/orders/delivery")).toBe("/orders/delivery");
    expect(active("/orders")).toBe("/orders");
    expect(active("/orders/riders")).toBe("/orders/riders");
    expect(active("/settings/plan")).toBe("/settings/plan");
    expect(active(`/stores/${STORE}/settings/payments`)).toBe(`/stores/${STORE}/settings/payments`);
    expect(active(`/stores/${STORE}/website/blog/new`)).toBe(`/stores/${STORE}/website/blog`);
  });

  it("does not light up My stores or Settings for pages under them", () => {
    expect(active(`/stores/${STORE}/shipping`)).toBe(`/stores/${STORE}/shipping`);
    expect(active("/stores")).toBe("/stores");
    expect(active(`${P}/abc/edit`)).toBeNull();
  });

  it("lights only Categories on its page, not Manage products", () => {
    expect(active(`${P}/categories`)).toBe(`${P}/categories`);
    expect(active(P)).toBe(P);
  });

  it("lights the landing item on its own page and the child on a child page", () => {
    const group = (key: string) => entries.find((e) => e.kind === "group" && e.key === key) as ResolvedGroup;
    const products = group("products");
    // /products: the All products item, the group's first item.
    expect(products.items[0]?.href).toBe(active(P));
    expect(isGroupActive(products, active(P))).toBe(true);
    expect(group("ordersGroup").items[0]?.href).toBe(active("/orders"));
    expect(isGroupActive(group("ordersGroup"), active("/orders"))).toBe(true);
    // /products/add: the Add products item; the group stays open.
    expect(active(`${P}/add`)).toBe(`${P}/add`);
    expect(isGroupActive(products, active(`${P}/add`))).toBe(true);
    expect(isGroupActive(group("ordersGroup"), active(`${P}/add`))).toBe(false);
    expect(active(`/stores/${STORE}/website`)).toBe(`/stores/${STORE}/website`);
    expect(isGroupActive(group("websiteContent"), active(`/stores/${STORE}/website`))).toBe(true);
    expect(active(`/stores/${STORE}/settings`)).toBe(`/stores/${STORE}/settings`);
    expect(active(`/stores/${STORE}/settings/payments`)).toBe(`/stores/${STORE}/settings/payments`);
    expect(isGroupActive(group("settingsGroup"), null)).toBe(false);
  });
});

describe("resolveDashboardRoute", () => {
  it("resolves store-scoped routes by pattern", () => {
    const storeRoute = DASHBOARD_ROUTES.find((r) => r.href.includes("[storeId]"));
    if (!storeRoute) return;
    expect(resolveDashboardRoute(storeRoute.href.replace("[storeId]", STORE)).title).toBe(storeRoute.title);
  });

  it("still resolves existing pages", () => {
    expect(resolveDashboardRoute("/orders").title).toBe("orders");
    expect(resolveDashboardRoute("/orders/riders").title).toBe("riders");
  });

  it("hides the fulfillment page while Tallaby offers no fulfillment services", () => {
    const hrefs = allLinks(resolveSidebar(SIDEBAR_CONFIG, { storeId: STORE, features: {} })).map((l) => l.href);
    expect(hrefs).not.toContain("/settings/fulfillment");
    expect(DASHBOARD_ROUTES.some((r) => r.href === "/settings/fulfillment")).toBe(false);
  });
});

describe("Products under their store (F-87c slice 2)", () => {
  it("titles the store's Products pages and links the header back to that store's list", () => {
    expect(resolveDashboardRoute(P)).toMatchObject({ title: "manageProducts", parentHref: P });
    expect(resolveDashboardRoute(`${P}/add`)).toMatchObject({ title: "addProducts", parentHref: P });
    expect(resolveDashboardRoute(`${P}/inventory`)).toMatchObject({ title: "inventory", parentHref: P });
    expect(resolveDashboardRoute(`${P}/abc/edit`)).toMatchObject({ title: "editProduct", parentHref: P });
    // The old list a seller with no store still sees.
    expect(resolveDashboardRoute("/products")).toMatchObject({ title: "manageProducts", parentHref: "/products" });
  });

  it("keeps the Products pages in the command palette, filled with the selected store", () => {
    const products = COMMAND_PALETTE_ROUTES.filter((r) => r.href.startsWith("/stores/[storeId]/products"));
    expect(products.map((r) => fillStoreHref(r.href, STORE))).toEqual([P, `${P}/add`, `${P}/categories`, `${P}/inventory`, `${P}/trash`]);
    expect(products.map((r) => fillStoreHref(r.href, null))).toEqual([null, null, null, null, null]);
    // Other store-scoped pages stay out of the palette, as before.
    expect(COMMAND_PALETTE_ROUTES.some((r) => r.href.startsWith("/stores/[storeId]/settings"))).toBe(false);
  });

  it("keeps the Products label for a seller with no store (the old list), without the store-only items", () => {
    const entries = resolveSidebar(SIDEBAR_CONFIG, { storeId: null, features: {} });
    const products = entries.find((e) => e.kind === "group" && e.key === "products") as ResolvedGroup;
    expect(products.href).toBe("/products");
    expect(products.items.map((i) => i.href)).toEqual(["/products", "/reviews"]);
    expect(products.items[0]).toMatchObject({ key: "manageProducts", exact: true });
  });
});
