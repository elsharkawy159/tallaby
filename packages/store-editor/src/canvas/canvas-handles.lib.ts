/**
 * Selection handles on the canvas (owner request 2026-10-19): the gap
 * dividers of a selected flex or grid element, the corner dots that set its
 * radius, and the style the popover shows when the element sets none
 * itself (read back from the frame). Pure: plain rects and computed values.
 */
import { FONT_SIZES, FONT_WEIGHTS, type StyleValues } from "@workspace/store-sections/render";
import type { Rect } from "../dnd/canvas-geometry.lib";

/** A gap divider: `axis` "x" is a vertical bar between items side by side (dragged sideways), "y" a horizontal one between stacked items. */
export type GapLine = { axis: "x" | "y"; x: number; y: number; length: number };

/** What the canvas measures for the selection; divider positions are in canvas coordinates. */
export type SelectionHandles = { gaps: GapLine[]; gap: number; radius: number; rtl: boolean; bordered: boolean };

/** Radius dots only show on elements that already have a border or rounded corners, and are big enough. */
export const showsRadiusDots = (handles: Pick<SelectionHandles, "radius" | "bordered">, width: number, height: number) =>
  (handles.bordered || handles.radius > 0) && width >= RADIUS_MIN_BOX && height >= RADIUS_MIN_BOX;

const overlap =(a0: number, a1: number, b0: number, b1: number) => Math.min(a1, b1) - Math.max(a0, b0);

/** One divider in the middle of each gap between neighbouring items (in DOM order; items on different rows of a wrap get none). */
export function gapLines(rects: Rect[]): GapLine[] {
  const lines: GapLine[] = [];
  for (let i = 1; i < rects.length; i++) {
    const a = rects[i - 1]!;
    const b = rects[i]!;
    const rowOverlap = overlap(a.top, a.bottom, b.top, b.bottom);
    const colOverlap = overlap(a.left, a.right, b.left, b.right);
    if (rowOverlap > 0 && colOverlap <= 0) {
      // Side by side, either reading direction.
      const x = b.left >= a.right ? (a.right + b.left) / 2 : (b.right + a.left) / 2;
      lines.push({ axis: "x", x, y: Math.max(a.top, b.top), length: rowOverlap });
    } else if (colOverlap > 0 && rowOverlap <= 0 && b.top >= a.bottom) {
      lines.push({ axis: "y", x: Math.max(a.left, b.left), y: (a.bottom + b.top) / 2, length: colOverlap });
    }
  }
  return lines;
}

/** The gap after dragging a divider by `delta` pixels along its axis (right/down widens; left widens on right-to-left rows). */
export function draggedGap(start: number, delta: number, axis: "x" | "y", rtl: boolean): number {
  const signed = axis === "x" && rtl ? -delta : delta;
  return Math.max(0, Math.min(200, Math.round(start + signed)));
}

export type Corner = "tl" | "tr" | "bl" | "br";
export const CORNERS: Corner[] = ["tl", "tr", "bl", "br"];
const INWARD: Record<Corner, [number, number]> = { tl: [1, 1], tr: [-1, 1], bl: [1, -1], br: [-1, -1] };

/** Smallest box that gets radius dots, and the dots' distance from the corner when the radius is small. */
export const RADIUS_MIN_BOX = 24;
const DOT_MIN_INSET = 8;

/** Largest useful radius for a box (a pill). */
export const maxRadius = (width: number, height: number) => Math.floor(Math.min(width, height) / 2);

/** Where a corner's dot sits, relative to the box: at the centre of the corner's arc, never closer than 8px to the corner. */
export function radiusDot(corner: Corner, radius: number, width: number, height: number): { x: number; y: number } {
  const inset = Math.max(DOT_MIN_INSET, Math.min(radius, maxRadius(width, height)));
  const [sx, sy] = INWARD[corner];
  return { x: sx > 0 ? inset : width - inset, y: sy > 0 ? inset : height - inset };
}

/** The radius after dragging a corner dot by (dx, dy): moving it toward the centre rounds the corner more. */
export function draggedRadius(start: number, corner: Corner, dx: number, dy: number, width: number, height: number): number {
  const [sx, sy] = INWARD[corner];
  const from = Math.min(start, maxRadius(width, height));
  return Math.max(0, Math.min(maxRadius(width, height), Math.round(from + (sx * dx + sy * dy) / 2)));
}

