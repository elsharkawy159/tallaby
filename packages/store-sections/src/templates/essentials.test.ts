import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import { productPageOf } from "../config/product-page.lib";
import { validateSiteConfig } from "../config/validate";
import { nodeCatalogQuery, walkNodes } from "../elements/data";
import { SECTION_PRESETS } from "../library";
import { CODE_TEMPLATES, LIBRARY_TEMPLATES, getCodeTemplate } from "./catalog";
import { HOME_GRID_PAGE_SIZE, sectionCategory, templateEssentials } from "./essentials";
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
    const essentials = templateEssentials(getCodeTemplate("mode")!.config());
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

describe("Add › Sections in template order", () => {
  it("names the library designs a template is built from, first use first", () => {
    const keys = templateLibraryKeys(getCodeTemplate("mode")!.config(), "mode");
    const home = keys.indexOf("hero-ticket");
    expect(home).toBeGreaterThan(-1);
    expect(keys.indexOf("promo-ticker")).toBeLessThan(home);
    expect(keys.some((key) => key.startsWith("mode-"))).toBe(false);
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
