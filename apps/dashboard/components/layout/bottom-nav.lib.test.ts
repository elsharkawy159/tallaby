import { describe, expect, it } from "vitest";
import { activeBottomNavKey, bottomNavEntries, bottomNavHiddenOn, bottomNavLinks } from "./bottom-nav.lib";

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
