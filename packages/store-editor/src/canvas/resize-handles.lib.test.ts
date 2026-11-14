import { describe, expect, it } from "vitest";
import { draggedSize, handleCursor, handlePosition, keyDelta, ratioOf, snap, steppedSize, type ResizeLimits } from "./resize-handles.lib";

const image: ResizeLimits = { axis: "width", min: 24, max: 4000, step: 4 };
const logo: ResizeLimits = { axis: "height", min: 20, max: 120, step: 2 };

describe("snap", () => {
  it("rounds to the step, or to whole pixels", () => {
    expect(snap(201, 4)).toBe(200);
    expect(snap(203, 4)).toBe(204);
    expect(snap(10.6, 1)).toBe(11);
  });
});

describe("draggedSize", () => {
  const start = { width: 400, height: 200 };

  it("grows from the right edge to the right, and shrinks from the left edge to the right", () => {
    expect(draggedSize(start, "e", 40, 0, image)).toEqual({ width: 440, height: 220 });
    expect(draggedSize(start, "w", 40, 0, image)).toEqual({ width: 360, height: 180 });
  });

  it("keeps the aspect ratio from a top or bottom edge", () => {
    // 20px down on a 2:1 box = 40px wider.
    expect(draggedSize(start, "s", 0, 20, image)).toEqual({ width: 440, height: 220 });
    expect(draggedSize(start, "n", 0, 20, image)).toEqual({ width: 360, height: 180 });
  });

  it("follows the larger pull on a corner", () => {
    expect(draggedSize(start, "se", 10, 30, image)).toEqual({ width: 460, height: 230 });
    expect(draggedSize(start, "se", 80, 10, image)).toEqual({ width: 480, height: 240 });
    expect(ratioOf(draggedSize(start, "nw", -50, -5, image))).toBeCloseTo(2);
  });

  it("grows from the left edge dragged left (the start edge in RTL): the handle's side is physical", () => {
    expect(draggedSize(start, "w", -40, 0, image).width).toBe(440);
    expect(draggedSize(start, "sw", -40, 0, image).width).toBe(440);
  });

  it("snaps to the step", () => {
    expect(draggedSize(start, "e", 7, 0, image).width).toBe(408);
    expect(draggedSize(start, "e", 7, 0, { ...image, step: 1 }).width).toBe(407);
  });

  it("clamps to the minimum and to the parent's width", () => {
    expect(draggedSize(start, "w", 1000, 0, image).width).toBe(24);
    expect(draggedSize(start, "e", 1000, 0, { ...image, maxWidth: 600 })).toEqual({ width: 600, height: 300 });
    // A parent narrower than the minimum still leaves the minimum.
    expect(draggedSize(start, "e", 50, 0, { ...image, maxWidth: 10 }).width).toBe(24);
  });

  it("drives the logo by its height, capped by its range and by the width it may take", () => {
    const mark = { width: 160, height: 40 };
    expect(draggedSize(mark, "s", 0, 10, logo)).toEqual({ width: 200, height: 50 });
    expect(draggedSize(mark, "e", 40, 0, logo)).toEqual({ width: 200, height: 50 });
    expect(draggedSize(mark, "s", 0, 500, logo).height).toBe(120);
    expect(draggedSize(mark, "n", 0, 500, logo).height).toBe(20);
    // 4:1 logo in a 300px-wide slot: at most 75px tall.
    expect(draggedSize(mark, "s", 0, 500, { ...logo, maxWidth: 300 })).toEqual({ width: 300, height: 75 });
  });

  it("treats a box with no height as square", () => {
    expect(draggedSize({ width: 100, height: 0 }, "s", 0, 20, image).width).toBe(120);
  });
});

describe("keyDelta", () => {
  it("grows with Up and the forward arrow, mirrored right-to-left", () => {
    expect(keyDelta("ArrowUp", { rtl: false, shift: false })).toBe(1);
    expect(keyDelta("ArrowDown", { rtl: true, shift: false })).toBe(-1);
    expect(keyDelta("ArrowRight", { rtl: false, shift: false })).toBe(1);
    expect(keyDelta("ArrowRight", { rtl: true, shift: false })).toBe(-1);
    expect(keyDelta("ArrowLeft", { rtl: true, shift: true })).toBe(10);
    expect(keyDelta("Enter", { rtl: false, shift: false })).toBeNull();
  });
});

describe("steppedSize", () => {
  it("moves by whole pixels without snapping, clamped", () => {
    expect(steppedSize({ width: 401, height: 200 }, 1, image).width).toBe(402);
    expect(steppedSize({ width: 30, height: 30 }, -10, image).width).toBe(24);
    expect(steppedSize({ width: 160, height: 40 }, 10, logo)).toEqual({ width: 200, height: 50 });
  });
});

describe("handle placement", () => {
  it("puts handles on the box's corners and edge midpoints", () => {
    expect(handlePosition("nw")).toEqual({ x: 0, y: 0 });
    expect(handlePosition("e")).toEqual({ x: 1, y: 0.5 });
    expect(handlePosition("s")).toEqual({ x: 0.5, y: 1 });
    expect(handleCursor("ne")).toBe("nesw-resize");
    expect(handleCursor("se")).toBe("nwse-resize");
    expect(handleCursor("n")).toBe("ns-resize");
  });
});
