/**
 * When a side sheet dragged toward its own edge should close on release
 * (the store's cart sheet, `useSwipeToClose`): pulled past 30% of its width,
 * or flicked fast (≥ 0.45 px/ms) once it has moved a little. Anything less
 * springs back.
 */
export const SWIPE_CLOSE_FRACTION = 0.3;
export const SWIPE_CLOSE_VELOCITY = 0.45;
const SWIPE_FLICK_MIN = 24;

export function swipeShouldClose(distance: number, width: number, velocity: number): boolean {
  if (distance <= 0 || width <= 0) return false;
  return distance >= width * SWIPE_CLOSE_FRACTION || (velocity >= SWIPE_CLOSE_VELOCITY && distance >= SWIPE_FLICK_MIN);
}

/** Which way a drag goes once it has moved 8px: mostly sideways is the sheet's, mostly up or down is the cart's own scroll. */
export function swipeAxis(dx: number, dy: number): "x" | "y" | null {
  if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return null;
  return Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
}
