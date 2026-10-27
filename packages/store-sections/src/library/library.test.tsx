import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sectionInstanceSchema } from "../config/schema";
import { DATA_NEEDS, type RenderContext } from "../core/types";
import { DESIGNS, designSlotTree, getDesign } from "../designs";
import { HERO_DESIGNS } from "../designs/hero";
import { normalizeSectionStyle } from "../elements/style";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { LIBRARY_CATEGORIES } from "./categories";
import { filterPresets, getPreset, instantiatePreset, normalizeSearch, presetCountByCategory, presetsForSection } from "./library";
import { SECTION_PRESETS } from "./presets";
import { designPreset, presetDataNeeds, presetIdFor } from "./presets/library";
import { LIBRARY_CATEGORY_IDS, type SectionPreset } from "./types";

const ctx: RenderContext = {
  mode: "edit",
  locale: "ar",
  dir: "rtl",
  store: { name: "متجر", url: "https://x.tallaby.com" },
  pages: [{ name: "الرئيسية", href: "/", isHome: true }],
  catalog: { products: {}, categories: [] },
  Link: ({ href, className, children }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  imageUrl: (src) => (src ? `https://cdn.test/${src}` : null),
  formatPrice: (n) => `${n} EGP`,
};

describe("library catalog", () => {
  it("lists all 29 categories once, in order, each with subcategories", () => {
    expect(LIBRARY_CATEGORIES.map((c) => c.id)).toEqual([...LIBRARY_CATEGORY_IDS]);
    for (const category of LIBRARY_CATEGORIES) {
      expect(category.subcategories.length, category.id).toBeGreaterThan(0);
      expect(new Set(category.subcategories.map((s) => s.id)).size, category.id).toBe(category.subcategories.length);
      expect(category.name.ar && category.name.en && category.description.ar && category.description.en, category.id).toBeTruthy();
    }
  });

  it("has unique preset ids named after their category", () => {
    expect(new Set(SECTION_PRESETS.map((p) => p.id)).size).toBe(SECTION_PRESETS.length);
    for (const preset of SECTION_PRESETS) expect(preset.id.startsWith(`${preset.category}.`), preset.id).toBe(true);
  });

  it.each(SECTION_PRESETS.map((p) => [p.id, p] as const))("%s is valid", (_id, preset) => {
    const definition = storeSectionRegistry.get(preset.sectionId);
    expect(definition, preset.sectionId).toBeDefined();
    const category = LIBRARY_CATEGORIES.find((c) => c.id === preset.category);
    expect(
      category?.subcategories.some((s) => s.id === preset.subcategory),
      preset.subcategory,
    ).toBe(true);
    expect(preset.name.ar && preset.name.en && preset.description.ar && preset.description.en).toBeTruthy();
    expect(preset.capabilities.length).toBeGreaterThan(0);
    for (const need of preset.dataNeeds ?? []) expect(DATA_NEEDS).toContain(need);
    if (preset.dataNeeds?.length && preset.kind !== "card") expect(preset.capabilities).toContain("dynamic");

    // Props must survive the schema unchanged: `.catch()` would hide a typo by
    // silently falling back to a default.
    const parsed = definition!.propsSchema.safeParse({ ...definition!.defaultProps, ...preset.props });
    expect(parsed.success).toBe(true);
    for (const [key, value] of Object.entries(preset.props ?? {})) {
      expect((parsed.data as Record<string, unknown>)[key], `${preset.id}.${key}`).toEqual(value);
    }
    // A style must survive normalisation unchanged too.
    if (preset.style) expect(normalizeSectionStyle(preset.style)).toEqual(preset.style);
  });

  it.each(SECTION_PRESETS.map((p) => [p.id, p] as const))("%s inserts and renders", (_id, preset) => {
    const instance = instantiatePreset(preset, storeSectionRegistry, "s-new")!;
    expect(sectionInstanceSchema.safeParse(instance).success).toBe(true);
    for (const locale of ["ar", "en"] as const) {
      for (const mode of ["edit", "public"] as const) {
        expect(() =>
          renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={{ ...ctx, locale, mode }} />),
        ).not.toThrow();
      }
    }
  });

  it("lists one design preset per section design, in design order", () => {
    expect(SECTION_PRESETS.map((p) => p.designId)).toEqual(DESIGNS.map((d) => d.id));
    expect(getPreset("hero.classic")?.designId).toBe("hero-classic");
  });

  it("counts presets per category", () => {
    const counts = presetCountByCategory();
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(SECTION_PRESETS.length);
  });
});

