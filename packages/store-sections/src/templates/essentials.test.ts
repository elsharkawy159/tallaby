import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance, SiteConfig } from "../config/schema";
import { productPageOf } from "../config/product-page.lib";
import { validateSiteConfig } from "../config/validate";
import { nodeCatalogQuery, walkNodes } from "../elements/data";
import { SECTION_PRESETS } from "../library";
import { CODE_TEMPLATES, LIBRARY_TEMPLATES, getCodeTemplate } from "./catalog";
import { HOME_CATEGORY_RAIL_LIMIT, HOME_GRID_PAGE_SIZE, sectionCategory, sourceDesignId, templateEssentials } from "./essentials";
import { preferTemplatePresets, templateLibraryKeys } from "./library-order";
import { templateFormNeeds } from "./prepare";

const nodesOf = (section: SectionInstance) => {
  const out: ComponentNode[] = [];
  walkNodes(section.componentTree, (node) => out.push(node));
  return out;
};
const lists = (section: SectionInstance) => nodesOf(section).some((n) => ["productList", "categoryList", "postList"].includes(n.type));

describe("templateEssentials (owner, 2026-10-23)", () => {
  for (const template of CODE_TEMPLATES) {
    it(`${template.key}: the hero and the store-data sections only`, () => {
      const full = template.config();
      const essentials = templateEssentials(full);
      const fullHome = full.pages.find((p) => p.isHome)!;
      const home = essentials.pages.find((p) => p.isHome)!;
      const hero = fullHome.content.sections.find((s) => sectionCategory(s) === "hero") ?? fullHome.content.sections[0]!;

      expect(home.content.sections.some((s) => s.id === hero.id)).toBe(true);
      for (const section of home.content.sections) expect(section.id === hero.id || lists(section)).toBe(true);
      expect(home.content.sections.some((s) => nodesOf(s).some((n) => n.type === "storeForm" && s.id !== hero.id))).toBe(false);

      // One main grid of 12 per page.
      const paginated = home.content.sections.flatMap(nodesOf).filter((n) => n.props?.paginate === true);
      expect(paginated).toHaveLength(1);
      expect(paginated[0]!.props.limit).toBe(HOME_GRID_PAGE_SIZE);
      expect(nodeCatalogQuery(paginated[0]!)).toMatchObject({ paginate: true, limit: HOME_GRID_PAGE_SIZE });

      for (const page of essentials.pages.filter((p) => !p.isHome && p.kind !== "product")) {
        for (const section of page.content.sections) {
          expect(sectionCategory(section) === "page-header" || lists(section) || nodesOf(section).some((n) => n.type === "storeForm")).toBe(true);
        }
      }
      // Header, footer and the page list are the template's.
      expect(essentials.header).toEqual(full.header);
      expect(essentials.footer).toEqual(full.footer);
      expect(essentials.pages.map((p) => p.slug)).toEqual(full.pages.map((p) => p.slug));
    });
  }

  it("keeps the contact form and drops the home newsletter", () => {
    const essentials = templateEssentials(getCodeTemplate("kasr")!.config());
    const contact = essentials.pages.find((p) => p.slug === "contact")!;
    expect(contact.content.sections.some((s) => nodesOf(s).some((n) => n.type === "storeForm"))).toBe(true);
    expect(essentials.pages.find((p) => p.slug === "about")!.content.sections.every((s) => sectionCategory(s) === "page-header")).toBe(true);
    expect(templateFormNeeds(templateEssentials(getCodeTemplate("tallaby-classic")!.config()))).not.toContain("newsletter");
  });
});

describe("templateEssentials keeps the product page's product sections", () => {
  const extras = ["product-perks", "product-shipping"];
  const checks = [
    ...CODE_TEMPLATES.slice(0, 1).map((t) => [t.key, t.config()] as const),
    ...LIBRARY_TEMPLATES.slice(0, 2).map((t) => [t.key, t.config()] as const),
  ];
  for (const [key, full] of checks) {
    it(`${key}: main, content, reviews and related stay; perks and shipping go`, () => {
      const before = productPageOf(full)!;
      const after = productPageOf(templateEssentials(full))!;
      const types = (s: SectionInstance): string[] => nodesOf(s).map((n) => n.type);
      const ids = after.content.sections.map((s) => s.id);
      const hasType = (type: string) => after.content.sections.some((s) => types(s).includes(type));
      for (const type of ["productGallery", "productBuyBox", "productContent", "productReviews", "productList"]) expect(hasType(type)).toBe(true);
      for (const s of before.content.sections) {
        const isExtra = extras.some((e) => s.source?.includes(e) || s.id.includes(e));
        if (types(s).some((t) => t.startsWith("product"))) expect(ids).toContain(s.id);
        if (isExtra) expect(ids).not.toContain(s.id);
      }
      expect(validateSiteConfig(templateEssentials(full)).success).toBe(true);
    });
  }
});

