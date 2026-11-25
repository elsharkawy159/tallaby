"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@workspace/ui/lib/utils";

/** The frame a live thumbnail is drawn at: a desktop window, scaled to the card. */
const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 960;

/**
 * A template's real home page as a card thumbnail, for templates without a
 * `thumbnail_url`: the preview frame (/template-preview) drawn at desktop
 * width and scaled down. Loads when the card nears the viewport; never
 * focusable or clickable (the card is the link). Until the frame loads, a
 * plain wireframe of a store page stands in (home-template-poster, 2026-11-16).
 */
export function TemplateLiveThumb({
  src,
  className,
  frameHeight = FRAME_HEIGHT,
}: {
  src: string;
  className?: string;
  /** A taller frame for a taller box (its aspect class in `className`), so the page fills it. */
  frameHeight?: number;
}) {
  const box = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState<number | null>(null);
  const [boxHeight, setBoxHeight] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      setScale(el.clientWidth / FRAME_WIDTH);
      setBoxHeight(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className={cn("relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-surface-muted", className)} aria-hidden>
      {scale ? (
        <iframe
          src={src}
          title=""
          loading="lazy"
          tabIndex={-1}
          scrolling="no"
          onLoad={() => setLoaded(true)}
          className={cn(
            "pointer-events-none absolute start-0 top-0 origin-top-left border-0 bg-surface transition-opacity duration-300 rtl:origin-top-right",
            loaded ? "opacity-100" : "opacity-0",
          )}
          // A box taller than its aspect class (a phone card at 70svh) gets a taller frame, so the page still fills it.
          style={{ width: FRAME_WIDTH, height: Math.max(frameHeight, Math.ceil(boxHeight / scale)), transform: `scale(${scale})` }}
        />
      ) : null}
      {loaded ? null : (
        <Image src="/marketing/home/home-template-poster.webp" alt="" width={600} height={800} unoptimized className="absolute inset-0 size-full object-cover object-top" />
      )}
    </div>
  );
}