describe("instantiatePreset", () => {
  it("gives every inserted copy its own tree", () => {
    const preset = getPreset("hero.classic")!;
    const a = instantiatePreset(preset, storeSectionRegistry, "a")!;
    const b = instantiatePreset(preset, storeSectionRegistry, "b")!;
    expect(a.id).toBe("a");
    expect(b.id).toBe("b");
    expect(a.componentTree).not.toBe(b.componentTree);
    expect(a.componentTree![0]!.id).not.toBe(b.componentTree![0]!.id);
  });

  it("starts a tree section for a design preset", () => {
    const instance = instantiatePreset(getPreset("hero.poster")!, storeSectionRegistry, "t1")!;
    expect(instance).toMatchObject({ id: "t1", sectionId: "custom-section", source: "hero-poster@1" });
    expect(instance.componentTree).toHaveLength(1);
    expect(instance.componentTree![0]!.type).toBe("section");
    const en = instantiatePreset(getPreset("hero.poster")!, storeSectionRegistry, "t2", { defaultLocale: "en" })!;
    expect(JSON.stringify(en.componentTree)).toContain('"translations":{"ar":');
  });

  it("returns null for an unknown design", () => {
    expect(instantiatePreset({ ...getPreset("hero.poster")!, designId: "nope" }, storeSectionRegistry, "x")).toBeNull();
  });

  it("resolves every design preset to a design", () => {
    for (const preset of SECTION_PRESETS) {
      expect(getDesign(preset.designId!), preset.id).toBeDefined();
      expect(preset.sectionId, preset.id).toBe("custom-section");
    }
  });

  it("returns null for an unknown section", () => {
    expect(instantiatePreset({ ...getPreset("hero.classic")!, designId: undefined, sectionId: "nope" }, storeSectionRegistry, "x")).toBeNull();
  });
});

describe("search and filters", () => {
  it("folds Arabic spelling variants and case", () => {
    expect(normalizeSearch("  أحدث  المنتجاتُ ")).toBe(normalizeSearch("احدث المنتجات"));
    expect(normalizeSearch("Hero")).toBe("hero");
    expect(normalizeSearch("قصة")).toBe(normalizeSearch("قصه"));
  });

  it("finds presets by name, keyword and category in both languages", () => {
    expect(filterPresets({ query: "banner" }).map((p) => p.id)).toContain("hero.classic");
    expect(filterPresets({ query: "بانر" }).map((p) => p.id)).toContain("hero.classic");
    expect(filterPresets({ query: "numbers" }).map((p) => p.id)).toContain("statistics.classic");
    expect(filterPresets({ query: "قصتنا" }).map((p) => p.id)).toContain("image-text.classic");
    expect(filterPresets({ query: "zzzz-nothing" })).toEqual([]);
  });

  it("filters by category, subcategory and capability", () => {
    expect(filterPresets({ category: "hero" }).map((p) => p.id)).toEqual(HERO_DESIGNS.map((d) => d.id.replace("hero-", "hero.")));
    expect(filterPresets({ category: "hero", subcategory: "split" }).map((p) => p.id)).toEqual(["hero.classic", "hero.halves", "hero.split"]);
    expect(filterPresets({ category: "product-page" }).map((p) => p.id)).toEqual([
      "product-page.main",
      "product-page.content",
      "product-page.reviews",
      "product-page.related",
      "product-page.perks",
      "product-page.shipping",
    ]);
    // Designs with data nodes are dynamic and list the store data they need.
    const dynamic = filterPresets({ capabilities: ["dynamic"] });
    expect(dynamic.map((p) => p.category)).toContain("products");
    expect(getPreset("products.classic")?.dataNeeds).toEqual(["products"]);
    expect(getPreset("newsletter.classic")?.dataNeeds).toEqual(["forms"]);
    expect(filterPresets({ capabilities: ["static"] })).toHaveLength(SECTION_PRESETS.length - dynamic.length);
    expect(filterPresets({ capabilities: ["interactive"] })).toEqual([]);
  });

  it("offers no design switcher for tree sections yet", () => {
    expect(presetsForSection("custom-section")).toEqual([]);
  });
});

