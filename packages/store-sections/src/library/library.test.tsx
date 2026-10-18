import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sectionInstanceSchema } from "../config/schema";
import { DATA_NEEDS, type RenderContext } from "../core/types";
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

  it("counts presets per category", () => {
    const counts = presetCountByCategory();
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(SECTION_PRESETS.length);
  });
});

describe("instantiatePreset", () => {
  it("clones props and style so instances never share objects with the catalog", () => {
    const preset = getPreset("testimonials.quote-cards")!;
    const a = instantiatePreset(preset, storeSectionRegistry, "a")!;
    const b = instantiatePreset(preset, storeSectionRegistry, "b")!;
    expect(a.id).toBe("a");
    expect(b.id).toBe("b");
    expect(a.props.items).toEqual(b.props.items);
    expect(a.props.items).not.toBe(b.props.items);
    expect(a.props.items).not.toBe(preset.props!.items);
    expect(a.version).toBe(storeSectionRegistry.get(preset.sectionId)!.version);
  });

  it("returns null for an unknown section", () => {
    expect(instantiatePreset({ ...getPreset("hero.centered")!, sectionId: "nope" }, storeSectionRegistry, "x")).toBeNull();
  });
});

describe("search and filters", () => {
  it("folds Arabic spelling variants and case", () => {
    expect(normalizeSearch("  أحدث  المنتجاتُ ")).toBe(normalizeSearch("احدث المنتجات"));
    expect(normalizeSearch("Hero")).toBe("hero");
    expect(normalizeSearch("قصة")).toBe(normalizeSearch("قصه"));
  });

  it("finds presets by name, keyword and category in both languages", () => {
    expect(filterPresets({ query: "new arrivals" }).map((p) => p.id)).toContain("products.new-arrivals");
    expect(filterPresets({ query: "وصل حديثا" }).map((p) => p.id)).toContain("products.new-arrivals");
    expect(filterPresets({ query: "whatsapp" }).map((p) => p.id)).toContain("contact.info");
    expect(filterPresets({ query: "zzzz-nothing" })).toEqual([]);
  });

  it("filters by category, subcategory and capability", () => {
    const products = filterPresets({ category: "products" });
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((p) => p.category === "products")).toBe(true);
    expect(filterPresets({ category: "categories", subcategory: "circles" }).map((p) => p.id)).toEqual(["categories.circles"]);
    const interactive = filterPresets({ capabilities: ["interactive"] });
    expect(interactive.every((p) => p.capabilities.includes("interactive"))).toBe(true);
    expect(filterPresets({ query: "accordion", capabilities: ["static"] })).toEqual([]);
    expect(filterPresets({ query: "accordion", capabilities: ["interactive"] }).map((p) => p.id)).toEqual(["content.faq"]);
  });

  it("lists the presets a section can switch between", () => {
    expect(presetsForSection("product-grid").every((p) => p.sectionId === "product-grid")).toBe(true);
  });
});
