/**
 * The `hotspot` element's pure logic (docs/systems/plan.md §10.1): where the
 * dot and its popover sit, and which popover of a photo is open. Shared by
 * the server markup (`hotspot.tsx`) and the client runtime
 * (`render/photo-tools.client.ts`), so nothing here imports React, zod or the
 * copy table.
 */

export const HOTSPOT_KINDS = ["product", "text"] as const;
export type HotspotKind = (typeof HOTSPOT_KINDS)[number];

/** The kind of untrusted props; anything unknown is a text note. */
export function hotspotKind(value: unknown): HotspotKind {
  return HOTSPOT_KINDS.find((kind) => kind === value) ?? "text";
}

export type HotspotPoint = { x: number; y: number };

const percent = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? Math.round(Math.min(100, Math.max(0, value)) * 10) / 10 : 50);

/**
 * The dot's place on its photo, in percent from the photo's left and top
 * edges (a photo does not mirror in Arabic, so neither does the dot).
 * Anything that is not a number is the middle.
 */
export function hotspotPoint(x: unknown, y: unknown): HotspotPoint {
  return { x: percent(x), y: percent(y) };
}

/** "The store's Nth newest product" (1–8) of a product dot with no product picked, or null. */
export function hotspotProductIndex(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 8 ? value : null;
}

/** Popover width: 240px, or the photo's width less an 8px margin each side on a narrow photo. */
export const HOTSPOT_WIDTH = "min(15rem, calc(100% - 16px))";
/** Distance from the dot's centre to the popover (the dot is 28px wide). */
const GAP = 14;
/** Margin kept between the popover and the photo's edges. */
const EDGE = 8;

/**
 * The popover's box inside the photo, as CSS the browser solves without
 * script: centred on the dot, clamped to the photo's left and right edges,
 * below the dot in the top half of the photo and above it in the bottom half,
 * never taller than the room on that side (its card then scrolls).
 */
export function hotspotPopoverStyle(point: HotspotPoint): Record<string, string> {
  const below = point.y <= 50;
  const room = below ? 100 - point.y : point.y;
  return {
    "--sf-hs-w": HOTSPOT_WIDTH,
    width: "var(--sf-hs-w)",
    left: `clamp(${EDGE}px, calc(${point.x}% - var(--sf-hs-w) / 2), calc(100% - var(--sf-hs-w) - ${EDGE}px))`,
    ...(below ? { top: `calc(${point.y}% + ${GAP}px)` } : { bottom: `calc(${100 - point.y}% + ${GAP}px)` }),
    maxHeight: `calc(${room}% - ${GAP + EDGE}px)`,
  };
}

/** The open popover of one photo: which dot, and whether a tap or click pinned it open. */
export type HotspotState = { id: string; pinned: boolean } | null;

export type HotspotEvent =
  /** A tap, click, Enter or Space on a dot. */
  | { type: "toggle"; id: string }
  /** The mouse moved onto a dot or its popover, or off both. */
  | { type: "enter" | "leave"; id: string }
  /** Keyboard focus moved into a dot or its popover, or out to another element. */
  | { type: "focus" | "blur"; id: string }
  /** Escape, or a tap or click outside the open dot and its popover. */
  | { type: "escape" | "outside" };

/**
 * One popover open at a time per photo. A tap pins it (a second tap closes
 * it); hover and focus open it until the pointer or focus leaves, and never
 * replace a pinned one.
 */
export function hotspotReduce(state: HotspotState, event: HotspotEvent): HotspotState {
  switch (event.type) {
    case "toggle":
      return state?.id === event.id && state.pinned ? null : { id: event.id, pinned: true };
    case "enter":
    case "focus":
      if (state?.pinned) return state;
      return state?.id === event.id ? state : { id: event.id, pinned: false };
    case "leave":
      return state?.id === event.id && !state.pinned ? null : state;
    case "blur":
      return state?.id === event.id ? null : state;
    case "escape":
    case "outside":
      return null;
  }
}
