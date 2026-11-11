import { describe, expect, it } from "vitest";
import { beforeAfterStart, beforeClip, handleShift, positionFromKey, positionFromPointer } from "./before-after.lib";

describe("before/after position", () => {
  it("clamps the start position and falls back to the middle", () => {
    expect(beforeAfterStart(30)).toBe(30);
    expect(beforeAfterStart(33.6)).toBe(34);
    expect(beforeAfterStart(-20)).toBe(0);
    expect(beforeAfterStart(900)).toBe(100);
    for (const bad of [undefined, null, "70", Number.NaN, Number.POSITIVE_INFINITY, {}, "50%;background:url(x)"]) expect(beforeAfterStart(bad)).toBe(50);
  });

  it("reads the pointer from the left in English and from the right in Arabic", () => {
    // A frame from x=100 to x=500.
    expect(positionFromPointer(200, 100, 400, false)).toBe(25);
    expect(positionFromPointer(200, 100, 400, true)).toBe(75);
    expect(positionFromPointer(300, 100, 400, false)).toBe(50);
    expect(positionFromPointer(300, 100, 400, true)).toBe(50);
    // One decimal, and never outside the frame.
    expect(positionFromPointer(233, 100, 400, false)).toBe(33.3);
    expect(positionFromPointer(-50, 100, 400, false)).toBe(0);
    expect(positionFromPointer(9000, 100, 400, false)).toBe(100);
    expect(positionFromPointer(9000, 100, 400, true)).toBe(0);
    // A frame with no width (hidden) keeps the middle.
    expect(positionFromPointer(200, 100, 0, false)).toBe(50);
    expect(positionFromPointer(Number.NaN, 100, 400, false)).toBe(50);
  });

  it("moves with the arrow keys the way the arrow points", () => {
    expect(positionFromKey(50, "ArrowRight", false)).toBe(55);
    expect(positionFromKey(50, "ArrowLeft", false)).toBe(45);
    // Arabic: the start side is on the right, so the left arrow shows more of Before.
    expect(positionFromKey(50, "ArrowLeft", true)).toBe(55);
    expect(positionFromKey(50, "ArrowRight", true)).toBe(45);
    for (const rtl of [false, true]) {
      expect(positionFromKey(50, "ArrowUp", rtl)).toBe(55);
      expect(positionFromKey(50, "ArrowDown", rtl)).toBe(45);
      expect(positionFromKey(50, "PageUp", rtl)).toBe(70);
      expect(positionFromKey(50, "PageDown", rtl)).toBe(30);
      expect(positionFromKey(50, "Home", rtl)).toBe(0);
      expect(positionFromKey(50, "End", rtl)).toBe(100);
    }
  });

  it("stops at the ends, ignores other keys and survives a bad current value", () => {
    expect(positionFromKey(98, "ArrowRight", false)).toBe(100);
    expect(positionFromKey(3, "ArrowLeft", false)).toBe(0);
    expect(positionFromKey(50, "Tab", false)).toBeNull();
    expect(positionFromKey(50, "a", false)).toBeNull();
    expect(positionFromKey(50, "Enter", false)).toBeNull();
    expect(positionFromKey(Number.NaN, "ArrowRight", false)).toBe(55);
    expect(positionFromKey(400, "ArrowLeft", false)).toBe(95);
  });

  it("cuts the Before layer from the end side and shifts the handle from the start side", () => {
    expect(beforeClip(false)).toBe("inset(0 calc(100% - var(--sf-ba)) 0 0)");
    expect(beforeClip(true)).toBe("inset(0 0 0 calc(100% - var(--sf-ba)))");
    expect(handleShift(false)).toBe("translateX(var(--sf-ba))");
    expect(handleShift(true)).toBe("translateX(calc(var(--sf-ba) * -1))");
  });
});
