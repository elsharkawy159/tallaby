import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sectionInstanceSchema } from "../config/schema";
import { DATA_NEEDS, type RenderContext } from "../core/types";
import { getDesign } from "../designs";
import { normalizeSectionStyle } from "../elements/style";
import { SectionRenderer } from "../render/render";
import { storeSectionRegistry } from "../sections";
import { LIBRARY_CATEGORIES } from "./categories";
import { filterPresets, getPreset, instantiatePreset, normalizeSearch, presetCountByCategory, presetsForSection } from "./library";
import { SECTION_PRESETS } from "./presets";
import { LIBRARY_CATEGORY_IDS } from "./types";

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
  it("lists all 15 categories once, in order, each with subcategories", () => {
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
    expect(category?.subcategories.some((s) => s.id === preset.subcategory), preset.subcategory).toBe(true);
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
        expect(() => renderToStaticMarkup(<SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={{ ...ctx, locale, mode }} />)).not.toThrow();
      }
    }
  });

  it("lists only design presets, at most one per category for now", () => {
    const counts = presetCountByCategory();
    for (const id of LIBRARY_CATEGORY_IDS) expect(counts[id], id).toBeLessThanOrEqual(1);
    expect(SECTION_PRESETS.map((p) => p.id).sort()).toEqual(["about.our-story", "hero.split", "statistics.cards"]);
  });

  it("counts presets per category", () => {
    const counts = presetCountByCategory();
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(SECTION_PRESETS.length);
  });
});

describe("instantiatePreset", () => {
  it("gives every inserted copy its own tree", () => {
    const preset = getPreset("hero.split")!;
    const a = instantiatePreset(preset, storeSectionRegistry, "a")!;
    const b = instantiatePreset(preset, storeSectionRegistry, "b")!;
    expect(a.id).toBe("a");
    expect(b.id).toBe("b");
    expect(a.componentTree).not.toBe(b.componentTree);
    expect(a.componentTree![0]!.id).not.toBe(b.componentTree![0]!.id);
  });

  it("starts a tree section for a design preset", () => {
    const instance = instantiatePreset(getPreset("statistics.cards")!, storeSectionRegistry, "t1")!;
    expect(instance).toMatchObject({ id: "t1", sectionId: "custom-section", source: "stats-cards@1" });
    expect(instance.componentTree).toHaveLength(1);
    expect(instance.componentTree![0]!.type).toBe("section");
    const en = instantiatePreset(getPreset("statistics.cards")!, storeSectionRegistry, "t2", { defaultLocale: "en" })!;
    expect(JSON.stringify(en.componentTree)).toContain('"translations":{"ar":');
  });

  it("returns null for an unknown design", () => {
    expect(instantiatePreset({ ...getPreset("statistics.cards")!, designId: "nope" }, storeSectionRegistry, "x")).toBeNull();
  });

  it("resolves every design preset to a design", () => {
    for (const preset of SECTION_PRESETS) {
      expect(getDesign(preset.designId!), preset.id).toBeDefined();
      expect(preset.sectionId, preset.id).toBe("custom-section");
    }
  });

  it("returns null for an unknown section", () => {
    expect(instantiatePreset({ ...getPreset("hero.split")!, designId: undefined, sectionId: "nope" }, storeSectionRegistry, "x")).toBeNull();
  });
});

describe("search and filters", () => {
  it("folds Arabic spelling variants and case", () => {
    expect(normalizeSearch("  أحدث  المنتجاتُ ")).toBe(normalizeSearch("احدث المنتجات"));
    expect(normalizeSearch("Hero")).toBe("hero");
    expect(normalizeSearch("قصة")).toBe(normalizeSearch("قصه"));
  });

  it("finds presets by name, keyword and category in both languages", () => {
    expect(filterPresets({ query: "banner" }).map((p) => p.id)).toContain("hero.split");
    expect(filterPresets({ query: "بانر" }).map((p) => p.id)).toContain("hero.split");
    expect(filterPresets({ query: "numbers" }).map((p) => p.id)).toContain("statistics.cards");
    expect(filterPresets({ query: "قصتنا" }).map((p) => p.id)).toContain("about.our-story");
    expect(filterPresets({ query: "zzzz-nothing" })).toEqual([]);
  });

  it("filters by category, subcategory and capability", () => {
    expect(filterPresets({ category: "hero" }).map((p) => p.id)).toEqual(["hero.split"]);
    expect(filterPresets({ category: "hero", subcategory: "split" }).map((p) => p.id)).toEqual(["hero.split"]);
    expect(filterPresets({ category: "products" })).toEqual([]);
    expect(filterPresets({ capabilities: ["static"] })).toHaveLength(3);
    expect(filterPresets({ capabilities: ["interactive"] })).toEqual([]);
  });

  it("offers no design switcher for tree sections yet", () => {
    expect(presetsForSection("custom-section")).toEqual([]);
  });
});
