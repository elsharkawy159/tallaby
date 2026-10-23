/**
 * The real pointer during a drag, read from the move events themselves.
 *
 * dnd-kit's `event.delta` is not the pointer: it adds the scroll change of
 * the scrollable ancestors of the node under the drag, measured against the
 * ancestors at drag start. Dragging from a scrolled panel onto the canvas
 * swaps those ancestors, so `activator + delta` lands above the pointer by
 * the panel's scroll (drops went higher than the mouse). The canvas forwards
 * its frame's mouse moves to the editor document in editor coordinates, so
 * one window listener sees every move.
 */
import type { Point } from "./canvas-geometry.lib";

function pointOf(event: Event): Point | null {
  const touch = (event as TouchEvent).touches?.[0];
  if (touch) return { x: touch.clientX, y: touch.clientY };
  const mouse = event as MouseEvent;
  return typeof mouse.clientX === "number" ? { x: mouse.clientX, y: mouse.clientY } : null;
}

/** Calls `onMove` with each mouse or touch position; returns the function that stops it. */
export function trackPointer(target: EventTarget, onMove: (point: Point) => void): () => void {
  const listener = (event: Event) => {
    const point = pointOf(event);
    if (point) onMove(point);
  };
  const options = { capture: true, passive: true } as const;
  target.addEventListener("mousemove", listener, options);
  target.addEventListener("touchmove", listener, options);
  return () => {
    target.removeEventListener("mousemove", listener, options);
    target.removeEventListener("touchmove", listener, options);
  };
}
