import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { setChromeOption } from "../config/header";
import type { SectionInstance } from "../config/schema";
import type { RenderContext } from "../core/types";
import { SiteBottomNav, bottomNavOn } from "./bottom-nav";

const header: SectionInstance = { id: "h", type: "custom-section", props: {}, componentTree: [] } as unknown as SectionInstance;
const ctx = (locale: "ar" | "en"): Pick<RenderContext, "locale" | "Link" | "renderCartBadge"> => ({
  locale,
  Link: ({ href, children }) => <a href={href}>{children}</a>,
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
