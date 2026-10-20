import { describe, expect, it } from "vitest";
import { SECTION_CATEGORIES } from "@workspace/store-sections/render";
import { dropIndex, sectionsByCategory } from "./editor-palette.lib";

describe("sections by category (P4B-06)", () => {
  it("lists every insertable section once, in category order, with no empty groups", () => {
    const groups = sectionsByCategory();
    const ids = groups.flatMap((g) => g.sections.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(groups.every((g) => g.sections.length > 0 && g.sections.every((s) => s.category === g.category))).toBe(true);
    const order = groups.map((g) => SECTION_CATEGORIES.indexOf(g.category));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // Every section is a tree section now.
    expect(ids).toEqual(["custom-section"]);
  });
});

describe("section drop index", () => {
  const boxes = [
    { top: 0, bottom: 100 },
    { top: 100, bottom: 300 },
  ];
  it("drops above a section in its upper half and below it in its lower half", () => {
    expect(dropIndex(boxes, 10)).toBe(0);
    expect(dropIndex(boxes, 60)).toBe(1);
    expect(dropIndex(boxes, 199)).toBe(1);
    expect(dropIndex(boxes, 250)).toBe(2);
    expect(dropIndex([], 40)).toBe(0);
  });
});
