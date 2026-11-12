import * as React from "react";
import Image from "next/image";
import { cn } from "../lib/utils";

/**
 * Seconds a card takes to scroll its shot to the bottom on hover, by how many
 * 3:4 card heights of page lie below the first: about 2.4 s each, 3–12 s.
 */
export function templateShotSeconds(width: number, height: number): number {
  const below = height / width / (4 / 3) - 1;
  return Math.round(Math.min(12, Math.max(3, below * 2.4)) * 10) / 10;
}

/**
 * A template card's preview (owner, 2026-11-12): a full-page screenshot of
 * the template's home in a 3:4 frame, showing its top. Hovering the nearest
 * `.tpl-shot-trigger` (the card) with a fine pointer, or keyboard focus
 * inside it, scrolls the page down slowly and back on leave
 * (`@workspace/ui/globals.css`, reduced motion respected). The file is
 * already sized for cards (600 px wide), so it is served as is.
 */
export function TemplateShot({
  src,
  width,
  height,
  sizes = "(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw",
  className,
}: {
  src: string;
  width: number;
  height: number;
  sizes?: string;
  /** The frame: its aspect (3:4 by default), corners and background. */
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("tpl-shot relative block aspect-[3/4] w-full overflow-hidden bg-neutral-100", className)}
      style={{ "--tpl-shot-run": `${templateShotSeconds(width, height)}s` } as React.CSSProperties}
    >
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        sizes={sizes}
        unoptimized
        loading="lazy"
        draggable={false}
        className="tpl-shot__img pointer-events-none absolute inset-x-0 top-0 block h-auto w-full max-w-none select-none"
      />
    </span>
  );
}
