import { describe, expect, it } from "vitest";
import {
  BOTTOM_NAV_ITEMS_PROP,
  BOTTOM_NAV_MAX_ITEMS,
  DEFAULT_BOTTOM_NAV,
  bottomNavHref,
  bottomNavIcon,
  bottomNavItems,
  readBottomNavItems,
  setBottomNavItems,
  type BottomNavItem,
} from "./bottom-nav";
import type { SectionInstance } from "./schema";
import { sanitizeSiteConfig } from "./sanitize";
import { CODE_TEMPLATES } from "../templates/catalog";

const header = (props: Record<string, unknown> = {}): SectionInstance => ({ id: "h", sectionId: "custom-section", version: 1, props, componentTree: [] });

describe("bottom navigation items (F-74)", () => {
  it("defaults to Home, Shop, Cart, Profile when the header has no items", () => {
    expect(readBottomNavItems(header())).toBeNull();
    expect(bottomNavItems(header())).toEqual(DEFAULT_BOTTOM_NAV);
    expect(bottomNavItems(null).map(bottomNavHref)).toEqual(["/", "/products", "/cart", "/profile"]);
  });

  it("reads the seller's items, keeps their order and drops what it can't trust", () => {
    const items = readBottomNavItems(
      header({
        [BOTTOM_NAV_ITEMS_PROP]: [
          { type: "cart" },
          { type: "page", pageId: "p1", slug: "about-us", label: { ar: " من نحن ", en: "About" }, icon: "info" },
          { type: "page", slug: "../evil", label: { ar: "x" } },
          { type: "page", slug: "javascript:alert(1)", label: {} },
          { type: "cart" },
          { type: "home", icon: "rocket" },
          { type: "admin" },
          "nope",
        ],
      }),
    );
    expect(items).toEqual([
      { type: "cart" },
      { type: "page", pageId: "p1", slug: "about-us", label: { ar: "من نحن", en: "About" }, icon: "info" },
      { type: "home" },
    ]);
  });

  it("keeps at most five", () => {
    const many = ["home", "shop", "search", "cart", "account", "orders", "wishlist"].map((type) => ({ type }));
    expect(readBottomNavItems(header({ [BOTTOM_NAV_ITEMS_PROP]: many }))).toHaveLength(BOTTOM_NAV_MAX_ITEMS);
  });

  it("falls back to the default bar when nothing usable is stored", () => {
    expect(bottomNavItems(header({ [BOTTOM_NAV_ITEMS_PROP]: [] }))).toEqual(DEFAULT_BOTTOM_NAV);
    expect(bottomNavItems(header({ [BOTTOM_NAV_ITEMS_PROP]: "home" }))).toEqual(DEFAULT_BOTTOM_NAV);
  });

  it("stores only a change from the default bar", () => {
    expect(setBottomNavItems(header({ other: 1 }), DEFAULT_BOTTOM_NAV).props).toEqual({ other: 1 });
    const items: BottomNavItem[] = [{ type: "home" }, { type: "search" }];
    expect(setBottomNavItems(header(), items).props[BOTTOM_NAV_ITEMS_PROP]).toEqual(items);
    // Removing the custom bar again drops the prop.
    expect(setBottomNavItems(setBottomNavItems(header(), items), []).props).toEqual({});
  });

  it("picks a ready icon per place and per page, unless the seller chose one", () => {
    expect(bottomNavIcon({ type: "wishlist" })).toBe("heart");
    expect(bottomNavIcon({ type: "page", slug: "contact", label: {} })).toBe("phone");
    expect(bottomNavIcon({ type: "page", slug: "p-2", label: { ar: "العروض" } })).toBe("tag");
    expect(bottomNavIcon({ type: "page", slug: "p-3", label: { ar: "صفحة" } })).toBe("fileText");
    expect(bottomNavIcon({ type: "cart", icon: "shoppingCart" })).toBe("shoppingCart");
  });

  it("survives saving (sanitizeSiteConfig)", () => {
    const items: BottomNavItem[] = [{ type: "home" }, { type: "page", slug: "about", label: { ar: "من نحن" } }];
    const site = { ...CODE_TEMPLATES[0]!.config(), header: setBottomNavItems(CODE_TEMPLATES[0]!.config().header!, items) };
    expect(readBottomNavItems(sanitizeSiteConfig(site).header)).toEqual(items);
  });
});
