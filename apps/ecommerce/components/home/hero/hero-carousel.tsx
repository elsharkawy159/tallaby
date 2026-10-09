"use client";

import { Children, useRef, type ReactNode } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";

// Arrows stay hidden until the carousel is hovered (or an arrow gets keyboard focus).
const arrowClass =
  "hidden size-9 border-0 bg-white/90 text-primary opacity-0 shadow-sm transition-opacity hover:bg-white focus-visible:opacity-100 group-hover/hero:opacity-100 md:inline-flex";

// Slides are rendered on the server and passed in as children; this only adds
// autoplay and the arrows.
export default function HeroCarousel({
  children,
  dir,
  labels,
}: {
  children: ReactNode;
  dir: "ltr" | "rtl";
  labels: { previous: string; next: string };
}) {
  const autoplay = useRef(
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );

  return (
    <Carousel
      plugins={[autoplay.current]}
      opts={{ loop: true, direction: dir }}
      className="group/hero relative w-full"
    >
      <CarouselContent className="ms-0">
        {Children.map(children, (slide) => (
          <CarouselItem className="ps-0">{slide}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label={labels.previous} className={`${arrowClass} start-4`} />
      <CarouselNext aria-label={labels.next} className={`${arrowClass} end-4`} />
    </Carousel>
  );
}
