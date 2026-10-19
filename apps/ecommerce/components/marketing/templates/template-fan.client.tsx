"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
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

/** Three template cards that rotate to the front every few seconds. */
export function TemplateFan() {
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
          <BrowserBar />
          <MiniStore look={tpl.look} />
        </div>
      ))}
    </div>
  );
}