describe("presets with a stored tree (library_sections, Task 10)", () => {
  /** What a library_sections row seeded from `design` becomes (no designId: the tree is the source of truth). */
  const treePreset = (design: (typeof DESIGNS)[number]): SectionPreset => {
    const { designId: _code, ...preset } = designPreset(design);
    return { ...preset, designKey: design.id, tree: designSlotTree(design), version: design.version };
  };

  it.each(["fashion", undefined])("instantiates exactly like the design preset (industry %s)", (industry) => {
    for (const design of DESIGNS) {
      let a = 0;
      let b = 0;
      const fromDb = instantiatePreset(treePreset(design), storeSectionRegistry, "s1", { industry, makeId: () => `n${++a}` });
      const fromCode = instantiatePreset(designPreset(design), storeSectionRegistry, "s1", { industry, makeId: () => `n${++b}` });
      expect(fromDb, design.id).toEqual(fromCode);
    }
  });

  it("names the design and the stored version in source", () => {
    const design = getDesign("hero-classic")!;
    const instance = instantiatePreset({ ...treePreset(design), version: 7 }, storeSectionRegistry, "s1")!;
    expect(instance.source).toBe("hero-classic@7");
    const { designKey: _key, ...noKey } = treePreset(design);
    expect(instantiatePreset({ ...noKey, version: undefined }, storeSectionRegistry, "s2")!.source).toBe("hero.classic@1");
  });

  it("resolves every photo slot for the store's industry", () => {
    for (const design of DESIGNS) {
      for (const industry of ["food", undefined]) {
        const instance = instantiatePreset(treePreset(design), storeSectionRegistry, "s1", { industry })!;
        expect(JSON.stringify(instance.componentTree), design.id).not.toContain('"stock:');
      }
    }
  });

  it("finds presets in a custom list, and lists and counts it", () => {
    const custom = [treePreset(getDesign("hero-classic")!)];
    expect(getPreset("hero.classic", custom)).toBe(custom[0]);
    expect(getPreset("hero.poster", custom)).toBeUndefined();
    expect(getPreset("hero.poster")?.designId).toBe("hero-poster");
    expect(filterPresets({ query: "banner" }, custom)).toEqual(custom);
    expect(presetCountByCategory(custom).hero).toBe(1);
    // An admin-edited row keeps the code id but searches by its own words.
    const edited = [{ ...custom[0]!, keywords: ["zebra-word"] }];
    expect(filterPresets({ query: "zebra-word" }, edited)).toEqual(edited);
    expect(filterPresets({ query: "zebra-word" })).toEqual([]);
  });

  it("computes data needs from a tree like the design preset does", () => {
    for (const design of DESIGNS) expect(presetDataNeeds(designSlotTree(design)), design.id).toEqual(designPreset(design).dataNeeds ?? []);
  });

  it("builds preset ids from a design key", () => {
    for (const design of DESIGNS) expect(presetIdFor(design.category, design.id)).toBe(designPreset(design).id);
  });
});
