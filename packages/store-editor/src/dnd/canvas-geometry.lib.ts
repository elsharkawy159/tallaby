/**
 * Canvas drop geometry (P4B-12): where among laid-out boxes a drop lands and
 * where its insertion line goes. Pure (plain rects, no DOM) so it works for
 * stacks, rows, wrapped grids and right-to-left pages alike.
 */

export type Rect = { top: number; bottom: number; left: number; right: number };
export type Point = { x: number; y: number };
/** An insertion marker: a horizontal line from (x, y) to the end, or a vertical one going down. */
export type Line = { x: number; y: number; length: number; orientation: "horizontal" | "vertical" };

const height = (r: Rect) => r.bottom - r.top;

/** Two boxes share a row when they overlap by at least half the shorter one's height. */
function sameRow(a: Rect, b: Rect): boolean {
  const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return overlap > 0.5 * Math.min(height(a), height(b));
}

/** Whether the box at `index` is alone in its row (a stack item rather than a row item). */
function aloneInRow(rects: readonly Rect[], index: number): boolean {
  const rect = rects[index]!;
  return !rects.some((other, i) => i !== index && sameRow(other, rect));
}

/**
 * The index to insert before, in reading order: above a row goes before it;
 * inside a row it depends on the side of each box's centre (mirrored in
 * RTL); a box alone in its row splits at its vertical middle.
 */
export function insertionIndex(rects: readonly Rect[], point: Point, rtl: boolean): number {
  for (const [i, r] of rects.entries()) {
    if (point.y < r.top) return i;
    if (point.y > r.bottom) continue;
    if (aloneInRow(rects, i)) return point.y < (r.top + r.bottom) / 2 ? i : i + 1;
    const centre = (r.left + r.right) / 2;
    if (rtl ? point.x > centre : point.x < centre) return i;
  }
  return rects.length;
}

/** The marker for inserting at `index` among `rects` inside `container`. */
export function insertionLine(rects: readonly Rect[], index: number, container: Rect, rtl: boolean): Line {
  if (!rects.length) {
    return { x: container.left, y: (container.top + container.bottom) / 2, length: container.right - container.left, orientation: "horizontal" };
  }
  const atEnd = index >= rects.length;
  const i = atEnd ? rects.length - 1 : index;
  const r = rects[i]!;
  if (aloneInRow(rects, i)) {
    const previous = !atEnd && i > 0 ? rects[i - 1] : undefined;
    // Midway between two stacked boxes, so the line sits in the gap.
    const y = atEnd ? r.bottom : previous && previous.bottom <= r.top ? (previous.bottom + r.top) / 2 : r.top;
    return { x: r.left, y, length: r.right - r.left, orientation: "horizontal" };
  }
  // In a row: the start edge of the box (its end edge after the last one).
  const startEdge = rtl ? r.right : r.left;
  const endEdge = rtl ? r.left : r.right;
  return { x: atEnd ? endEdge : startEdge, y: r.top, length: height(r), orientation: "vertical" };
}

/** Distance from a point to a box's nearest edge (negative when outside). */
export function edgeDistance(rect: Rect, point: Point): number {
  return Math.min(point.x - rect.left, rect.right - point.x, point.y - rect.top, rect.bottom - point.y);
}
