"use client";

import { Children, type ReactNode } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";
import s from "../storefront.module.css";

// Arrows only on pointer-hover screens, shown while the row is hovered;
// touch users swipe.
const arrowClass = `${s.circleArrow} hidden md:inline-flex`;

/** Slides the server-rendered category circles; drag, swipe or use the arrows. */
export function CategoryCarousel({
  children,
  dir,
  labels,
}: {
  children: ReactNode;
  dir: "ltr" | "rtl";
  labels: { previous: string; next: string };
}) {
  return (
    <Carousel
      opts={{ align: "start", dragFree: true, direction: dir }}
      className={s.circlesCarousel}
    >
      <CarouselContent className={`${s.circles} ms-0`}>
        {Children.map(children, (circle) => (
          <CarouselItem className="basis-auto ps-0">{circle}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label={labels.previous} className={`${arrowClass} start-0`} />
      <CarouselNext aria-label={labels.next} className={`${arrowClass} end-0`} />
    </Carousel>
  );
}
