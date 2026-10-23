import { describe, expect, it } from "vitest";
import { DESIGNS, designSlotTree } from "@workspace/store-sections/render";
import { getCodeTemplate } from "@workspace/store-sections/templates";
import { SECTION_PAGE_ID, demoCatalogSnapshot, sectionEditorInitial, sectionTreeOf } from "./section-editor.lib";

const hero = DESIGNS.find((d) => d.id === "hero-classic")!;

const row = (tree = designSlotTree(hero)) => ({
  id: "0f8fad5b-d9cb-469f-a165-70867728950e",
  key: "hero-classic",
  name: { ar: "هيرو", en: "Classic hero" },
  tree,
  draftVersion: 4,
  version: 2,
  hasDraft: true,
});

const demo = getCodeTemplate("tallaby-classic")!.demo;

describe("sectionEditorInitial", () => {
  it("shows the section as the one page, keeping its photo slots", () => {
    const initial = sectionEditorInitial(row(), { demo, designSystem: { colors: {}, typography: {}, spacing: {} }, fontClassName: "f" });
    expect(initial.pages).toHaveLength(1);
    const page = initial.pages[0]!;
    expect(page).toMatchObject({ id: SECTION_PAGE_ID, slug: "section", isHome: true, version: 4 });
    expect(page.content.sections).toHaveLength(1);
    const section = page.content.sections[0]!;
    expect(section.sectionId).toBe("custom-section");
    expect(section.componentTree?.[0]?.type).toBe("section");
    expect(JSON.stringify(section)).toContain("stock:photo:");
    expect(initial).toMatchObject({ header: null, footer: null, defaultLocale: "ar", isLive: true, hasUnpublishedChanges: true, presets: [], maxSections: 1 });
    expect(initial.catalog.products.length).toBeGreaterThan(0);
  });

  it("edits a product page section on a product page (demo product, product elements)", () => {
    const options = { demo, designSystem: { colors: {}, typography: {}, spacing: {} }, fontClassName: "f" };
    expect(sectionEditorInitial({ ...row(), category: "product-page" }, options).pages[0]!.kind).toBe("product");
    expect(sectionEditorInitial({ ...row(), category: "hero" }, options).pages[0]!.kind).toBeUndefined();
  });

  it("marks a never-published section as not live", () => {
    const initial = sectionEditorInitial({ ...row(), version: 0 }, { demo, designSystem: { colors: {}, typography: {}, spacing: {} }, fontClassName: "" });
    expect(initial.isLive).toBe(false);
    expect(initial.hasUnpublishedChanges).toBe(true);
  });
});

describe("sectionTreeOf", () => {
  it("round-trips the edited tree back to the stored template (slots kept)", () => {
    const tree = designSlotTree(hero);
    const initial = sectionEditorInitial(row(tree), { demo, designSystem: { colors: {}, typography: {}, spacing: {} }, fontClassName: "" });
    expect(sectionTreeOf(initial.pages[0]!.content)).toEqual(tree);
  });

  it("rejects page content that is not exactly one tree section", () => {
    const initial = sectionEditorInitial(row(), { demo, designSystem: { colors: {}, typography: {}, spacing: {} }, fontClassName: "" });
    const section = initial.pages[0]!.content.sections[0]!;
    expect(sectionTreeOf({ sections: [] })).toBeNull();
    expect(sectionTreeOf({ sections: [section, { ...section, id: "other" }] })).toBeNull();
    expect(sectionTreeOf({ sections: [{ ...section, sectionId: "hero" }] })).toBeNull();
    expect(sectionTreeOf({ sections: [{ ...section, componentTree: [] }] })).toBeNull();
    expect(sectionTreeOf(null)).toBeNull();
  });
});

describe("demoCatalogSnapshot", () => {
  it("is the demo store's products and categories with no other store data", () => {
    const snapshot = demoCatalogSnapshot(demo);
    expect(snapshot.products).toEqual(demo.products);
    expect(snapshot.categories).toEqual(demo.categories);
    expect(snapshot).toMatchObject({ forms: [], failed: [] });
  });
});