describe("templateEssentials paginates the home's real grid (2026-11-25)", () => {
  const paginatedIn = (sections: readonly SectionInstance[]) =>
    sections.filter((s) => nodesOf(s).some((n) => n.props?.paginate === true)).map((s) => s.id);
  const darraga = getCodeTemplate("darraga")!.config();
  const homeOf = (config: typeof darraga) => config.pages.find((p) => p.isHome)!.content.sections;

  it("skips a 2-column list before the grid and pages the grid's list", () => {
    // Darraga's home: a 2-column best-sellers list (`products-rows`), then the 4-column new-in grid.
    expect(paginatedIn(homeOf(templateEssentials(darraga)))).toEqual(["darraga-new-in"]);
  });

  it("never pages a carousel, and pages the grid's list when a carousel comes first", () => {
    const home = homeOf(darraga);
    const carousel = home.find((s) => s.id === "darraga-products-category-carousel")!;
    const reordered = { ...darraga, pages: darraga.pages.map((p) => (p.isHome ? { ...p, content: { ...p.content, sections: [home[0]!, carousel, ...home.slice(1).filter((s) => s !== carousel)] } } : p)) };
    const pages = homeOf(templateEssentials(reordered));
    expect(paginatedIn(pages)).toEqual(["darraga-new-in"]);
    expect(nodesOf(pages.find((s) => s.id === carousel.id)!).some((n) => n.props?.paginate === true)).toBe(false);
  });

  it("falls back to the first product section's list when the home has no grid", () => {
    const home = homeOf(darraga).filter((s) => s.id !== "darraga-new-in");
    const noGrid = { ...darraga, pages: darraga.pages.map((p) => (p.isHome ? { ...p, content: { ...p.content, sections: home } } : p)) };
    expect(paginatedIn(homeOf(templateEssentials(noGrid)))).toEqual(["darraga-products-rows"]);
  });
});

describe("templateEssentials gives home category carousels the store's limit (2026-11-25)", () => {
  const listsOf = (config: SiteConfig) => config.pages.find((p) => p.isHome)!.content.sections.flatMap(nodesOf).filter((n) => n.type === "productList");
  const homeLists = (key: string) => [listsOf(getCodeTemplate(key)!.config()), listsOf(templateEssentials(getCodeTemplate(key)!.config()))] as const;

  it("raises a category carousel's demo limit to HOME_CATEGORY_RAIL_LIMIT, keeping its category place and columns", () => {
    // Darraga's carousel of the store's 3rd category shows 4 in the gallery (its demo fills one row).
    const [before, after] = homeLists("darraga");
    const rail = (lists: readonly ComponentNode[]) => lists.find((n) => n.props.source === "category" && n.props.rail === true)!;
    expect(rail(before).props.limit).toBe(4);
    expect(rail(after).props).toMatchObject({ limit: HOME_CATEGORY_RAIL_LIMIT, categoryIndex: 3, rail: true });
    expect(rail(after).style?.columns).toBe(rail(before).style?.columns);
  });

  it("leaves a category list that is not a carousel, and the paginated grid, as they are", () => {
    const grid: ComponentNode = { id: "g", type: "productList", props: { source: "category", categoryIndex: 1, limit: 4 }, style: { columns: 4 }, children: [] };
    const rail: ComponentNode = { ...grid, id: "r", props: { ...grid.props, rail: true, limit: 3 } };
    const darraga = getCodeTemplate("darraga")!.config();
    const home = darraga.pages.find((p) => p.isHome)!;
    const extra: SectionInstance = { ...home.content.sections.find((s) => s.id === "darraga-products-category-carousel")!, id: "extra", componentTree: [{ id: "s", type: "section", props: {}, children: [grid, rail] }] };
    const config = { ...darraga, pages: darraga.pages.map((p) => (p.isHome ? { ...p, content: { ...p.content, sections: [...p.content.sections, extra] } } : p)) };
    const after = templateEssentials(config).pages.find((p) => p.isHome)!.content.sections;
    const [g, r] = nodesOf(after.find((s) => s.id === "extra")!).filter((n) => n.type === "productList");
    expect(g!.props).toEqual(grid.props);
    expect(r!.props.limit).toBe(HOME_CATEGORY_RAIL_LIMIT);
    const paginated = after.flatMap(nodesOf).filter((n) => n.props?.paginate === true);
    expect(paginated).toHaveLength(1);
    expect(paginated[0]!.props.limit).toBe(HOME_GRID_PAGE_SIZE);
  });
});

describe("Add › Sections in template order", () => {
  it("names the library designs a template is built from, first use first", () => {
    const template = getCodeTemplate("kasr")!;
    const config = template.config();
    const keys = templateLibraryKeys(config, "kasr");
    const libraryIdOf = (id: string | null) => template.designs.find((d) => d.id === id)?.libraryId;
    const header = libraryIdOf(sourceDesignId(config.header!))!;
    const hero = libraryIdOf(sourceDesignId(config.pages.find((p) => p.isHome)!.content.sections[0]!))!;
    expect(keys[0]).toBe(header);
    expect(keys.indexOf(hero)).toBeGreaterThan(0);
    expect(keys.some((key) => key.startsWith("kasr-"))).toBe(false);
  });

  it("lists those presets first in each category, the rest in library order", () => {
    const heroes = SECTION_PRESETS.filter((p) => p.category === "hero" && p.designId);
    const fourth = heroes[3]!;
    const ordered = preferTemplatePresets(SECTION_PRESETS, [fourth.designId!]);
    expect(ordered.filter((p) => p.category === "hero" && p.designId)[0]).toBe(fourth);
    expect(ordered).toHaveLength(SECTION_PRESETS.length);
    expect(preferTemplatePresets(SECTION_PRESETS, []).map((p) => p.id)).toEqual(SECTION_PRESETS.map((p) => p.id));
  });
});
