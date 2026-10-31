import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { DASHBOARD_ROUTES, resolveDashboardRoute } from "../layout/dashboard-routes.lib";
import {
  SIDEBAR_CONFIG,
  findActiveHref,
  isActiveHref,
  resolveSidebar,
  storeBuilderEnabled,
  type NavEntry,
} from "./sidebar.config";

const STORE = "33333333-3333-4333-8333-333333333333";

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

const allLinks = <L, G extends { kind: "group"; items: L[] }>(
  entries: (G | ({ kind: "link" } & L) | { kind: "divider" })[],
): L[] => entries.flatMap((e) => (e.kind === "group" ? (e as G).items : e.kind === "link" ? [e as L] : []));

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
    for (const href of ["/", "/orders", "/orders/delivery", "/orders/riders", "/products", "/products/add", "/products/categories", "/reviews", "/coupons", "/marketing", "/wallet", "/financial", "/stores", "/settings", "/settings/plan", "/help"]) {
      expect(hrefs, href).toContain(href);
    }
  });

  it("puts every store-scoped page in the sidebar once a store exists", () => {
    const linked = new Set(allLinks(SIDEBAR_CONFIG).map((l) => l.href));
    // /reports is hidden from the sidebar until the page has content.
    const hidden = new Set(["/reports"]);
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
      "products",
      "ordersGroup",
      "fulfillmentShipping",
      "finance",
      "|",
      "websiteContent",
      "marketing",
      "storeAnalytics",
      "apps",
      "settingsGroup",
      "|",
      "accountHelp",
    ]);
  });

  it("keeps account-wide pages out of the selected-store settings", () => {
    const hrefs = (key: string) =>
      SIDEBAR_CONFIG.flatMap((e) => (e.kind === "group" && e.key === key ? e.items.map((i) => i.href) : []));
    expect(hrefs("settingsGroup").every((h) => h.includes("[storeId]"))).toBe(true);
    expect(hrefs("accountHelp")).toEqual(["/stores", "/settings", "/settings/plan", "/help", "/roadmap", "/earn"]);
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
      "products",
      "ordersGroup",
      "fulfillmentShipping",
      "finance",
      "|",
      "marketing",
      "|",
      "accountHelp",
    ]);
  });

  it("files each page under the same section in the sidebar and the header", () => {
    for (const group of SIDEBAR_CONFIG) {
      if (group.kind !== "group") continue;
      for (const item of group.items) {
        const route = DASHBOARD_ROUTES.find((r) => r.href === item.href);
        expect(route?.parent, item.href).toBe(group.key);
      }
    }
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
    expect(isActiveHref("/products/add", "/products", { exact: true })).toBe(false);
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
    expect(active("/products/abc/edit")).toBeNull();
  });

  it("lights only Categories on its page, not Manage products", () => {
    expect(active("/products/categories")).toBe("/products/categories");
    expect(active("/products")).toBe("/products");
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
