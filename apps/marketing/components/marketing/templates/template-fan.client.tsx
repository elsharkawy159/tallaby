"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@workspace/ui/lib/utils";
import { isOptimizableStoreImage } from "@/lib/store-site/optimize-image.lib";
import { BrowserBar } from "@/components/marketing/site/browser-frame";
import { TEMPLATES } from "@/lib/marketing/templates.data";
import { MiniStore } from "./store-preview";

// Atelier, Glow and Charm, as in the design.
const FAN = [TEMPLATES[1]!, TEMPLATES[2]!, TEMPLATES[4]!];

const POSITIONS = [
  "z-[3] -translate-x-1/2 -translate-y-1/2",
  "z-[2] -translate-x-[12%] -translate-y-[58%] rotate-[8deg] scale-[0.88]",
  "z-[1] -translate-x-[88%] -translate-y-[42%] -rotate-[8deg] scale-[0.88]",
];

/**
 * Three template cards that rotate to the front every few seconds: the
 * templates' thumbnails (`images`, 7:6, each with its own window and phone)
 * when three are given, else the drawn mini stores.
 */
export function TemplateFan({ images = [] }: { images?: readonly string[] }) {
  const thumbs = images.length >= 3 ? images.slice(0, 3) : null;
  const [order, setOrder] = React.useState([0, 1, 2]);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setOrder((o) => [...o.slice(1), o[0]!]), 3200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div aria-hidden dir="ltr" className="relative mx-auto h-60 w-full max-w-[560px] sm:h-80 lg:h-[380px] lg:max-w-none">
      {FAN.map((tpl, i) => (
        <div
          key={tpl.id}
          className={cn(
            "absolute top-1/2 left-1/2 w-[62%] overflow-hidden rounded-[14px] bg-white shadow-[0_30px_70px_rgba(0,0,0,0.4)] transition-transform duration-[800ms] ease-[cubic-bezier(.2,.6,.2,1)]",
            POSITIONS[order.indexOf(i)],
          )}
        >
          {thumbs ? (
            <div className="relative aspect-[7/6] w-full">
              <Image
                src={thumbs[i]!}
                alt=""
                fill
                preload={i === 0}
                sizes="(min-width: 1024px) 360px, 62vw"
                unoptimized={!isOptimizableStoreImage(thumbs[i]!)}
                className="object-cover"
              />
            </div>
          ) : (
            <>
              <BrowserBar />
              <MiniStore look={tpl.look} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
