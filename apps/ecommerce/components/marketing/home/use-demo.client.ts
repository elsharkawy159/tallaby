"use client";

import * as React from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function useReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

/** True while the element is on screen and the tab is visible. */
export function useInView<T extends Element>(threshold = 0.25): [React.RefObject<T | null>, boolean] {
  const ref = React.useRef<T>(null);
  const [onScreen, setOnScreen] = React.useState(false);
  const [tabVisible, setTabVisible] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((e) => e.isIntersecting)), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  React.useEffect(() => {
    const update = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return [ref, onScreen && tabVisible];
}

/**
 * A looping demo as numbered steps. `durations[n]` is how long step n lasts.
 * Before it first plays, and always under reduced motion, it shows `stillStep`,
 * a finished frame, so the prerendered page and a still page both make sense.
 * Timers run only while the element is on screen. `durations` must be stable.
 */
export function useDemoSteps<T extends Element>(durations: readonly number[], stillStep: number) {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<T>();
  const [state, setState] = React.useState({ step: stillStep, cycle: 0, started: false });

  React.useEffect(() => {
    if (reduced || !inView) return;
    const wait = state.started ? (durations[state.step] ?? 1000) : 400;
    const id = window.setTimeout(() => {
      setState((s) => {
        if (!s.started) return { step: 0, cycle: 0, started: true };
        return s.step + 1 >= durations.length ? { step: 0, cycle: s.cycle + 1, started: true } : { ...s, step: s.step + 1 };
      });
    }, wait);
    return () => window.clearTimeout(id);
  }, [reduced, inView, state, durations]);

  return { ref, step: state.step, cycle: state.cycle, started: state.started && !reduced };
}

/** Types `text` while `phase` is "typing"; empty when "hidden", whole when "done" or under reduced motion. */
export function useTyped(text: string, phase: "hidden" | "typing" | "done", msPerChar = 40): string {
  const reduced = useReducedMotion();
  const [count, setCount] = React.useState(0);
  const typing = phase === "typing" && !reduced;
  // Whole graphemes, so a letter and its marks (Arabic harakat, emoji) appear together.
  const units = React.useMemo(() => graphemes(text), [text]);

  React.useEffect(() => {
    if (!typing) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= units.length) window.clearInterval(id);
    }, msPerChar);
    return () => {
      window.clearInterval(id);
      setCount(0);
    };
  }, [typing, units, msPerChar]);

  if (phase === "hidden") return "";
  return typing ? units.slice(0, count).join("") : text;
}

function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (part) => part.segment);
  }
  return Array.from(text);
}
