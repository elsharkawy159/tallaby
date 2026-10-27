"use client";

/** Lazy chunk behind `SmoothScrollProvider`. */
import Lenis from "lenis";
import * as React from "react";
import { gsap, MOTION_QUERIES, ScrollTrigger } from "./gsap.client";

/** Scroll areas Lenis must leave to the browser: dialogs, sheets and anything opted out. */
function prevent(node: HTMLElement): boolean {
  return node.closest?.('[data-lenis-prevent],[role="dialog"],dialog') != null;
}

export default function SmoothScroll({ offset }: { offset: number }) {
  React.useEffect(() => {
    const reduce = window.matchMedia(MOTION_QUERIES.reduce);
    let lenis: Lenis | null = null;
    let lock: MutationObserver | null = null;
    const tick = (time: number) => lenis?.raf(time * 1000);

    const start = () => {
      if (lenis) return;
      lenis = new Lenis({
        autoRaf: false,
        anchors: { offset: -offset },
        prevent,
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      // Radix dialogs lock the page with `data-scroll-locked` on <body>.
      const sync = () => (document.body.hasAttribute("data-scroll-locked") ? lenis?.stop() : lenis?.start());
      lock = new MutationObserver(sync);
      lock.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-scroll-locked"],
      });
    };
    const stop = () => {
      lock?.disconnect();
      lock = null;
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis?.destroy();
      lenis = null;
    };
    const onChange = () => (reduce.matches ? stop() : start());

    onChange();
    reduce.addEventListener("change", onChange);
    return () => {
      reduce.removeEventListener("change", onChange);
      stop();
    };
  }, [offset]);
  return null;
}
