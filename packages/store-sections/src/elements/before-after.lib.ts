/**
 * The `beforeAfter` element's pure maths (docs/systems/plan.md §10.1): the
 * handle's position is the share of the frame, from the start side, that
 * shows the Before layer (0–100). Shared by the server markup
 * (`before-after.tsx`) and the client runtime (`render/photo-tools.client.ts`),
 * so nothing here imports React, zod or the copy table.
 */

export const BEFORE_AFTER = { min: 0, max: 100, fallback: 50, step: 5, page: 20 } as const;

/** The CSS variable holding the position (`50%`), set on the element's root. */
export const BEFORE_AFTER_VAR = "--sf-ba";

const clamp = (value: number) => Math.min(BEFORE_AFTER.max, Math.max(BEFORE_AFTER.min, value));

/** A position from untrusted props: a finite number clamped to 0–100, else 50. */
export function beforeAfterStart(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(clamp(value)) : BEFORE_AFTER.fallback;
}

/**
 * The position under a pointer: `clientX` inside a frame that starts at
 * `left` and is `width` wide. In Arabic (RTL) the start side is the right
 * edge, so the share is counted from there. One decimal.
 */
export function positionFromPointer(clientX: number, left: number, width: number, rtl: boolean): number {
  if (!(width > 0) || !Number.isFinite(clientX) || !Number.isFinite(left)) return BEFORE_AFTER.fallback;
  const share = ((clientX - left) / width) * 100;
  return Math.round(clamp(rtl ? 100 - share : share) * 10) / 10;
}

/**
 * The position after a key on the focused handle, or null for a key the
 * slider does not use. Left and right arrows follow the screen: the handle
 * moves the way the arrow points, so in RTL the left arrow raises the value.
 */
export function positionFromKey(current: number, key: string, rtl: boolean): number | null {
  const now = clamp(Number.isFinite(current) ? current : BEFORE_AFTER.fallback);
  const forward = rtl ? "ArrowLeft" : "ArrowRight";
  const back = rtl ? "ArrowRight" : "ArrowLeft";
  switch (key) {
    case forward:
    case "ArrowUp":
      return clamp(now + BEFORE_AFTER.step);
    case back:
    case "ArrowDown":
      return clamp(now - BEFORE_AFTER.step);
    case "PageUp":
      return clamp(now + BEFORE_AFTER.page);
    case "PageDown":
      return clamp(now - BEFORE_AFTER.page);
    case "Home":
      return BEFORE_AFTER.min;
    case "End":
      return BEFORE_AFTER.max;
    default:
      return null;
  }
}

/** The Before layer's clip: everything past the handle is cut, from the end side. */
export function beforeClip(rtl: boolean): string {
  const cut = `calc(100% - var(${BEFORE_AFTER_VAR}))`;
  return rtl ? `inset(0 0 0 ${cut})` : `inset(0 ${cut} 0 0)`;
}

/** The handle rail's shift: it is as wide as the frame, so its own width is the frame's. */
export function handleShift(rtl: boolean): string {
  return rtl ? `translateX(calc(var(${BEFORE_AFTER_VAR}) * -1))` : `translateX(var(${BEFORE_AFTER_VAR}))`;
}
