"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@workspace/ui/lib/utils";

/** Scroll movement below this (px) changes nothing, so small jitters never flicker the header. */
const JITTER = 8;

/**
 * A builder header that stays at the top while scrolling (owner, 2026-10-27;
 * docs/section-rules.md §5.6): scrolling down past its height slides it up
 * out of view, scrolling up slides it back. It stays shown at the top of the
 * page, while focus is inside it (search), while a sheet locks the page
 * scroll, and for visitors who ask for reduced motion. Only `translate`
 * moves (Tailwind v4's `-translate-y-full` sets `translate`, not `transform`,
 * so that is the property to transition), so the page never jumps.
 */
export function StickyStoreHeader({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let last = Math.max(0, window.scrollY);
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      setScrolled(y > 0);
      const pinned = reduce.matches || y <= el.offsetHeight || el.matches(":focus-within") || document.body.hasAttribute("data-scroll-locked");
      if (pinned) {
        setHidden(false);
        last = y;
        return;
      }
      if (Math.abs(y - last) < JITTER) return;
      setHidden(y > last);
      last = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onFocus = () => setHidden(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("focusin", onFocus);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("focusin", onFocus);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-header-hidden={hidden || undefined}
      className={cn(
        // Every section is its own stacking context (`relative isolate`); z-40 keeps the header's search results above the page.
        "sticky top-0 z-40 bg-(--sf-paper) transition-[translate,box-shadow] duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none",
        hidden && "-translate-y-full",
        scrolled && !hidden && "shadow-[0_1px_0_var(--sf-line)]",
      )}
    >
      {children}
    </div>
  );
}
