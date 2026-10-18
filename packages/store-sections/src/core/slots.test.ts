import { describe, expect, it } from "vitest";
import {
  findPartSlot,
  isCustomSlotLayout,
  movePartToSlot,
  resetSlotLayout,
  resolveSlotLayout,
  type SlotDefinition,
} from "./slots";
import type { SectionInstance } from "../config/schema";

type Inst = { id?: string; slots?: SectionInstance["slots"] };
const blank = (): Inst => ({});

const SLOTS: SlotDefinition[] = [
  { key: "media", label: { ar: "صورة", en: "Media" }, parts: ["image"], accepts: ["title", "body"] },
  { key: "text", label: { ar: "نص", en: "Text" }, parts: ["title", "body", "cta"], accepts: ["image"] },
];

describe("resolveSlotLayout", () => {
  it("uses the default parts when nothing is stored", () => {
    expect(resolveSlotLayout({}, SLOTS)).toEqual({ media: ["image"], text: ["title", "body", "cta"] });
  });

  it("follows the stored order and moves", () => {
    const layout = resolveSlotLayout({ slots: { media: { order: ["title", "image"] }, text: { order: ["cta", "body"] } } }, SLOTS);
    expect(layout).toEqual({ media: ["title", "image"], text: ["cta", "body"] });
  });

  it("drops unknown, refused and duplicate keys, and puts lost parts back home", () => {
    const layout = resolveSlotLayout(
      // `cta` is not accepted in media; `x` is unknown; `title` is claimed twice.
      { slots: { media: { order: ["cta", "x", "title"] }, text: { order: ["title", "body"] } } },
      SLOTS,
    );
    expect(layout).toEqual({ media: ["title", "image"], text: ["body", "cta"] });
  });
});

describe("movePartToSlot", () => {
  it("reorders inside a slot and writes every slot's full order", () => {
    const next = movePartToSlot(blank(), SLOTS, "cta", "text", 0);
    expect(next.slots).toEqual({ media: { order: ["image"] }, text: { order: ["cta", "title", "body"] } });
  });

  it("moves a part to another slot that accepts it", () => {
    const next = movePartToSlot(blank(), SLOTS, "title", "media", 1);
    expect(resolveSlotLayout(next, SLOTS)).toEqual({ media: ["image", "title"], text: ["body", "cta"] });
    expect(findPartSlot(resolveSlotLayout(next, SLOTS), "title")).toEqual({ slot: "media", index: 1 });
  });

  it("refuses a slot that does not accept the part, an unknown slot and a no-op", () => {
    const instance = blank();
    expect(movePartToSlot(instance, SLOTS, "cta", "media", 0)).toBe(instance);
    expect(movePartToSlot(instance, SLOTS, "title", "nope", 0)).toBe(instance);
    expect(movePartToSlot(instance, SLOTS, "body", "text", 1)).toBe(instance);
    expect(movePartToSlot(instance, SLOTS, "ghost", "text", 0)).toBe(instance);
  });

  it("clamps the index and keeps other slot data", () => {
    const next = movePartToSlot({ slots: { text: { order: ["title", "body", "cta"], hidden: ["cta"] } } }, SLOTS, "title", "text", 99);
    expect(next.slots?.text).toEqual({ order: ["body", "cta", "title"], hidden: ["cta"] });
  });

  it("does not change its input", () => {
    const instance = { slots: { text: { order: ["title", "body", "cta"] } } };
    const copy = structuredClone(instance);
    movePartToSlot(instance, SLOTS, "title", "media", 0);
    expect(instance).toEqual(copy);
  });
});

describe("custom layout and reset", () => {
  it("tells a custom layout from the default and resets it", () => {
    const moved = movePartToSlot<Inst>({ id: "s1", slots: { other: { order: ["a"] } } }, SLOTS, "image", "text", 3);
    expect(isCustomSlotLayout(moved, SLOTS)).toBe(true);
    const reset = resetSlotLayout(moved, SLOTS);
    expect(isCustomSlotLayout(reset, SLOTS)).toBe(false);
    expect(reset.slots).toEqual({ other: { order: ["a"] } });
    expect(resetSlotLayout(movePartToSlot<Inst>({ id: "s2" }, SLOTS, "cta", "text", 0), SLOTS)).toEqual({ id: "s2" });
  });

  it("a stored default order is not custom", () => {
    expect(isCustomSlotLayout({ slots: { media: { order: ["image"] }, text: { order: ["title", "body", "cta"] } } }, SLOTS)).toBe(false);
  });
});
