"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@workspace/ui/components/carousel";
import { cn } from "@workspace/ui/lib/utils";
import type { PreviewShot } from "@workspace/store-sections/template-preview";
import { TemplatePreviewCard } from "@/components/marketing/templates/template-preview-card";

/** One home template card, with every string already resolved on the server. */
export type HomeCarouselCard = {
  id: string;
  href: string;
  name: string;
  tag: string;
  linkLabel: string;
  badge: string | null;
  shot: PreviewShot | null;
  liveSrc: string;
};

const ARROW_CLASS =
  "inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-teal-800 shadow-soft transition-colors outline-none hover:bg-tint focus-visible:ring-[3px] focus-visible:ring-teal-500 focus-visible:ring-offset-2";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The home page's templates on phones (2026-11-16): a looping carousel whose active card sits in
 * the centre with its neighbours peeking on both sides, dots and arrows under it. The neighbours
 * are a little smaller and dimmer (no transition with reduced motion). RTL swipes and arrow keys
 * follow the reading direction. Grid and carousel are both in the HTML and CSS shows one per screen.
 * Browsers still fetch the hidden copy's lazy images, so `sizes` must be the grid's own string: the
 * browser then picks the very file the grid picks and serves it from cache (phones: the phone shot
 * in both). Live frames skip the hidden copy (they measure 0 px and never mount).
 */
export function HomeTemplateCarousel({
  cards,
  rtl,
  sizes,
  labels,
}: {
  cards: HomeCarouselCard[];
  rtl: boolean;
  /** The grid's `sizes`, so both copies pick the same file (see above). */
  sizes: string;
  labels: { region: string; prev: string; next: string; slides: string[] };
}) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selected, setSelected] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const go = React.useCallback(
    (index: number) => api?.scrollTo(index, prefersReducedMotion()),
    [api],
  );
  const prev = React.useCallback(() => (prefersReducedMotion() ? go((selected - 1 + cards.length) % cards.length) : api?.scrollPrev()), [api, go, selected, cards.length]);
  const next = React.useCallback(() => (prefersReducedMotion() ? go((selected + 1) % cards.length) : api?.scrollNext()), [api, go, selected, cards.length]);

  // The shared Carousel maps ArrowLeft to "previous"; in Arabic the next card is on the left.
  const onKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const forward = (event.key === "ArrowRight") !== rtl;
    if (forward) next();
    else prev();
  };

  if (!cards.length) return null;

  return (
    <Carousel
      dir={rtl ? "rtl" : "ltr"}
      setApi={setApi}
      opts={{ align: "center", loop: true, direction: rtl ? "rtl" : "ltr" }}
      aria-label={labels.region}
      onKeyDownCapture={onKeyDownCapture}
      // Bleed to the screen edges so the neighbours peek past the container's gutters.
      className="-mx-4 sm:-mx-6"
    >
      <CarouselContent className="-ms-3">
        {cards.map((card, index) => {
          const active = index === selected;
          return (
            <CarouselItem key={card.id} aria-label={labels.slides[index]} className="basis-[80%] ps-3">
              <div
                className={cn(
                  "origin-center motion-safe:transition-[transform,opacity] motion-safe:duration-300 motion-safe:ease-out",
                  active ? "scale-100 opacity-100" : "scale-[0.94] opacity-60",
                )}
              >
                <TemplatePreviewCard
                  href={card.href}
                  name={card.name}
                  tag={card.tag}
                  linkLabel={card.linkLabel}
                  badge={card.badge}
                  shot={card.shot}
                  liveSrc={card.liveSrc}
                  sizes={sizes}
                />
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      {cards.length > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3 px-4">
          <button type="button" onClick={prev} aria-label={labels.prev} className={ARROW_CLASS}>
            <ChevronLeft aria-hidden className="size-5 rtl:rotate-180" />
          </button>
          <div className="flex items-center">
            {cards.map((card, index) => {
              const active = index === selected;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => go(index)}
                  aria-label={labels.slides[index]}
                  aria-current={active ? "true" : undefined}
                  className="group/dot inline-flex size-7 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-teal-500"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "block h-2 rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-300",
                      active ? "w-5 bg-teal-700" : "w-2 bg-ink-400 group-hover/dot:bg-ink-600",
                    )}
                  />
                </button>
              );
            })}
          </div>
          <button type="button" onClick={next} aria-label={labels.next} className={ARROW_CLASS}>
            <ChevronRight aria-hidden className="size-5 rtl:rotate-180" />
          </button>
        </div>
      ) : null}
    </Carousel>
  );
}
