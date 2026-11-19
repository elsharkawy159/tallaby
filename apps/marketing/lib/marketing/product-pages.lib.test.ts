import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FEATURE_PAGES, INTEGRATION_PAGES } from "./detail-pages.lib";
import { PRODUCT_AREAS, PRODUCT_MENU, PRODUCT_PAGES, areaOfHref } from "./product-pages.lib";
import { SOLUTIONS } from "./solutions.lib";

type Menu = { areas: Record<string, { title: string; body: string }>; items: Record<string, { title: string; body: string }> };

const menuWords = (locale: string): Menu =>
  (JSON.parse(readFileSync(path.resolve(__dirname, `../../messages/marketing/site.${locale}.json`), "utf8")) as { nav: { productMenu: Menu } }).nav.productMenu;

/** Every page the menu or a product page may link to. */
const REAL_PATHS = new Set([
  "/templates",
  "/pricing",
  "/integrations",
  "/blog",
  "/tools/profit-margin-calculator",
  ...FEATURE_PAGES.map((page) => `/features/${page.slug}`),
  ...PRODUCT_PAGES.map((page) => `/features/${page.slug}`),
  ...INTEGRATION_PAGES.map((page) => `/integrations/${page.slug}`),
  ...SOLUTIONS.map((solution) => `/solutions/${solution.slug}`),
]);

describe("product pages", () => {
  it("never shares a slug with an older feature page", () => {
    const slugs = [...FEATURE_PAGES, ...PRODUCT_PAGES].map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("links only to pages that exist", () => {
    for (const area of PRODUCT_AREAS) for (const item of PRODUCT_MENU[area]) expect(REAL_PATHS.has(item.href), item.href).toBe(true);
    for (const page of PRODUCT_PAGES) {
      for (const { href } of page.related) expect(REAL_PATHS.has(href), `${page.slug} → ${href}`).toBe(true);
      for (const row of page.rows) if (row.href) expect(REAL_PATHS.has(row.href), `${page.slug} → ${row.href}`).toBe(true);
    }
  });

  it("lists every product page in its own group of the menu", () => {
    for (const page of PRODUCT_PAGES) expect(areaOfHref(`/features/${page.slug}`), page.slug).toBe(page.area);
  });

  it.each(["ar", "en"])("names every group and menu item (%s)", (locale) => {
    const words = menuWords(locale);
    for (const area of PRODUCT_AREAS) {
      expect(words.areas[area]?.title, area).toBeTruthy();
      for (const item of PRODUCT_MENU[area]) expect(words.items[item.id]?.title, item.id).toBeTruthy();
    }
  });
});
