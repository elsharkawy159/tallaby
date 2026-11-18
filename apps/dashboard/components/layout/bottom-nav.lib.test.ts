import { describe, expect, it } from "vitest";
import {
  activeBottomNavKey,
  BOTTOM_NAV_THRESHOLD,
  bottomNavEntries,
  bottomNavHiddenOn,
  bottomNavLinks,
  nextScrollState,
} from "./bottom-nav.lib";

const entries = bottomNavEntries("s1");
const links = bottomNavLinks(entries);
const active = (pathname: string) => activeBottomNavKey(entries, links, pathname);

describe("bottomNavLinks", () => {
  it("uses the sidebar's hrefs for the selected store", () => {
    expect(links).toEqual([
      { key: "dashboard", href: "/" },
      { key: "products", href: "/stores/s1/products" },
      { key: "ordersGroup", href: "/orders" },
    ]);
  });

  it("opens the store-less product list with no store", () => {
    expect(bottomNavLinks(bottomNavEntries(null)).find((l) => l.key === "products")?.href).toBe("/products");
  });
});

describe("activeBottomNavKey", () => {
  it("matches Home only on the home page", () => {
    expect(active("/")).toBe("dashboard");
    expect(active("/wallet")).toBeNull();
  });

  it("lights Products for the product pages the sidebar groups under it", () => {
    expect(active("/stores/s1/products")).toBe("products");
    expect(active("/stores/s1/products/inventory")).toBe("products");
    expect(active("/reviews")).toBe("products");
    // Not a sidebar link: falls back to the section it sits under.
    expect(active("/stores/s1/products/bulk-edit")).toBe("products");
  });

  it("lights Orders for orders pages but not for shipping pages under /orders", () => {
    expect(active("/orders")).toBe("ordersGroup");
    expect(active("/orders/missed")).toBe("ordersGroup");
    expect(active("/orders/abc-123")).toBe("ordersGroup");
    expect(active("/orders/delivery")).toBeNull();
    expect(active("/orders/riders")).toBeNull();
  });

  it("lights nothing on other sections", () => {
    expect(active("/stores/s1/website/templates")).toBeNull();
    expect(active("/stores/s1/settings")).toBeNull();
  });
});

describe("bottomNavHiddenOn", () => {
  it("hides on pages with their own bottom bar", () => {
    expect(bottomNavHiddenOn("/stores/s1/products/add")).toBe(true);
    expect(bottomNavHiddenOn("/stores/s1/products/add/ai")).toBe(true);
    expect(bottomNavHiddenOn("/stores/s1/products/p1/edit")).toBe(true);
    expect(bottomNavHiddenOn("/marketing")).toBe(true);
  });

  it("shows everywhere else", () => {
    expect(bottomNavHiddenOn("/")).toBe(false);
    expect(bottomNavHiddenOn("/stores/s1/products")).toBe(false);
    expect(bottomNavHiddenOn("/stores/s1/products/inventory")).toBe(false);
    expect(bottomNavHiddenOn("/marketing/emails")).toBe(false);
    expect(bottomNavHiddenOn("/orders")).toBe(false);
  });
});

describe("nextScrollState", () => {
  const shown = { visible: true, lastY: 300 };

  it("hides on scrolling down and shows on scrolling up", () => {
    const down = nextScrollState(shown, 300 + BOTTOM_NAV_THRESHOLD);
    expect(down).toEqual({ visible: false, lastY: 308 });
    expect(nextScrollState(down, 308 - BOTTOM_NAV_THRESHOLD)).toEqual({ visible: true, lastY: 300 });
  });

  it("ignores small moves but lets them add up", () => {
    const a = nextScrollState(shown, 303);
    expect(a).toBe(shown);
    expect(nextScrollState(a, 306)).toBe(shown);
    expect(nextScrollState(a, 309).visible).toBe(false);
  });

  it("always shows near the top, including the overscroll bounce", () => {
    expect(nextScrollState({ visible: false, lastY: 400 }, 40).visible).toBe(true);
    expect(nextScrollState({ visible: false, lastY: 10 }, -20).visible).toBe(true);
  });
});
