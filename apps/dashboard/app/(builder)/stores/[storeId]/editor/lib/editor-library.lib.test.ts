import { describe, expect, it } from "vitest";
import { SECTION_PRESETS, getPreset, storeSectionRegistry } from "@workspace/store-sections/render";
import type { SectionInstance } from "@workspace/store-sections";
import {
  applyPresetDesign,
  fieldGroups,
  isDesignProp,
  payloadPreset,
  presetDataStatus,
  presetInstance,
  readShell,
  setShell,
  storeDataCounts,
} from "./editor-library.lib";

describe("presetInstance", () => {
  it("creates a valid instance for every preset with the given id", () => {
    for (const preset of SECTION_PRESETS) {
      const instance = presetInstance(preset, `s-${preset.id}`);
      expect(instance?.id, preset.id).toBe(`s-${preset.id}`);
      expect(instance?.sectionId).toBe(preset.sectionId);
    }
  });

  it("builds a design preset's tree in the store's default locale", () => {
    const preset = getPreset("statistics.classic")!;
    expect(JSON.stringify(presetInstance(preset, "s1", "en")!.componentTree)).toContain('"translations":{"ar":');
    expect(JSON.stringify(presetInstance(preset, "s1")!.componentTree)).toContain('"translations":{"en":');
  });

  it("uses the store industry's default photos", () => {
    const preset = getPreset("hero.classic")!;
    const tree = (industry?: string) => JSON.stringify(presetInstance(preset, "s1", "ar", industry)!.componentTree);
    expect(tree("beauty")).toContain("images.pexels.com");
    expect(tree("beauty")).not.toBe(tree("pets"));
  });
});

describe("applyPresetDesign on tree sections", () => {
  it("leaves a tree section unchanged", () => {
    const preset = getPreset("statistics.classic")!;
    const instance = presetInstance(preset, "s1")!;
    expect(applyPresetDesign(instance, preset)).toBe(instance);
  });
});

describe("fieldGroups", () => {
  const definition = {
    ...storeSectionRegistry.get("custom-section")!,
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

  it("reports no data need for static designs", () => {
    expect(presetDataStatus(getPreset("hero.classic")!, { products: 1 })).toBeNull();
  });

  it("counts the store's records per data need", () => {
    expect(
      storeDataCounts({ products: [1, 2], categories: [], forms: [1], contact: { phone: "010", email: " ", whatsapp: null }, navPages: 3 }),
    ).toEqual({ products: 2, categories: 0, forms: 1, storeInfo: 1, navigation: 3 });
  });

  it("accepts a dragged preset only for its own section", () => {
    expect(payloadPreset("custom-section", "hero.classic")?.id).toBe("hero.classic");
    expect(payloadPreset("hero-banner", "hero.classic")).toBeUndefined();
    expect(payloadPreset("custom-section", "nope")).toBeUndefined();
    expect(payloadPreset("custom-section", undefined)).toBeUndefined();
  });
});
