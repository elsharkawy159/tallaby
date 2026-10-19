"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";

/**
 * Phone-only bottom CTA. Hidden while the hero (`#top`) or the closing CTA
 * (`#final`) is on screen, since both already have one.
 */
export function StickyCta() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const targets = ["top", "final"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const visible = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target, e.isIntersecting));
      setShow(![...visible.values()].some(Boolean));
    });
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div
      data-sticky-cta
      data-print="hide"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[60] border-t border-neutral-200 bg-white px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] transition-transform duration-300 md:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <SignupTrigger className="w-full" tabIndex={show ? 0 : -1} />
    </div>
  );
}
