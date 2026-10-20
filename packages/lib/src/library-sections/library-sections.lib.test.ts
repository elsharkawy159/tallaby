import { describe, expect, it } from "vitest";
import { DESIGNS, SECTION_PRESETS, designSlotTree, getDesign } from "@workspace/store-sections/render";
import { toLibraryPreset, type LibrarySectionRow } from "./library-sections.lib";

/** The row 0086 seeds for a design (`section-seed.ts`). */
const seedRow = (design: (typeof DESIGNS)[number]): LibrarySectionRow => ({
  key: design.id,
  category: design.category,
  subcategory: design.subcategory,
  name: design.name,
  description: design.description,
  keywords: [...design.keywords],
  tree: designSlotTree(design),
  version: 1,
});

describe("toLibraryPreset", () => {
  it("turns every seeded row into the code preset with its tree", () => {
    DESIGNS.forEach((design, index) => {
      const { designId: _code, ...code } = SECTION_PRESETS[index]!;
      expect(toLibraryPreset(seedRow(design)), design.id).toEqual({ ...code, designKey: design.id, tree: designSlotTree(design), version: 1 });
    });
  });

  it("keeps the preset id rule, so ids saved by the editor still match", () => {
    expect(toLibraryPreset(seedRow(getDesign("hero-classic")!))?.id).toBe("hero.classic");
    expect(toLibraryPreset(seedRow(getDesign("products-classic")!))).toMatchObject({ capabilities: ["dynamic"], dataNeeds: ["products"] });
  });

  it("skips rows the editor could not list or insert", () => {
    const row = seedRow(getDesign("hero-classic")!);
    expect(toLibraryPreset({ ...row, category: "nope" })).toBeNull();
    expect(toLibraryPreset({ ...row, tree: null })).toBeNull();
    expect(toLibraryPreset({ ...row, tree: { type: "heading", props: {}, children: [] } })).toBeNull();
    expect(toLibraryPreset({ ...row, name: "x" })).toBeNull();
  });

  it("tolerates a missing description and keywords", () => {
    const preset = toLibraryPreset({ ...seedRow(getDesign("hero-classic")!), description: {}, keywords: null })!;
    expect(preset.description).toEqual({ ar: "", en: "" });
    expect(preset.keywords).toEqual([]);
  });
});
