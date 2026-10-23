import { describe, expect, it } from "vitest";
import type { SiteConfig } from "@workspace/store-sections/config";
import { siteNavPages } from "./site-nav.lib";

const page = (fields: Partial<SiteConfig["pages"][number]>) => ({ name: "", slug: "", isHome: false, ...fields }) as SiteConfig["pages"][number];

describe("siteNavPages", () => {
  it("buildContext excludes product page from nav", () => {
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
});
