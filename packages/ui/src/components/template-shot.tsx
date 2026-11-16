import * as React from "react";
import { getImageProps } from "next/image";
import { cn } from "../lib/utils";
import { TemplateShotTour } from "./template-shot-tour";

/**
 * Seconds a card takes to scroll its shot to the bottom on hover, by how many
 * 3:4 card heights of page lie below the first: about 2.4 s each, 3–12 s.
 */
export function templateShotSeconds(width: number, height: number): number {
  const below = height / width / (4 / 3) - 1;
  return Math.round(Math.min(12, Math.max(3, below * 2.4)) * 10) / 10;
}

/**
 * Seconds the touch-screen tour (TemplateShotTour) takes one way, from the shot
 * phones show: slower than the hover scroll (owner, 2026-11-16: "slower and
 * smooth"), about 4.5 s per 3:4 card height of page below the first, 8–30 s.
 */
export function templateShotTourSeconds(width: number, height: number): number {
  const below = height / width / (4 / 3) - 1;
  return Math.round(Math.min(30, Math.max(8, below * 4.5)) * 10) / 10;
}

/**
 * A template card's preview (owner, 2026-11-12): a full-page screenshot of
 * the template's home in a 3:4 frame, showing its top. Hovering the nearest
 * `.tpl-shot-trigger` (the card) with a fine pointer, or keyboard focus
 * inside it, scrolls the page down slowly and back on leave
 * (`@workspace/ui/globals.css`, reduced motion respected). The file is
 * already sized for cards (600 px wide), so it is served as is.
 *
 * `mobile` (owner, 2026-11-15) is the same page shot on a phone: a
 * `<picture>` source picks it on screens matching `mobileMedia`, in CSS, so
 * there is no script, no flash and no second download; each source carries
 * its own size, so the image never shifts the layout.
 *
 * On touch screens (owner, 2026-11-16) the shot tours itself while it is in
 * view: smoothly to the bottom, then back up, on a loop (TemplateShotTour).
 *
 * `large` (2026-11-16) is the same desktop shot stored 1200 px wide: with it
 * the desktop image gets a `600w, 1200w` srcset, so wide cards and 2x screens
 * pick the sharp file and the rest keep the light one. `loading` and
 * `fetchPriority` let a page lead with its shot (tallaby.com's template page).
 */
export function TemplateShot({
  src,
  width,
  height,
  mobile,
  large,
  mobileMedia = "(max-width: 640px)",
  sizes = "(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw",
  loading = "lazy",
  fetchPriority,
  className,
}: {
  src: string;
  width: number;
  height: number;
  /** The phone shot of the same page; unset: the desktop shot everywhere. */
  mobile?: { src: string; width: number; height: number } | null;
  /** The same desktop shot stored wider (1200 px); unset: the `src` file only. */
  large?: { src: string; width: number; height: number } | null;
  /** The screens that get `mobile` (`TEMPLATE_PREVIEW_MOBILE_MEDIA`). */
  mobileMedia?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  /** The frame: its aspect (3:4 by default), corners and background. */
  className?: string;
}) {
  const { props: img } = getImageProps({ src, alt: "", width, height, sizes, unoptimized: true, loading });
  // Unoptimized images get no srcset from Next: list the two stored widths by hand.
  const srcSet = large ? `${src} ${width}w, ${large.src} ${large.width}w` : undefined;
  return (
    <span
      aria-hidden
      className={cn("tpl-shot relative block aspect-[3/4] w-full overflow-hidden bg-neutral-100", className)}
      style={
        {
          "--tpl-shot-run": `${templateShotSeconds(width, height)}s`,
          // Phones show the phone shot when there is one: time the tour on its own length.
          "--tpl-shot-tour-run": `${templateShotTourSeconds(mobile?.width ?? width, mobile?.height ?? height)}s`,
        } as React.CSSProperties
      }
    >
      <picture>
        {mobile && <source media={mobileMedia} srcSet={mobile.src} width={mobile.width} height={mobile.height} />}
        <img
          {...img}
          srcSet={srcSet}
          sizes={srcSet ? sizes : img.sizes}
          fetchPriority={fetchPriority}
          alt=""
          draggable={false}
          className="tpl-shot__img pointer-events-none absolute inset-x-0 top-0 block h-auto w-full max-w-none select-none"
        />
      </picture>
      <TemplateShotTour />
    </span>
  );
}
