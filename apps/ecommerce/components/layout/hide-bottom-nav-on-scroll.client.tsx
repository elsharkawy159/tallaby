"use client";

import { useEffect } from "react";

const ATTR = "data-bottom-nav";
const DELTA = 8;
const TOP_OFFSET = 80;

/**
 * Hides the mobile bottom navigation while scrolling down and shows it again
 * when scrolling up. It only toggles `data-bottom-nav="hidden"` on <html>;
 * the nav and any bar docked above it react through CSS.
 */
export const HideBottomNavOnScroll = () => {
  useEffect(() => {
    const root = document.documentElement;
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const diff = y - lastY;

      if (y < TOP_OFFSET) {
        root.removeAttribute(ATTR);
        lastY = y;
        return;
      }
      if (Math.abs(diff) < DELTA) return;

      const nearBottom =
        window.innerHeight + y >= document.documentElement.scrollHeight - 4;
      if (diff > 0) root.setAttribute(ATTR, "hidden");
      else if (diff < 0 || nearBottom) root.removeAttribute(ATTR);
      lastY = y;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      root.removeAttribute(ATTR);
    };
  }, []);

  return null;
};
