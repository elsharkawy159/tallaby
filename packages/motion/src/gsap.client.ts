"use client";

/**
 * The one place GSAP plugins are registered. Only the lazy runtime chunks
 * (`runtime.client.tsx`, `smooth-scroll.client.tsx`) import this, so GSAP
 * never lands in a page's first-load JavaScript.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

/** Media queries every preset branches on (`gsap.matchMedia`). */
export const MOTION_QUERIES = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  /** Parallax: tablet and up. */
  wide: "(min-width: 768px)",
  /** Pinning: desktop tall enough to hold a pinned block. */
  pin: "(min-width: 1024px) and (min-height: 700px)",
} as const;
