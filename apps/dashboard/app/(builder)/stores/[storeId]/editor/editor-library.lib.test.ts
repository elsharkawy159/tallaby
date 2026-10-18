import { describe, expect, it } from "vitest";
import { SECTION_PRESETS, getPreset, storeSectionRegistry, type SectionPreset } from "@workspace/store-sections/render";
import type { SectionInstance } from "@workspace/store-sections";
import {
  acceptsCardPreset,
  applyCardPreset,
  applyPresetDesign,
  chromeFromPreset,
  currentPreset,
  fieldGroups,
  isDesignProp,
  payloadPreset,
  presetDataStatus,
  presetInstance,
  readShell,
  setShell,
  storeDataCounts,
} from "./editor-library.lib";

const CATEGORY = "22222222-2222-4222-8222-222222222222";

describe("presetInstance", () => {
  it("creates a valid instance for every preset with the given id", () => {
    for (const preset of SECTION_PRESETS) {
      const instance = presetInstance(preset, `s-${preset.id}`);
      expect(instance?.id, preset.id).toBe(`s-${preset.id}`);
      expect(instance?.sectionId).toBe(preset.sectionId);
    }
  });
});

describe("applyPresetDesign", () => {
  const centered = getPreset("hero.centered")!;

  it("changes design props and keeps content", () => {
    const hero: SectionInstance = {
      id: "h1",
      sectionId: "hero-banner",
      version: 1,
      props: { title: "My title", subtitle: "Mine", image: "media/x.jpg", align: "start", height: "md" },
      translations: { en: { title: "EN title" } },
    };
    const next = applyPresetDesign(hero, centered);
    expect(next.props).toMatchObject({ title: "My title", subtitle: "Mine", image: "media/x.jpg", align: "center", height: "lg" });
    expect(next.translations).toEqual(hero.translations);
    expect(next.id).toBe("h1");
  });

  it("goes back to the defaults for a preset that relies on them", () => {
    const hero: SectionInstance = { id: "h1", sectionId: "hero-banner", version: 1, props: { title: "Mine", align: "center", height: "lg" } };
    const next = applyPresetDesign(hero, getPreset("hero.full-width")!);
    expect(next.props).toMatchObject({ title: "Mine", align: "start", height: "md" });
    expect(currentPreset(next, [getPreset("hero.full-width")!, centered])?.id).toBe("hero.full-width");
  });

  it("never touches data props (source, category, picks)", () => {
    const grid: SectionInstance = { id: "g", sectionId: "product-grid", version: 1, props: { source: "category", categoryId: CATEGORY, limit: 4 } };
    const preset: SectionPreset = { ...getPreset("products.featured")!, props: { source: "featured", columns: "3", title: "X" } };
    const next = applyPresetDesign(grid, preset);
    expect(next.props.source).toBe("category");
    expect(next.props.categoryId).toBe(CATEGORY);
    expect(next.props.title).toBeUndefined();
    expect(next.props.columns).toBe("3");
  });

  it("replaces the shell and keeps other styles", () => {
    const instance: SectionInstance = { id: "r", sectionId: "rich-text", version: 1, props: {}, style: { paddingTop: 8, shell: { scheme: "dark" } } };
    const withShell: SectionPreset = { ...getPreset("content.rich-text")!, style: { shell: { scheme: "muted" } } };
    expect(applyPresetDesign(instance, withShell).style).toEqual({ paddingTop: 8, shell: { scheme: "muted" } });
    expect(applyPresetDesign(instance, getPreset("content.rich-text")!).style).toEqual({ paddingTop: 8 });
  });

  it("ignores presets of another section", () => {
    const instance: SectionInstance = { id: "r", sectionId: "rich-text", version: 1, props: { title: "t" } };
    expect(applyPresetDesign(instance, centered)).toBe(instance);
  });

  it("does not share objects with the catalog", () => {
    const preset: SectionPreset = { ...getPreset("content.rich-text")!, style: { shell: { scheme: "muted" } } };
    const next = applyPresetDesign({ id: "r", sectionId: "rich-text", version: 1, props: {} }, preset);
    expect((next.style as { shell: unknown }).shell).not.toBe((preset.style as { shell: unknown }).shell);
  });
});

describe("chromeFromPreset", () => {
  const announcement = getPreset("headers.announcement")!;
  it("keeps the current header's content and takes the design", () => {
    const current: SectionInstance = { id: "hdr", sectionId: "store-header", version: 1, props: { announcement: "Sale!", showLogo: false } };
    const next = chromeFromPreset(current, announcement, "hdr")!;
    expect(next.props.announcement).toBe("Sale!");
    expect(next.props.showLogo).toBe(false);
  });
  it("starts fresh for another section", () => {
    const next = chromeFromPreset({ id: "hdr", sectionId: "classic-header", version: 1, props: {} }, announcement, "hdr")!;
    expect(next.sectionId).toBe("store-header");
    expect(next.props.announcement).toBe(announcement.props!.announcement);
  });
});

