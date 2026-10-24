/**
 * Carousel element (server-renderable, no hooks): a track of full-width
 * slides with scroll snapping, so without script a visitor swipes or scrolls
 * through them. `CarouselRuntime` (`render/carousel-runtime.client.tsx`,
 * mounted once by the host) adds autoplay, the dots, pause and arrows; until
 * it runs the controls stay hidden. On the canvas there is no runtime: the
 * track scrolls, so every slide can be reached and edited.
 */
import type { ReactNode } from "react";
import { ArrowLeft, Pause, Play } from "lucide-react";
import type { ComponentNode } from "../config/schema";
import { sectionText } from "../core/copy";
import type { RenderContext } from "../core/types";
import { cn } from "../sections/_primitives";

type Attrs = Record<string, string>;

export const CAROUSEL_INTERVAL = { min: 3, max: 15, fallback: 5 } as const;

/** Seconds per slide, clamped (a bad value never makes it race or stall). */
export function carouselInterval(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : CAROUSEL_INTERVAL.fallback;
  return Math.min(CAROUSEL_INTERVAL.max, Math.max(CAROUSEL_INTERVAL.min, n));
}

/**
 * The section's Width (Style tab, `data-shell-width` on the section): full
 * screen by default and with Full; Contained lines it up with the page
 * container and Wide with the wider one (the shell sets `--sf-max-width` to
 * 1440px), rounded like the theme's cards.
 */
const boxedClass = cn(
  "in-data-[shell-width=contained]:mx-auto in-data-[shell-width=contained]:max-w-(--sf-max-width,1200px) in-data-[shell-width=contained]:px-4 md:in-data-[shell-width=contained]:px-8",
  "in-data-[shell-width=wide]:mx-auto in-data-[shell-width=wide]:max-w-(--sf-max-width,1200px) in-data-[shell-width=wide]:px-4 md:in-data-[shell-width=wide]:px-8",
  "in-data-[shell-width=contained]:[&>[data-carousel-track]]:rounded-(--sf-radius,12px) in-data-[shell-width=wide]:[&>[data-carousel-track]]:rounded-(--sf-radius,12px)",
);

// The design's bar: white on a dark glass, so it reads on photos and on light slides.
const controlClass =
  "pointer-events-auto inline-grid size-11 place-items-center rounded-full border border-white/50 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function CarouselElement({
  attrs,
  node,
  props,
  ctx,
  children,
}: {
  attrs: Attrs;
  node: ComponentNode;
  props: Record<string, unknown>;
  ctx: RenderContext;
  children: ReactNode;
}) {
  const count = node.children.filter((child) => child.type === "slide").length;
  const live = ctx.mode !== "edit";
  const autoplay = props.autoplay !== false;
  return (
    <div
      {...attrs}
      {...(live && { "data-carousel": "", "data-interval": String(carouselInterval(props.interval) * 1000), "data-autoplay": autoplay ? "1" : "0" })}
      role="region"
      aria-roledescription="carousel"
      aria-label={sectionText("carousel", ctx.locale)}
      className={cn("group/carousel relative min-w-0 overflow-hidden", boxedClass)}
    >
      <div data-carousel-track className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      {live && count > 1 && (
        <div
          data-carousel-bar
          className="pointer-events-none absolute inset-x-0 bottom-5 mx-auto hidden w-full max-w-(--sf-max-width,1280px) items-center gap-2 px-5 group-data-[carousel-ready]/carousel:flex md:bottom-7 md:px-16"
        >
          <div className="pointer-events-auto me-auto flex items-center gap-1.5 rounded-full bg-black/25 px-2 backdrop-blur-sm">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                data-carousel-dot={i}
                aria-current={i === 0 ? "true" : "false"}
                aria-label={sectionText("carouselSlide", ctx.locale, { n: i + 1 })}
                className="grid h-7 w-7 cursor-pointer place-items-center transition-[width] duration-300 aria-[current=true]:w-13 focus-visible:outline-2 focus-visible:outline-white motion-reduce:transition-none"
              >
                <i className="relative block h-0.75 w-full overflow-hidden rounded-full bg-white/40">
                  <b className="absolute inset-y-0 start-0 block w-[calc(var(--p,0)*100%)] bg-white" />
                </i>
              </button>
            ))}
          </div>
          <button type="button" data-carousel-play aria-pressed="false" aria-label={sectionText("carouselPause", ctx.locale)} className={cn(controlClass, "group/play")}>
            <Pause className="size-4 group-aria-pressed/play:hidden" aria-hidden />
            <Play className="hidden size-4 group-aria-pressed/play:block" aria-hidden />
          </button>
          <button type="button" data-carousel-go="-1" aria-label={sectionText("carouselPrevious", ctx.locale)} className={cn(controlClass, "max-sm:hidden")}>
            {/* Back points to the start side: right in Arabic, left in English. */}
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
          </button>
          <button type="button" data-carousel-go="1" aria-label={sectionText("carouselNext", ctx.locale)} className={cn(controlClass, "max-sm:hidden")}>
            <ArrowLeft className="size-4 ltr:-scale-x-100" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

/** One slide; the runtime labels it "n / total" and makes the hidden ones inert. */
export function SlideElement({ attrs, children }: { attrs: Attrs; children: ReactNode }) {
  return (
    <div
      {...attrs}
      data-carousel-slide
      aria-roledescription="slide"
      className="relative flex w-full min-w-0 shrink-0 snap-start snap-always flex-col"
    >
      {children}
    </div>
  );
}
