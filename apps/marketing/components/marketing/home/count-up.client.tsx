"use client";

import * as React from "react";
import { formatStat } from "@/lib/marketing/platform-stats.lib";

const DURATION_MS = 1400;

/**
 * A stat that counts up from 0 the first time it scrolls into view. The server
 * HTML holds the final figure (readers, search engines, no JavaScript), and
 * reduced motion keeps it as is.
 */
export function CountUp({ value, locale }: { value: number; locale: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [shown, setShown] = React.useState(value);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen when the page loads: leave it, a reset would flash.
    const box = node.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / DURATION_MS);
          const eased = 1 - (1 - progress) ** 3;
          setShown(Math.round(value * eased));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        setShown(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} dir="ltr" className="font-latin tabular-nums [unicode-bidi:isolate]">
      {formatStat(shown, locale)}
    </span>
  );
}
