import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { DASHBOARD_ROUTES, resolveDashboardRoute } from "../layout/dashboard-routes.lib";
import { SIDEBAR_CONFIG, isActiveHref, resolveSidebar, type NavEntry } from "./sidebar.config";

const STORE = "33333333-3333-4333-8333-333333333333";

const allLinks = <L, G extends { kind: "group"; items: L[] }>(entries: (G | ({ kind: "link" } & L))[]): L[] =>
  entries.flatMap((e) => (e.kind === "group" ? (e as G).items : [e as L]));

describe("SIDEBAR_CONFIG", () => {
  it("only links to routes that exist in DASHBOARD_ROUTES (command palette + header)", () => {
    const routeHrefs = new Set(DASHBOARD_ROUTES.map((r) => r.href));
    for (const link of allLinks(SIDEBAR_CONFIG).filter((l) => l.status === "live")) {
      expect(routeHrefs.has(link.href), link.href).toBe(true);
    }
  });

  it("has a nav label in both languages for every group and link", () => {
    const keys = [
      ...SIDEBAR_CONFIG.map((e) => e.key),
      ...allLinks(SIDEBAR_CONFIG).map((l) => l.key),
    ];
    for (const key of keys) {
      expect((en.nav as Record<string, string>)[key], `en nav.${key}`).toBeTruthy();
      expect((ar.nav as Record<string, string>)[key], `ar nav.${key}`).toBeTruthy();
    }
  });

  it("keeps every existing page reachable", () => {
    const hrefs = allLinks(resolveSidebar(SIDEBAR_CONFIG, { storeId: STORE, features: {} })).map((l) => l.href);
    for (const href of ["/", "/orders", "/orders/delivery", "/orders/riders", "/products", "/products/add", "/reviews", "/coupons", "/marketing", "/financial", "/reports", "/settings", "/settings/fulfillment", "/help"]) {
      expect(hrefs, href).toContain(href);
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

  it("drops groups that end up empty", () => {
    const resolved = resolveSidebar(
      [{ kind: "group", key: "website", icon: undefined as never, items: [{ key: "templates", href: "/t", status: "planned" }] }],
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

describe("resolveDashboardRoute", () => {
  it("resolves store-scoped routes by pattern", () => {
    const storeRoute = DASHBOARD_ROUTES.find((r) => r.href.includes("[storeId]"));
    if (!storeRoute) return;
    expect(resolveDashboardRoute(storeRoute.href.replace("[storeId]", STORE)).title).toBe(storeRoute.title);
  });

  it("still resolves existing pages", () => {
    expect(resolveDashboardRoute("/orders").title).toBe("orders");
    expect(resolveDashboardRoute("/settings/fulfillment").title).toBe("fulfillment");
  });
});
