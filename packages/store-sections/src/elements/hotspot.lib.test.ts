import { describe, expect, it } from "vitest";
import { hotspotKind, hotspotPoint, hotspotPopoverStyle, hotspotProductIndex, hotspotReduce, type HotspotEvent, type HotspotState } from "./hotspot.lib";

const run = (events: HotspotEvent[], from: HotspotState = null) => events.reduce(hotspotReduce, from);

describe("hotspot props", () => {
  it("knows two kinds; anything else is a text note", () => {
    expect(hotspotKind("product")).toBe("product");
    expect(hotspotKind("text")).toBe("text");
    for (const bad of [undefined, null, "html", "script", 3, {}]) expect(hotspotKind(bad)).toBe("text");
  });

  it("clamps the dot to the photo and centres a bad value", () => {
    expect(hotspotPoint(34, 30)).toEqual({ x: 34, y: 30 });
    expect(hotspotPoint(33.333, 66.666)).toEqual({ x: 33.3, y: 66.7 });
    expect(hotspotPoint(-10, 250)).toEqual({ x: 0, y: 100 });
    expect(hotspotPoint("12%", undefined)).toEqual({ x: 50, y: 50 });
    expect(hotspotPoint(Number.NaN, Number.POSITIVE_INFINITY)).toEqual({ x: 50, y: 50 });
  });

  it("accepts only a whole product place from 1 to 8", () => {
    expect(hotspotProductIndex(1)).toBe(1);
    expect(hotspotProductIndex(8)).toBe(8);
    for (const bad of [0, 9, 1.5, "2", null, undefined]) expect(hotspotProductIndex(bad)).toBeNull();
  });
});

describe("hotspot popover box", () => {
  it("opens below a dot in the top half and above one in the bottom half", () => {
    const below = hotspotPopoverStyle({ x: 40, y: 30 });
    expect(below.top).toBe("calc(30% + 14px)");
    expect(below.bottom).toBeUndefined();
    expect(below.maxHeight).toBe("calc(70% - 22px)");
    const above = hotspotPopoverStyle({ x: 40, y: 80 });
    expect(above.bottom).toBe("calc(20% + 14px)");
    expect(above.top).toBeUndefined();
    expect(above.maxHeight).toBe("calc(80% - 22px)");
  });

  it("is centred on the dot and clamped to the photo's left and right edges, never wider than the photo", () => {
    const style = hotspotPopoverStyle({ x: 2, y: 10 });
    expect(style["--sf-hs-w"]).toBe("min(15rem, calc(100% - 16px))");
    expect(style.width).toBe("var(--sf-hs-w)");
    expect(style.left).toBe("clamp(8px, calc(2% - var(--sf-hs-w) / 2), calc(100% - var(--sf-hs-w) - 8px))");
    // Physical left only: the same box in Arabic and English, like the photo under it.
    expect(Object.keys(style).some((key) => /inline|right/i.test(key))).toBe(false);
  });
});

describe("hotspot open state (one per photo)", () => {
  it("a tap opens and pins a dot; a second tap closes it", () => {
    expect(run([{ type: "toggle", id: "a" }])).toEqual({ id: "a", pinned: true });
    expect(run([{ type: "toggle", id: "a" }, { type: "toggle", id: "a" }])).toBeNull();
  });

  it("a tap on another dot moves the open popover there", () => {
    expect(run([{ type: "toggle", id: "a" }, { type: "toggle", id: "b" }])).toEqual({ id: "b", pinned: true });
  });

  it("hover opens until the mouse leaves", () => {
    expect(run([{ type: "enter", id: "a" }])).toEqual({ id: "a", pinned: false });
    expect(run([{ type: "enter", id: "a" }, { type: "leave", id: "a" }])).toBeNull();
    // Moving to another dot swaps them.
    expect(run([{ type: "enter", id: "a" }, { type: "enter", id: "b" }])).toEqual({ id: "b", pinned: false });
    // A late leave of the dot that is no longer open changes nothing.
    expect(run([{ type: "enter", id: "a" }, { type: "enter", id: "b" }, { type: "leave", id: "a" }])).toEqual({ id: "b", pinned: false });
  });

  it("a click on a hovered dot pins it, so leaving keeps it open", () => {
    expect(run([{ type: "enter", id: "a" }, { type: "toggle", id: "a" }, { type: "leave", id: "a" }])).toEqual({ id: "a", pinned: true });
  });

  it("hover and focus never replace a pinned popover", () => {
    const pinned: HotspotState = { id: "a", pinned: true };
    expect(hotspotReduce(pinned, { type: "enter", id: "b" })).toBe(pinned);
    expect(hotspotReduce(pinned, { type: "focus", id: "b" })).toBe(pinned);
    expect(hotspotReduce(pinned, { type: "leave", id: "a" })).toBe(pinned);
  });

  it("focus opens, and focus leaving for another element closes, pinned or not", () => {
    expect(run([{ type: "focus", id: "a" }])).toEqual({ id: "a", pinned: false });
    expect(run([{ type: "focus", id: "a" }, { type: "blur", id: "a" }])).toBeNull();
    expect(run([{ type: "toggle", id: "a" }, { type: "blur", id: "a" }])).toBeNull();
    expect(run([{ type: "focus", id: "b" }, { type: "blur", id: "a" }])).toEqual({ id: "b", pinned: false });
  });

  it("Escape and a tap outside close whatever is open", () => {
    expect(run([{ type: "toggle", id: "a" }, { type: "escape" }])).toBeNull();
    expect(run([{ type: "enter", id: "a" }, { type: "outside" }])).toBeNull();
    expect(run([{ type: "escape" }])).toBeNull();
  });

  it("keeps the same state object when nothing changes", () => {
    const open: HotspotState = { id: "a", pinned: false };
    expect(hotspotReduce(open, { type: "enter", id: "a" })).toBe(open);
    expect(hotspotReduce(open, { type: "leave", id: "b" })).toBe(open);
  });
});
