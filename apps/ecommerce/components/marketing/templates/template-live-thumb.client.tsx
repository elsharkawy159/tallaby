"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

/** The frame a live thumbnail is drawn at: a desktop window, scaled to the card. */
const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 960;

/**
 * A template's real home page as a card thumbnail, for templates without a
 * `thumbnail_url`: the preview frame (/template-preview) drawn at desktop
 * width and scaled down. Loads when the card nears the viewport; never
 * focusable or clickable (the card is the link).
 */
export function TemplateLiveThumb({ src, className }: { src: string; className?: string }) {
  const box = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState<number | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / FRAME_WIDTH);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className={cn("relative aspect-[4/3] w-full overflow-hidden bg-neutral-100", className)} aria-hidden>
      {scale ? (
        <iframe
          src={src}
          title=""
          loading="lazy"
          tabIndex={-1}
          scrolling="no"
          onLoad={() => setLoaded(true)}
          className={cn(
            "pointer-events-none absolute start-0 top-0 origin-top-left border-0 bg-white transition-opacity duration-300 rtl:origin-top-right",
            loaded ? "opacity-100" : "opacity-0",
          )}
          style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, transform: `scale(${scale})` }}
        />
      ) : null}
      {loaded ? null : <div className="absolute inset-0 animate-pulse bg-neutral-100" />}
    </div>
  );
}
