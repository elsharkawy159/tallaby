"use client";

import { useEffect, useRef, useState } from "react";
import { swipeAxis, swipeShouldClose } from "./swipe-to-close.lib";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Inside something that scrolls sideways (a row of offers): that row keeps the drag. */
function inSidewaysScroller(target: EventTarget | null, sheet: HTMLElement): boolean {
  for (let el = target instanceof Element ? target : null; el && el !== sheet; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth + 1) {
      const overflow = getComputedStyle(el).overflowX;
      if (overflow === "auto" || overflow === "scroll") return true;
    }
  }
  return false;
}

/**
 * Drag a side sheet back to its own edge to close it (phones; touch only):
 * it follows the finger, the backdrop fades with it, and on release it either
 * slides out and closes (`swipeShouldClose`) or springs back. Only drags
 * toward the edge move it, and mostly vertical drags stay the content's
 * scroll. Returns the ref callback for the sheet's content element.
 */
export function useSwipeToClose(side: "left" | "right", onClose: () => void) {
  const [sheet, setSheet] = useState<HTMLElement | null>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!sheet) return;
    // The way that closes: left sheets leave to the left (negative x).
    const sign = side === "left" ? -1 : 1;
    const overlay = sheet.previousElementSibling instanceof HTMLElement ? sheet.previousElementSibling : null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let startX = 0;
    let startY = 0;
    let axis: "x" | "y" | null = null;
    let tracking = false;
    let distance = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;

    const paint = (offset: number, animate: boolean) => {
      const transition = animate && !reduce ? `transform 260ms ${EASE}` : "none";
      sheet.style.transition = transition;
      sheet.style.transform = offset ? `translateX(${sign * offset}px)` : "";
      if (overlay) {
        overlay.style.transition = animate && !reduce ? `opacity 260ms ${EASE}` : "none";
        overlay.style.opacity = offset ? String(Math.max(0, 1 - offset / sheet.offsetWidth)) : "";
      }
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || inSidewaysScroller(e.target, sheet)) {
        tracking = false;
        return;
      }
      const touch = e.touches[0]!;
      tracking = true;
      axis = null;
      distance = 0;
      velocity = 0;
      startX = lastX = touch.clientX;
      startY = touch.clientY;
      lastT = e.timeStamp;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const touch = e.touches[0]!;
      const dx = touch.clientX - startX;
      if (axis === null) {
        axis = swipeAxis(dx, touch.clientY - startY);
        if (axis !== "x") {
          if (axis === "y") tracking = false;
          return;
        }
      }
      // Toward the edge only; the other way stays put.
      distance = Math.max(0, dx * sign);
      const dt = e.timeStamp - lastT;
      if (dt > 0) velocity = ((touch.clientX - lastX) * sign) / dt;
      lastX = touch.clientX;
      lastT = e.timeStamp;
      if (e.cancelable) e.preventDefault();
      paint(distance, false);
    };

    const onEnd = () => {
      if (!tracking || axis !== "x") {
        tracking = false;
        return;
      }
      tracking = false;
      const width = sheet.offsetWidth;
      if (swipeShouldClose(distance, width, velocity)) {
        paint(width, true);
        // Slid out by the finger: skip the sheet's own exit animation, which would start again from the open position.
        window.setTimeout(
          () => {
            sheet.style.animation = "none";
            close.current();
          },
          reduce ? 0 : 240,
        );
      } else {
        paint(0, true);
      }
    };

    sheet.addEventListener("touchstart", onStart, { passive: true });
    sheet.addEventListener("touchmove", onMove, { passive: false });
    sheet.addEventListener("touchend", onEnd);
    sheet.addEventListener("touchcancel", onEnd);
    return () => {
      sheet.removeEventListener("touchstart", onStart);
      sheet.removeEventListener("touchmove", onMove);
      sheet.removeEventListener("touchend", onEnd);
      sheet.removeEventListener("touchcancel", onEnd);
    };
  }, [sheet, side]);

  return setSheet;
}
