import { describe, expect, it } from "vitest";
import { DATA_NEEDS, DEMO_PRODUCT } from "@workspace/store-sections/render";
import { REFRESH_INTERVAL_MS, canvasProduct, dataAction, failedNeeds, shouldRefresh } from "./editor-data.lib";

const store = { id: "fb7bbe96-9838-4a52-952a-42691fde3287", catalogMode: "all" };

describe("dataAction", () => {
  it("sends each need to its management page", () => {
    expect(dataAction("products", store)).toEqual({ kind: "link", href: "/products/add" });
    expect(dataAction("categories", store)).toEqual({ kind: "link", href: "/products/categories" });
    expect(dataAction("brands", store)).toEqual({ kind: "link", href: "/products/brands" });
    expect(dataAction("reviews", store)).toEqual({ kind: "link", href: "/reviews" });
    expect(dataAction("promotions", store)).toEqual({ kind: "link", href: "/coupons" });
    expect(dataAction("articles", store)).toEqual({ kind: "link", href: `/stores/${store.id}/website/blog/new` });
    expect(dataAction("storeInfo", store)).toEqual({ kind: "link", href: `/stores/${store.id}/settings` });
    expect(dataAction("forms", store)).toEqual({ kind: "link", href: `/stores/${store.id}/website/forms` });
    expect(dataAction("navigation", store)).toEqual({ kind: "pages" });
  });

  it("asks a selected-catalog store for its picks, not new products", () => {
    expect(dataAction("products", { ...store, catalogMode: "selected" })).toEqual({ kind: "link", href: `/stores/${store.id}/settings#catalog-mode` });
  });

  it("has an action for every need and only same-origin links", () => {
    for (const need of DATA_NEEDS) {
      const action = dataAction(need, store);
      if (action.kind === "link") expect(action.href.startsWith("/") && !action.href.startsWith("//")).toBe(true);
    }
  });

  it("encodes the store id", () => {
    expect(dataAction("forms", { id: "a/b", catalogMode: "all" })).toEqual({ kind: "link", href: "/stores/a%2Fb/website/forms" });
  });
});

describe("failedNeeds", () => {
  it("maps failed sources to the needs whose sections show an error", () => {
    expect(failedNeeds(["sales", "brands", "reviews", "reviews", "coupons"])).toEqual(["products", "brands", "reviews", "promotions"]);
    expect(failedNeeds([])).toEqual([]);
  });
});

describe("shouldRefresh", () => {
  it("throttles automatic refreshes and never overlaps them", () => {
    expect(shouldRefresh(0, REFRESH_INTERVAL_MS, false)).toBe(true);
    expect(shouldRefresh(1000, 1000 + REFRESH_INTERVAL_MS - 1, false)).toBe(false);
    expect(shouldRefresh(1000, 1001, false, true)).toBe(true);
    expect(shouldRefresh(0, 99_999, true, true)).toBe(false);
  });
});

describe("canvasProduct", () => {
  it("draws the preview product, else the demo product", () => {
    const real = { ...DEMO_PRODUCT, id: "p1", title: "Real" };
    expect(canvasProduct(real)).toBe(real);
    expect(canvasProduct(null)).toBe(DEMO_PRODUCT);
    expect(canvasProduct(undefined)).toBe(DEMO_PRODUCT);
  });
});
