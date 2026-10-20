import { describe, expect, it } from "vitest";
import { insertionIndex, insertionLine, type Rect } from "./canvas-geometry.lib";

const box = (left: number, top: number, w: number, h: number): Rect => ({ left, top, right: left + w, bottom: top + h });

describe("canvas insertion geometry", () => {
  const stack = [box(0, 0, 300, 100), box(0, 120, 300, 100)];
  const row = [box(0, 0, 100, 100), box(120, 0, 100, 100), box(240, 0, 100, 100)];

  it("splits stacked boxes at their middle", () => {
    expect(insertionIndex(stack, { x: 10, y: 20 }, false)).toBe(0);
    expect(insertionIndex(stack, { x: 10, y: 80 }, false)).toBe(1);
    expect(insertionIndex(stack, { x: 10, y: 110 }, false)).toBe(1);
    expect(insertionIndex(stack, { x: 10, y: 300 }, false)).toBe(2);
    expect(insertionIndex([], { x: 0, y: 0 }, false)).toBe(0);
  });

  it("uses each box's centre in a row, mirrored right to left", () => {
    expect(insertionIndex(row, { x: 140, y: 50 }, false)).toBe(1);
    expect(insertionIndex(row, { x: 200, y: 50 }, false)).toBe(2);
    expect(insertionIndex(row, { x: 400, y: 50 }, false)).toBe(3);
    // RTL: the first box is on the right; left of a centre means "after".
    const rtl = [box(240, 0, 100, 100), box(120, 0, 100, 100), box(0, 0, 100, 100)];
    expect(insertionIndex(rtl, { x: 300, y: 50 }, true)).toBe(0);
    expect(insertionIndex(rtl, { x: 260, y: 50 }, true)).toBe(1);
  });

  it("draws horizontal lines in stacks and vertical lines in rows", () => {
    expect(insertionLine(stack, 1, box(0, 0, 300, 220), false)).toEqual({ x: 0, y: 110, length: 300, orientation: "horizontal" });
    expect(insertionLine(stack, 2, box(0, 0, 300, 220), false)).toMatchObject({ y: 220, orientation: "horizontal" });
    expect(insertionLine(row, 1, box(0, 0, 340, 100), false)).toEqual({ x: 120, y: 0, length: 100, orientation: "vertical" });
    expect(insertionLine(row, 3, box(0, 0, 340, 100), false)).toMatchObject({ x: 340, orientation: "vertical" });
    expect(insertionLine([], 0, box(0, 0, 200, 100), false)).toEqual({ x: 0, y: 50, length: 200, orientation: "horizontal" });
  });
});
