import { describe, expect, it } from "vitest";
import type { SiteConfig } from "@workspace/store-sections/config";
import { siteNavPages } from "./site-nav.lib";

const page = (fields: Partial<SiteConfig["pages"][number]>) => ({ name: "", slug: "", isHome: false, ...fields }) as SiteConfig["pages"][number];

describe("siteNavPages", () => {
  it("siteNavPages leaves the product page out of the nav", () => {
    const site = {
      pages: [
        page({ name: "الرئيسية", slug: "home", isHome: true }),
        page({ name: "About", slug: "about" }),
        // Even a product page saved with showInNav on never reaches the menus.
        page({ name: "Product page", slug: "product", kind: "product", showInNav: true }),
        page({ name: "Hidden", slug: "hidden", showInNav: false }),
      ],
    };
    expect(siteNavPages(site, "en")).toEqual([
      { name: "Home", href: "/", isHome: true },
      { name: "About", href: "/about", isHome: false },
    ]);
    expect(siteNavPages(site, "ar").map((p) => p.href)).toEqual(["/", "/about"]);
  });

  it("names each page in the visitor's language when the revision has both", () => {
    const site = { pages: [page({ name: "من نحن", names: { ar: "من نحن", en: "About us" }, slug: "about" }), page({ name: "تواصل", names: { ar: "تواصل" }, slug: "contact" })] };
    expect(siteNavPages(site, "en").map((p) => p.name)).toEqual(["About us", "تواصل"]);
    expect(siteNavPages(site, "ar").map((p) => p.name)).toEqual(["من نحن", "تواصل"]);
  });
});
