import { describe, expect, it } from "vitest";
import type { SectionInstance } from "@workspace/store-sections";
import { indexAfterMove, movableOf, partAfterItemMove, placeItem, placePart, slotLayoutOf, stepMovable, stepPart } from "./editor-slots.lib";

const imageText = (extra: Partial<SectionInstance> = {}): SectionInstance => ({
  id: "s1",
  sectionId: "image-with-text",
  version: 1,
  props: { title: "T", body: "B", image: "", ctaLabel: "Go", ctaHref: "/x" },
  ...extra,
});

const features = (extra: Partial<SectionInstance> = {}): SectionInstance => ({
  id: "s2",
  sectionId: "features",
  version: 1,
  props: {
    title: "",
    items: [
      { icon: "truck", title: "A", text: "" },
      { icon: "shield", title: "B", text: "" },
      { icon: "star", title: "C", text: "" },
    ],
  },
  ...extra,
});

describe("movableOf", () => {
  it("finds slotted parts and collection items, nothing else", () => {
    expect(movableOf(imageText(), "body")).toEqual({ kind: "part", part: "body", slot: "text", index: 1 });
    expect(movableOf(imageText(), "ctaHref")).toBeNull();
    expect(movableOf(features(), "items.1.title")).toEqual({ kind: "item", collection: "items", index: 1, count: 3 });
    expect(movableOf(features(), "items.9.title")).toBeNull();
    expect(movableOf(features(), "title")).toBeNull();
    expect(movableOf({ ...imageText(), sectionId: "hero-banner" }, "title")).toBeNull();
  });
});

describe("parts", () => {
  it("places a part in the other column", () => {
    expect(slotLayoutOf(placePart(imageText(), "ctaLabel", "media", 0))).toEqual({ media: ["ctaLabel", "image"], text: ["title", "body"] });
  });

  it("steps through a slot and on into the neighbouring one", () => {
    let instance = stepPart(imageText(), "title", -1);
    expect(slotLayoutOf(instance)).toEqual({ media: ["image", "title"], text: ["body", "ctaLabel"] });
    instance = stepPart(instance, "title", -1);
    expect(slotLayoutOf(instance)).toEqual({ media: ["title", "image"], text: ["body", "ctaLabel"] });
    // Already first in the first slot.
    expect(stepPart(instance, "title", -1)).toBe(instance);
    expect(slotLayoutOf(stepPart(imageText(), "image", 1))).toEqual({ media: [], text: ["image", "title", "body", "ctaLabel"] });
  });
});

describe("items", () => {
  it("indexAfterMove", () => {
    expect([0, 1, 2, 3].map((i) => indexAfterMove(i, 0, 2))).toEqual([2, 0, 1, 3]);
    expect([0, 1, 2, 3].map((i) => indexAfterMove(i, 2, 0))).toEqual([1, 2, 0, 3]);
  });

  it("moves an item with its translation and its part styles", () => {
    const instance = features({
      translations: { en: { items: [{ title: "A-en" }, { title: "B-en" }, { title: "C-en" }] } },
      style: { parts: { "items.0.title": { color: "primary" }, title: { fontWeight: 700 } } },
      breakpointStyles: { mobile: { parts: { "items.2.text": { hidden: true } } } },
    });
    const next = placeItem(instance, "items", 0, 2);
    expect((next.props.items as { title: string }[]).map((i) => i.title)).toEqual(["B", "C", "A"]);
    expect((next.translations?.en?.items as { title: string }[]).map((i) => i.title)).toEqual(["B-en", "C-en", "A-en"]);
    expect(next.style).toEqual({ parts: { "items.2.title": { color: "primary" }, title: { fontWeight: 700 } } });
    expect(next.breakpointStyles).toEqual({ mobile: { parts: { "items.1.text": { hidden: true } } } });
  });

  it("refuses out-of-range moves and keeps the selection on the moved item", () => {
    const instance = features();
    expect(placeItem(instance, "items", 0, 0)).toBe(instance);
    expect(placeItem(instance, "items", 5, 0)).toBe(instance);
    expect(partAfterItemMove("items.0.text", "items", 0, 2)).toBe("items.2.text");
    expect(partAfterItemMove("title", "items", 0, 2)).toBe("title");
  });

  it("stepMovable steps items and parts", () => {
    const item = stepMovable(features(), "items.0.title", 1);
    expect(item.part).toBe("items.1.title");
    expect((item.instance.props.items as { title: string }[])[1]!.title).toBe("A");
    const edge = stepMovable(features(), "items.2.title", 1);
    expect(edge.part).toBe("items.2.title");
    const part = stepMovable(imageText(), "ctaLabel", -1);
    expect(slotLayoutOf(part.instance).text).toEqual(["title", "ctaLabel", "body"]);
  });
});
