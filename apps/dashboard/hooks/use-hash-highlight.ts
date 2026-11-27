"use client";

import { useEffect, useState } from "react";

/**
 * True for a few seconds after the page is opened (or the hash changes) at
 * `#<id>`, and scrolls that element into view. For sidebar links that point at
 * one section of a page, such as Marketing tools › Free shipping & minimum order.
 */
export function useHashHighlight(id: string, durationMs = 2400): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      if (window.location.hash !== `#${id}`) return;
      const element = document.getElementById(id);
      if (!element) return;
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      setOn(true);
      clearTimeout(timer);
      timer = setTimeout(() => setOn(false), durationMs);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => {
      window.removeEventListener("hashchange", check);
      clearTimeout(timer);
    };
  }, [id, durationMs]);
  return on;
}
