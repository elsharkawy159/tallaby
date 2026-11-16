"use client";

import * as React from "react";

/**
 * Touch screens only (owner, 2026-11-16): while a template card's shot is in
 * view, it scrolls smoothly to the bottom of the page and back up, on a loop
 * (`.tpl-shot[data-tour]` in `@workspace/ui/globals.css`). It sits inside the
 * `.tpl-shot` frame and marks it; hover and keyboard focus keep working on
 * screens with a fine pointer. Reduced motion: nothing moves.
 */
export function TemplateShotTour() {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const frame = ref.current?.parentElement;
    if (!frame || typeof IntersectionObserver === "undefined") return;
    if (!window.matchMedia("(hover: none)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) frame.setAttribute("data-tour", "");
        else frame.removeAttribute("data-tour");
      },
      { threshold: 0.6 },
    );
    observer.observe(frame);
    return () => {
      observer.disconnect();
      frame.removeAttribute("data-tour");
    };
  }, []);
  return <span ref={ref} hidden />;
}