describe("card presets", () => {
  // The card prop arrives with the product sections (phase 4); this checks the rule itself.
  const card: SectionPreset = { ...getPreset("products.featured")!, id: "product-cards.test", kind: "card", props: { columns: "2" } };
  it("apply only design props to a section that has them", () => {
    const grid: SectionInstance = { id: "g", sectionId: "product-grid", version: 1, props: { source: "featured", columns: "4" } };
    expect(acceptsCardPreset(grid, card)).toBe(true);
    expect(applyCardPreset(grid, card).props).toEqual({ source: "featured", columns: "2" });
    const text: SectionInstance = { id: "t", sectionId: "rich-text", version: 1, props: {} };
    expect(acceptsCardPreset(text, card)).toBe(false);
    expect(applyCardPreset(text, card)).toBe(text);
    expect(acceptsCardPreset(null, card)).toBe(false);
  });
});

describe("fieldGroups", () => {
  const definition = {
    ...storeSectionRegistry.get("rich-text")!,
    defaultProps: { layout: "a", source: "x", categoryId: null, title: "", columns: "3" },
    propDefinitions: [
      { key: "layout", label: { ar: "", en: "" }, type: "layout" as const },
      { key: "source", label: { ar: "", en: "" }, type: "select" as const, group: "data" as const },
      { key: "categoryId", label: { ar: "", en: "" }, type: "category" as const, group: "data" as const, showWhen: { key: "source", equals: ["category"] } },
      { key: "title", label: { ar: "", en: "" }, type: "text" as const },
      { key: "columns", label: { ar: "", en: "" }, type: "select" as const, group: "layout" as const },
    ],
  };
  it("splits design, data, content and options, honouring showWhen", () => {
    const groups = fieldGroups(definition, {});
    expect(groups.design.map((p) => p.key)).toEqual(["layout"]);
    expect(groups.data.map((p) => p.key)).toEqual(["source"]);
    expect(groups.content.map((p) => p.key)).toEqual(["title"]);
    expect(groups.options.map((p) => p.key)).toEqual(["columns"]);
    expect(fieldGroups(definition, { source: "category" }).data.map((p) => p.key)).toEqual(["source", "categoryId"]);
  });
});

describe("currentPreset", () => {
  it("finds the preset whose design the instance has", () => {
    const presets = [getPreset("hero.full-width")!, getPreset("hero.centered")!];
    const base: SectionInstance = { id: "h", sectionId: "hero-banner", version: 1, props: {} };
    expect(currentPreset(base, presets)?.id).toBe("hero.full-width");
    expect(currentPreset({ ...base, props: { align: "center", height: "lg" } }, presets)?.id).toBe("hero.centered");
    // A mix that no preset has.
    expect(currentPreset({ ...base, props: { align: "center", height: "md" } }, presets)).toBeUndefined();
  });
});

describe("setShell", () => {
  const base: SectionInstance = { id: "r", sectionId: "rich-text", version: 1, props: {}, style: { paddingTop: 4 } };
  it("merges, normalizes and keeps other styles", () => {
    const next = setShell(setShell(base, { scheme: "dark" }), { paddingY: "lg", anchor: "Bad Anchor!" as string });
    expect(next.style).toEqual({ paddingTop: 4, shell: { scheme: "dark", paddingY: "lg" } });
    expect(readShell(next)).toEqual({ scheme: "dark", paddingY: "lg" });
  });
  it("removes an empty shell so the section renders as without one", () => {
    const next = setShell(setShell(base, { scheme: "muted" }), { scheme: undefined });
    expect(next.style).toEqual({ paddingTop: 4 });
    expect(setShell({ ...base, style: undefined }, { scheme: "default" }).style).toBeUndefined();
  });
});

describe("helpers", () => {
  it("treats layout pickers and layout/appearance groups as design", () => {
    expect(isDesignProp({ key: "a", label: { ar: "", en: "" }, type: "layout" })).toBe(true);
    expect(isDesignProp({ key: "a", label: { ar: "", en: "" }, type: "select", group: "layout" })).toBe(true);
    expect(isDesignProp({ key: "a", label: { ar: "", en: "" }, type: "select", group: "data" })).toBe(false);
    expect(isDesignProp({ key: "a", label: { ar: "", en: "" }, type: "text" })).toBe(false);
  });

  it("reports a preset's data need and the store's count", () => {
    const products = getPreset("products.new-arrivals")!;
    expect(presetDataStatus(products, { products: 12 })).toEqual({ need: "products", count: 12 });
    expect(presetDataStatus(products, undefined)).toEqual({ need: "products", count: null });
    expect(presetDataStatus(getPreset("hero.centered")!, { products: 1 })).toBeNull();
  });

  it("counts the store's records per data need", () => {
    expect(
      storeDataCounts({ products: [1, 2], categories: [], forms: [1], contact: { phone: "010", email: " ", whatsapp: null }, navPages: 3 }),
    ).toEqual({ products: 2, categories: 0, forms: 1, storeInfo: 1, navigation: 3 });
  });

  it("accepts a dragged preset only for its own section", () => {
    expect(payloadPreset("hero-banner", "hero.centered")?.id).toBe("hero.centered");
    expect(payloadPreset("rich-text", "hero.centered")).toBeUndefined();
    expect(payloadPreset("hero-banner", "nope")).toBeUndefined();
    expect(payloadPreset("hero-banner", undefined)).toBeUndefined();
    expect(storeSectionRegistry.get("hero-banner")).toBeDefined();
  });
});
