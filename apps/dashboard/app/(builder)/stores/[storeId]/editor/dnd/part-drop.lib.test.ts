import { describe, expect, it } from "vitest";
import type { SectionInstance } from "@workspace/store-sections";
import { planItemMove, planPartMove } from "./part-drop.lib";

const imageText: SectionInstance = { id: "s1", sectionId: "image-with-text", version: 1, props: {} };
const cta: SectionInstance = { id: "s2", sectionId: "cta-banner", version: 1, props: {} };

describe("planPartMove", () => {
  it("moves within a slot (index after removal)", () => {
    expect(planPartMove(imageText, "title", { slot: "text", beforePart: null })).toEqual({ slot: "text", index: 2 });
    expect(planPartMove(imageText, "ctaLabel", { slot: "text", beforePart: "title" })).toEqual({ slot: "text", index: 0 });
  });

  it("moves to the other column", () => {
    expect(planPartMove(imageText, "body", { slot: "media", beforePart: "image" })).toEqual({ slot: "media", index: 0 });
  });

  it("is a no-op over its own place", () => {
    expect(planPartMove(imageText, "body", { slot: "text", beforePart: "body" })).toBe("same");
    expect(planPartMove(imageText, "body", { slot: "text", beforePart: "ctaLabel" })).toBe("same");
    expect(planPartMove(cta, "ctaLabel", { slot: "content", beforePart: null })).toBe("same");
  });

  it("refuses unknown slots and parts that are not slotted", () => {
    expect(planPartMove(imageText, "title", { slot: "nope", beforePart: null })).toBeNull();
    expect(planPartMove(imageText, "ctaHref", { slot: "text", beforePart: null })).toBeNull();
    expect(planPartMove({ ...imageText, sectionId: "hero-banner" }, "title", { slot: "text", beforePart: null })).toBeNull();
  });
});

describe("planItemMove", () => {
  it("counts the insertion point before removal", () => {
    expect(planItemMove(0, 3)).toBe(2);
    expect(planItemMove(2, 0)).toBe(0);
    expect(planItemMove(1, 1)).toBe("same");
    expect(planItemMove(1, 2)).toBe("same");
  });
});
