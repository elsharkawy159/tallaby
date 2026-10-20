import { describe, expect, it } from "vitest";
import type { Rect } from "../dnd/canvas-geometry.lib";
import { draggedGap, draggedRadius, gapLines, radiusDot, showsRadiusDots, styleFromComputed, type ComputedLike } from "./canvas-handles.lib";

const box = (left: number, top: number, w: number, h: number): Rect => ({ left, top, right: left + w, bottom: top + h });

describe("gap dividers", () => {
  it("splits side-by-side items (both directions) and stacked items", () => {
    expect(gapLines([box(0, 0, 100, 50), box(120, 10, 100, 50)])).toEqual([{ axis: "x", x: 110, y: 10, length: 40 }]);
    expect(gapLines([box(120, 0, 100, 50), box(0, 0, 100, 50)])).toEqual([{ axis: "x", x: 110, y: 0, length: 50 }]);
    expect(gapLines([box(0, 0, 300, 40), box(0, 56, 200, 40)])).toEqual([{ axis: "y", x: 0, y: 48, length: 200 }]);
  });

  it("skips items on different rows of a wrap", () => {
    expect(gapLines([box(200, 0, 100, 50), box(0, 70, 100, 50)])).toEqual([]);
  });

  it("drags the gap within its bounds, mirrored on right-to-left rows", () => {
    expect(draggedGap(16, 10, "x", false)).toBe(26);
    expect(draggedGap(16, 10, "x", true)).toBe(6);
    expect(draggedGap(16, 10, "y", true)).toBe(26);
    expect(draggedGap(4, -20, "y", false)).toBe(0);
    expect(draggedGap(190, 50, "x", false)).toBe(200);
  });
});

describe("radius dots", () => {
  it("sits on the corner arc, at least 8px in", () => {
    expect(radiusDot("tl", 0, 200, 100)).toEqual({ x: 8, y: 8 });
    expect(radiusDot("br", 20, 200, 100)).toEqual({ x: 180, y: 80 });
    expect(radiusDot("tr", 999, 200, 100)).toEqual({ x: 150, y: 50 });
  });

  it("shows only on bordered or rounded elements big enough", () => {
    expect(showsRadiusDots({ bordered: false, radius: 0 }, 200, 100)).toBe(false);
    expect(showsRadiusDots({ bordered: true, radius: 0 }, 200, 100)).toBe(true);
    expect(showsRadiusDots({ bordered: false, radius: 8 }, 200, 100)).toBe(true);
    expect(showsRadiusDots({ bordered: true, radius: 8 }, 200, 20)).toBe(false);
  });

  it("rounds more when dragged toward the centre, up to a pill", () => {
    expect(draggedRadius(10, "tl", 10, 10, 200, 100)).toBe(20);
    expect(draggedRadius(10, "br", 10, 10, 200, 100)).toBe(0);
    expect(draggedRadius(999, "tl", 0, 0, 200, 100)).toBe(50);
    expect(draggedRadius(40, "tr", -40, 40, 200, 100)).toBe(50);
  });
});

describe("style read back from the frame", () => {
  const base: ComputedLike = {
    display: "block",
    fontSize: "16px",
    fontWeight: "500",
    fontStyle: "normal",
    textDecorationLine: "none",
    textAlign: "left",
    flexDirection: "row",
    alignItems: "normal",
    justifyContent: "normal",
    columnGap: "normal",
    rowGap: "normal",
    gridTemplateColumns: "none",
    paddingTop: "8px",
    paddingRight: "24px",
    paddingBottom: "8px",
    paddingLeft: "12px",
    marginTop: "0px",
    marginRight: "0px",
    marginBottom: "0px",
    marginLeft: "0px",
    borderTopLeftRadius: "12px",
    objectFit: "fill",
    aspectRatio: "auto",
  };

  it("maps text values to the popover's options", () => {
    expect(styleFromComputed(base, { rootPx: 16, rtl: false })).toMatchObject({ fontSize: "md", fontWeight: "medium", textAlign: "start", paddingStart: 12, paddingEnd: 24, radius: 12 });
    expect(styleFromComputed(base, { rootPx: 16, rtl: true })).toMatchObject({ textAlign: "end", paddingStart: 24, paddingEnd: 12 });
    // Fluid or in-between sizes select nothing.
    expect(styleFromComputed({ ...base, fontSize: "52px" }, { rootPx: 16, rtl: false }).fontSize).toBeUndefined();
    expect(styleFromComputed({ ...base, fontSize: "36px", fontWeight: "700" }, { rootPx: 16, rtl: false })).toMatchObject({ fontSize: "4xl", fontWeight: "bold" });
  });

  it("reads flex and grid layout", () => {
    const flex = styleFromComputed({ ...base, display: "flex", flexDirection: "column", columnGap: "24px", rowGap: "24px", alignItems: "center", justifyContent: "space-between" }, { rootPx: 16, rtl: false });
    expect(flex).toMatchObject({ direction: "column", gap: 24, alignItems: "center", justifyContent: "between" });
    const grid = styleFromComputed({ ...base, display: "grid", gridTemplateColumns: "100px 100px 100px", columnGap: "16px" }, { rootPx: 16, rtl: false });
    expect(grid).toMatchObject({ columns: 3, gap: 16, alignItems: "stretch" });
    expect(styleFromComputed(base, { rootPx: 16, rtl: false }).gap).toBeUndefined();
  });
});
