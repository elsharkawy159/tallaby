import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BOTTOM_NAV_ITEMS_PROP } from "../config/bottom-nav";
import { setChromeOption } from "../config/header";
import type { SectionInstance } from "../config/schema";
import type { RenderContext } from "../core/types";
import { SiteBottomNav, bottomNavOn } from "./bottom-nav";

const header: SectionInstance = { id: "h", type: "custom-section", props: {}, componentTree: [] } as unknown as SectionInstance;
const ctx = (locale: "ar" | "en"): Pick<RenderContext, "locale" | "Link" | "renderCartBadge"> => ({
  locale,
  Link: ({ href, children, ...rest }) => <a href={href} data-part={rest["data-part"]}>{children}</a>,
  renderCartBadge: () => <b>3</b>,
});

describe("phone bottom navigation", () => {
  it("is on by default and links Home, Shop, Cart and Profile, each with its name", () => {
    expect(bottomNavOn(header)).toBe(true);
    const html = renderToStaticMarkup(<SiteBottomNav header={header} ctx={ctx("en")} />);
    expect([...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1])).toEqual(["/", "/products", "/cart", "/profile"]);
    for (const label of ["Home", "Shop", "Cart", "Profile"]) expect(html).toContain(`>${label}<`);
    // The live cart count sits on the cart icon.
    expect(html).toContain('<span class="sf-bnav-badge"><b>3</b></span>');
  });

  it("speaks Arabic by default", () => {
    const html = renderToStaticMarkup(<SiteBottomNav header={header} ctx={ctx("ar")} />);
    for (const label of ["الرئيسية", "المتجر", "السلة", "حسابي"]) expect(html).toContain(`>${label}<`);
  });

  it("is left out when the seller turns it off in the header's options", () => {
    const off = setChromeOption(header, "header", "bottomNav", false);
    expect(off.props).toEqual({ bottomNav: false });
    expect(bottomNavOn(off)).toBe(false);
    expect(renderToStaticMarkup(<SiteBottomNav header={off} ctx={ctx("en")} />)).toBe("");
    // Turning it back on stores nothing (the default).
    expect(setChromeOption(off, "header", "bottomNav", true).props).toEqual({});
  });
});

describe("the seller's bottom navigation (F-74)", () => {
  const withItems = (items: unknown[]): SectionInstance => ({ ...header, props: { [BOTTOM_NAV_ITEMS_PROP]: items } });
  const hrefs = (html: string) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

  it("draws the default bar exactly as before for a store without items", () => {
    const html = renderToStaticMarkup(<SiteBottomNav header={header} ctx={ctx("en")} pages={[]} />);
    expect(hrefs(html)).toEqual(["/", "/products", "/cart", "/profile"]);
    expect([...html.matchAll(/data-part="([^"]+)"/g)].map((m) => m[1])).toEqual(["bottom-nav-home", "bottom-nav-navShop", "bottom-nav-navCart", "bottom-nav-navProfile"]);
  });

  it("draws the seller's order, places and pages, with their names", () => {
    const h = withItems([{ type: "wishlist" }, { type: "page", pageId: "p1", slug: "about", label: { ar: "من نحن", en: "About us" } }, { type: "cart" }]);
    const html = renderToStaticMarkup(<SiteBottomNav header={h} ctx={ctx("en")} />);
    expect(hrefs(html)).toEqual(["/profile/wishlist", "/about", "/cart"]);
    for (const label of ["Wishlist", "About us", "Cart"]) expect(html).toContain(`>${label}<`);
    // The cart count stays on the cart, wherever it is.
    expect(html).toContain('<span class="sf-bnav-badge"><b>3</b></span>');
    expect(renderToStaticMarkup(<SiteBottomNav header={h} ctx={ctx("ar")} />)).toContain(">من نحن<");
  });

  it("follows a page's new slug and drops a deleted page when the host passes the pages", () => {
    const h = withItems([{ type: "home" }, { type: "page", pageId: "p1", slug: "about", label: { ar: "من نحن" } }, { type: "page", pageId: "gone", slug: "old", label: { ar: "قديمة" } }]);
    const html = renderToStaticMarkup(<SiteBottomNav header={h} ctx={ctx("ar")} pages={[{ id: "p1", slug: "our-story", name: "قصتنا" }]} />);
    expect(hrefs(html)).toEqual(["/", "/our-story"]);
  });

  it("is still turned off by the header's option", () => {
    const h = setChromeOption(withItems([{ type: "home" }]), "header", "bottomNav", false);
    expect(renderToStaticMarkup(<SiteBottomNav header={h} ctx={ctx("en")} />)).toBe("");
  });
});
