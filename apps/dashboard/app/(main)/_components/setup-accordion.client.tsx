"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const HOVER_OPEN_MS = 140;
const HOVER_CLOSE_MS = 260;
/** Share of the list left visible while collapsed. */
const PEEK = 0.5;

/**
 * Half-open list: shows the top of `children` under a fade and opens fully on
 * hover (mouse only), keyboard focus inside it, or a click on the toggle. A
 * click pins it open until clicked again.
 */
export function SetupAccordion({
  children,
  showAllLabel,
  showLessLabel,
}: {
  children: React.ReactNode;
  showAllLabel: string;
  showLessLabel: string;
}) {
  const id = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // After "Show less" while the mouse is still over the card, ignore hover until it leaves.
  const hoverSuppressed = useRef(false);
  const [fullHeight, setFullHeight] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = pinned || hovered || focused;

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setFullHeight(el.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const schedule = (next: boolean, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHovered(next), delay);
  };

  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || hoverSuppressed.current) return;
    schedule(true, HOVER_OPEN_MS);
  };
  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    hoverSuppressed.current = false;
    schedule(false, HOVER_CLOSE_MS);
  };

  const toggle = () => {
    clearTimeout(timer.current);
    if (open) {
      setPinned(false);
      setHovered(false);
      setFocused(false);
      hoverSuppressed.current = true;
    } else {
      setPinned(true);
    }
  };

  const collapsedHeight = fullHeight === null ? undefined : Math.round(fullHeight * PEEK);

  return (
    <div onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} className="relative">
      <div
        id={id}
        onFocus={(e) => {
          // Tabbing into a hidden step reveals the whole list.
          if (e.target !== e.currentTarget) setFocused(true);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
        className={cn(
          "relative overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none",
          fullHeight === null && "max-h-56"
        )}
        style={{ height: fullHeight === null ? undefined : open ? fullHeight : collapsedHeight }}
      >
        <div ref={contentRef}>{children}</div>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-b from-transparent via-card/85 to-card transition-opacity duration-300",
            open && "opacity-0"
          )}
        />
      </div>

      <div className={cn("flex justify-center transition-[margin] duration-300", open ? "mt-1 pb-3" : "-mt-7 pb-3.5")}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          className="group relative inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3.5 text-xs font-semibold text-primary-ink shadow-xs transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {open ? showLessLabel : showAllLabel}
          <ChevronDown
            className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
