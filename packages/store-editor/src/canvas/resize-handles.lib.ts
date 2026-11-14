/**
 * On-canvas resize handles (seller feedback 2026-11-14: "resizing images is
 * hard"): the math behind dragging a corner or edge of a selected image or
 * the store logo. Pure: plain numbers in canvas pixels.
 *
 * The box keeps its aspect ratio: an image's height follows its width (or its
 * fixed ratio), and the logo is drawn by its height with an automatic width,
 * so one size drives the other. A handle's side is on the screen (`e` is the
 * right edge in both reading directions), so pointer drags need no RTL flip;
 * the keyboard arrows do (`keyDelta`).
 */

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
export const RESIZE_HANDLES: readonly ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

/** Which way a handle grows the box on screen: x +1 right, -1 left; y +1 down, -1 up. */
const SIDES: Record<ResizeHandle, readonly [number, number]> = {
  n: [0, -1],
  s: [0, 1],
  e: [1, 0],
  w: [-1, 0],
  ne: [1, -1],
  nw: [-1, -1],
  se: [1, 1],
  sw: [-1, 1],
};

/** Where a handle sits on the box, as fractions of its width and height (0 = left/top). */
export function handlePosition(handle: ResizeHandle): { x: number; y: number } {
  const [sx, sy] = SIDES[handle];
  return { x: (sx + 1) / 2, y: (sy + 1) / 2 };
}

/** The cursor of a handle. */
export function handleCursor(handle: ResizeHandle): string {
  if (handle === "n" || handle === "s") return "ns-resize";
  if (handle === "e" || handle === "w") return "ew-resize";
  return handle === "ne" || handle === "sw" ? "nesw-resize" : "nwse-resize";
}

export type Size = { width: number; height: number };

export type ResizeLimits = {
  /** Which size is written: an image's width, or the logo's height. The other follows the ratio. */
  axis: "width" | "height";
  /** Bounds of the written size, in pixels. */
  min: number;
  max: number;
  /** The written size snaps to multiples of this (1 = no snapping). */
  step: number;
  /** Largest width the box may take (its parent's content width); applied before `max`. */
  maxWidth?: number;
};

/** `value` rounded to the nearest multiple of `step` (whole pixels for a step of 1 or less). */
export function snap(value: number, step: number): number {
  return step > 1 ? Math.round(value / step) * step : Math.round(value);
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Width over height; 1 for a box with no height yet. */
export const ratioOf = (size: Size) => (size.height > 0 && size.width > 0 ? size.width / size.height : 1);

/** The bounds of the written size once the parent's width is taken into account. */
function bounds(start: Size, limits: ResizeLimits): { min: number; max: number } {
  const ratio = ratioOf(start);
  const widthCap = limits.maxWidth !== undefined && limits.maxWidth > 0 ? limits.maxWidth : Infinity;
  const cap = limits.axis === "width" ? widthCap : widthCap / ratio;
  const max = Math.max(limits.min, Math.min(limits.max, cap));
  return { min: limits.min, max };
}

/** The box at a written size, its other side following the ratio. */
function sized(value: number, start: Size, axis: ResizeLimits["axis"]): Size {
  const ratio = ratioOf(start);
  return axis === "width"
    ? { width: value, height: Math.round(value / ratio) }
    : { width: Math.round(value * ratio), height: value };
}

/**
 * The box after dragging `handle` by (dx, dy) screen pixels from `start`.
 * An edge follows its own axis; a corner follows whichever of the two moves
 * the box more. The written size is snapped, then clamped (min, max, and the
 * parent's width), and the ratio is kept.
 */
export function draggedSize(start: Size, handle: ResizeHandle, dx: number, dy: number, limits: ResizeLimits): Size {
  const [sx, sy] = SIDES[handle];
  const ratio = ratioOf(start);
  // Both pulls as a change of width.
  const fromX = sx * dx;
  const fromY = sy * dy * ratio;
  const widthDelta = sx === 0 ? fromY : sy === 0 ? fromX : Math.abs(fromX) >= Math.abs(fromY) ? fromX : fromY;
  const from = limits.axis === "width" ? start.width : start.height;
  const delta = limits.axis === "width" ? widthDelta : widthDelta / ratio;
  const { min, max } = bounds(start, limits);
  return sized(clamp(snap(from + delta, limits.step), min, max), start, limits.axis);
}

/**
 * How much an arrow key changes the size on a focused handle: Up and the
 * reading direction's "forward" arrow grow it (Right in LTR, Left in RTL),
 * Down and "back" shrink it; Shift moves ten times as far. Null for other keys.
 */
export function keyDelta(key: string, { rtl, shift }: { rtl: boolean; shift: boolean }): number | null {
  const unit = shift ? 10 : 1;
  switch (key) {
    case "ArrowUp":
      return unit;
    case "ArrowDown":
      return -unit;
    case "ArrowRight":
      return rtl ? -unit : unit;
    case "ArrowLeft":
      return rtl ? unit : -unit;
    default:
      return null;
  }
}

/** The box after a keyboard step of `delta` pixels on the written size (clamped like a drag, never snapped). */
export function steppedSize(start: Size, delta: number, limits: ResizeLimits): Size {
  const from = limits.axis === "width" ? start.width : start.height;
  const { min, max } = bounds(start, limits);
  return sized(clamp(Math.round(from + delta), min, max), start, limits.axis);
}