/** The computed values `styleFromComputed` reads (a `CSSStyleDeclaration` fits). */
export type ComputedLike = Pick<
  CSSStyleDeclaration,
  | "display"
  | "fontSize"
  | "fontWeight"
  | "fontStyle"
  | "textDecorationLine"
  | "textAlign"
  | "flexDirection"
  | "alignItems"
  | "justifyContent"
  | "columnGap"
  | "rowGap"
  | "gridTemplateColumns"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "borderTopLeftRadius"
  | "objectFit"
  | "aspectRatio"
>;

const px = (value: string) => {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
};

/** The size key within 6% of a rem size (none for fluid or in-between sizes). */
function fontSizeKey(sizePx: number, rootPx: number): StyleValues["fontSize"] {
  const rem = sizePx / rootPx;
  const entry = Object.entries(FONT_SIZES).find(([, size]) => Math.abs(rem - size) <= size * 0.06);
  return entry?.[0] as StyleValues["fontSize"];
}

const ALIGN_ITEMS: Record<string, StyleValues["alignItems"]> = {
  "flex-start": "start",
  start: "start",
  center: "center",
  "flex-end": "end",
  end: "end",
  stretch: "stretch",
  normal: "stretch",
};
const JUSTIFY: Record<string, StyleValues["justifyContent"]> = {
  "flex-start": "start",
  start: "start",
  normal: "start",
  center: "center",
  "flex-end": "end",
  end: "end",
  "space-between": "between",
  "space-around": "around",
};
const RATIOS: Record<string, StyleValues["aspectRatio"]> = { "1 / 1": "square", "4 / 3": "landscape", "16 / 9": "wide", "3 / 4": "portrait" };

/**
 * What an element looks like now, as style values: the popover shows these
 * when the element sets nothing itself (its preset or the theme decides),
 * so e.g. a medium button shows "M" selected. Values with no matching
 * option stay unset.
 */
export function styleFromComputed(cs: ComputedLike, { rootPx, rtl }: { rootPx: number; rtl: boolean }): StyleValues {
  const out: StyleValues = {};
  const size = Number.parseFloat(cs.fontSize);
  if (size > 0) out.fontSize = fontSizeKey(size, rootPx || 16);
  const weight = Number(cs.fontWeight);
  out.fontWeight = (Object.keys(FONT_WEIGHTS) as (keyof typeof FONT_WEIGHTS)[]).find((key) => FONT_WEIGHTS[key] === weight);
  if (cs.fontStyle === "italic") out.italic = true;
  if (cs.textDecorationLine?.includes("underline")) out.underline = true;
  const align = cs.textAlign;
  out.textAlign =
    align === "center" || align === "justify" || align === "start" || align === "end"
      ? align
      : align === "left"
        ? rtl ? "end" : "start"
        : align === "right"
          ? rtl ? "start" : "end"
          : undefined;

  const flex = cs.display === "flex" || cs.display === "inline-flex";
  const grid = cs.display === "grid" || cs.display === "inline-grid";
  if (flex) {
    if (cs.flexDirection === "row" || cs.flexDirection === "column") out.direction = cs.flexDirection;
    out.justifyContent = JUSTIFY[cs.justifyContent];
  }
  if (flex || grid) {
    out.gap = px(cs.columnGap) ?? px(cs.rowGap) ?? 0;
    out.alignItems = ALIGN_ITEMS[cs.alignItems];
  }
  if (grid && cs.gridTemplateColumns && cs.gridTemplateColumns !== "none") out.columns = cs.gridTemplateColumns.trim().split(/\s+/).length;

  const [start, end] = rtl ? (["Right", "Left"] as const) : (["Left", "Right"] as const);
  out.paddingTop = px(cs.paddingTop);
  out.paddingBottom = px(cs.paddingBottom);
  out.paddingStart = px(cs[`padding${start}`]);
  out.paddingEnd = px(cs[`padding${end}`]);
  out.marginTop = px(cs.marginTop);
  out.marginBottom = px(cs.marginBottom);
  out.marginStart = px(cs[`margin${start}`]);
  out.marginEnd = px(cs[`margin${end}`]);
  out.radius = px(cs.borderTopLeftRadius);
  if (cs.objectFit === "cover" || cs.objectFit === "contain") out.objectFit = cs.objectFit;
  out.aspectRatio = RATIOS[cs.aspectRatio];

  for (const key of Object.keys(out) as (keyof StyleValues)[]) if (out[key] === undefined) delete out[key];
  return out;
}
