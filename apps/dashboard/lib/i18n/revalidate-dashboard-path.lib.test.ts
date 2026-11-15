import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DASHBOARD_ROUTE_GROUPS, dashboardRevalidateTargets } from "./revalidate-dashboard-path.lib";

describe("dashboardRevalidateTargets", () => {
  it("prefixes a literal page path with each locale", () => {
    expect(dashboardRevalidateTargets("/orders")).toEqual([{ path: "/ar/orders" }, { path: "/en/orders" }]);
  });

  it("keeps concrete ids in a literal path", () => {
    expect(dashboardRevalidateTargets("/stores/abc/settings/checkout")).toEqual([
      { path: "/ar/stores/abc/settings/checkout" },
      { path: "/en/stores/abc/settings/checkout" },
    ]);
  });

  it("maps the root page to each locale's home", () => {
    expect(dashboardRevalidateTargets("/")).toEqual([{ path: "/ar" }, { path: "/en" }]);
  });

  it("drops a trailing slash", () => {
    expect(dashboardRevalidateTargets("/wallet/")).toEqual([{ path: "/ar/wallet" }, { path: "/en/wallet" }]);
  });

  it("turns a typed route pattern into the [locale] pattern of each route group", () => {
    expect(dashboardRevalidateTargets("/stores/[storeId]/products", "page")).toEqual([
      { path: "/[locale]/(main)/stores/[storeId]/products", type: "page" },
      { path: "/[locale]/(builder)/stores/[storeId]/products", type: "page" },
    ]);
  });

  it("turns a typed literal layout into the [locale] pattern of each route group", () => {
    expect(dashboardRevalidateTargets("/orders", "layout")).toEqual([
      { path: "/[locale]/(main)/orders", type: "layout" },
      { path: "/[locale]/(builder)/orders", type: "layout" },
    ]);
  });

  it("rejects a path without a leading slash", () => {
    expect(() => dashboardRevalidateTargets("orders")).toThrow();
  });

  it("lists exactly the route groups under app/[locale]", () => {
    const dir = path.resolve(__dirname, "../../app/[locale]");
    const groups = readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^\(.+\)$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
    expect(groups).toEqual([...DASHBOARD_ROUTE_GROUPS].sort());
  });
});
