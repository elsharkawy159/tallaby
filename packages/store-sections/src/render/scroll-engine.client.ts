/**
 * Scroll-progress engine (docs/motion-v2-plan.md §5.4): drives the scroll
 * effects the renderer marks (`data-sf-scroll="parallax|zoom|fade-exit|progress"`,
 * `data-sf-steps="n"`). Mounted by `MotionRuntime`, so every host that draws
 * a public site gets it; the editor canvas draws none of these attributes.
 *
 * - Browsers with CSS scroll timelines (`animation-timeline: view()`) run
 *   parallax, zoom, fade-exit and progress in CSS alone (`MOTION_CSS`); the
 *   engine skips them there. Steps always need it (an attribute changes).
 * - One IntersectionObserver (`rootMargin: 50% 0px`) keeps the set of effects
 *   near the screen. Their geometry (page top and height of the element they
 *   follow, its "track") is read when one enters, on resize and from a
 *   ResizeObserver, never while scrolling.
 * - One passive scroll listener schedules one frame. The frame reads
 *   `scrollY` and `innerHeight` once, computes every active effect from the
 *   cached geometry (`elements/scroll-progress.lib.ts`) and writes
 *   `--sf-progress` / `--sf-exit` only when a value moved by 0.001 or more,
 *   and `data-sf-step` only when the step changes. Nothing is scheduled while
 *   no effect is near the screen.
 * - It also starts count-up numbers (`data-sf-count`, `count-up.client.ts`).
 * - Off with reduced motion, Theme › Animations off (`data-sf-motion="off"`
 *   on the site root) and when printing; without it the CSS rest state shows
 *   the content finished (no transform, every step's text, the first image).
 */
import { SITE_ROOT_CLASS } from "../core/site-root";
import { REVEAL_SPEED_FACTOR } from "../elements/motion-flags";
import { centerProgress, changed, exitProgress, passProgress, progressValue, stepIndex, stepsCount } from "../elements/scroll-progress.lib";
import { createCountUps } from "./count-up.client";
import { watchMounts } from "./watch-mounts.client";

/** What the engine computes for an element. */
type Mode = "pass" | "exit" | "center";

type Item = {
  el: HTMLElement;
  /** The element whose geometry it follows (a photo's frame, the hero section, the steps block). */
  track: HTMLElement;
  mode: Mode;
  /** Steps count; 0 for a value effect. */
  steps: number;
  top: number;
  height: number;
  value: number | null;
  step: number | null;
};

const SECTION = "[data-section-id]";
const STEPS = "[data-sf-steps]";

/** Starts the scroll engine for `document`; returns its clean-up (nothing when effects can't run). */
export function startScrollEngine(document: Document): (() => void) | undefined {
  const window = document.defaultView;
  if (!window || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("print").matches) return;
  /** CSS runs the value effects itself; only steps are left to the engine. */
  const cssDriven = typeof window.CSS?.supports === "function" && window.CSS.supports("animation-timeline: view()");

  const byTrack = new Map<Element, Item[]>();
  const active = new Set<Item>();
  const seen = new WeakSet<Element>();
  let frame = 0;

  const measure = (item: Item) => {
    const rect = item.track.getBoundingClientRect();
    item.top = rect.top + window.scrollY;
    item.height = rect.height;
  };

  const write = (item: Item, scrollY: number, vh: number) => {
    const { el } = item;
    if (item.steps) {
      const step = stepIndex(centerProgress(scrollY, vh, item.top, item.height), item.steps, item.step);
      if (step !== item.step) {
        item.step = step;
        el.setAttribute("data-sf-step", String(step));
      }
      return;
    }
    const value =
      item.mode === "exit"
        ? exitProgress(scrollY, item.top, item.height)
        : item.mode === "center"
          ? centerProgress(scrollY, vh, item.top, item.height)
          : passProgress(scrollY, vh, item.top, item.height);
    if (!changed(item.value, value)) return;
    if (item.value == null) el.setAttribute("data-sf-live", "");
    item.value = value;
    el.style.setProperty(item.mode === "exit" ? "--sf-exit" : "--sf-progress", progressValue(value));
  };

  const update = () => {
    frame = 0;
    if (!active.size) return;
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    for (const item of active) {
      if (item.el.isConnected) write(item, scrollY, vh);
      else forget(item);
    }
  };
  const schedule = () => {
    if (!frame && active.size) frame = window.requestAnimationFrame(update);
  };
  const forget = (item: Item) => {
    active.delete(item);
    const list = byTrack.get(item.track);
    const rest = list?.filter((other) => other !== item) ?? [];
    if (rest.length) byTrack.set(item.track, rest);
    else {
      byTrack.delete(item.track);
      io.unobserve(item.track);
      ro?.unobserve(item.track);
    }
  };

  const io = new window.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        for (const item of byTrack.get(entry.target) ?? []) {
          if (entry.isIntersecting) {
            measure(item);
            active.add(item);
          } else active.delete(item);
        }
      }
      schedule();
    },
    { rootMargin: "50% 0px" },
  );
  // A size change anywhere can move the tracks below it, so every active effect is measured again.
  const remeasure = () => {
    for (const item of active) measure(item);
    schedule();
  };
  const ro = "ResizeObserver" in window ? new window.ResizeObserver(remeasure) : null;
  if (ro && document.body) ro.observe(document.body);

  const counts = createCountUps(window);
  const add = (el: HTMLElement, track: HTMLElement, mode: Mode, steps = 0) => {
    const item: Item = { el, track, mode, steps, top: 0, height: 0, value: null, step: null };
    const list = byTrack.get(track);
    if (list) list.push(item);
    else {
      byTrack.set(track, [item]);
      io.observe(track);
      ro?.observe(track);
    }
  };

  const scan = () => {
    for (const root of document.querySelectorAll<HTMLElement>(`.${SITE_ROOT_CLASS}`)) {
      if (root.dataset.sfMotion === "off") continue;
      const speed = REVEAL_SPEED_FACTOR[root.dataset.sfSpeed as keyof typeof REVEAL_SPEED_FACTOR] ?? 1;
      for (const el of root.querySelectorAll<HTMLElement>(`${STEPS},[data-sf-scroll],[data-sf-count]`)) {
        if (seen.has(el)) continue;
        seen.add(el);
        if (el.hasAttribute("data-sf-count")) {
          counts.add(el, speed);
          continue;
        }
        const steps = stepsCount(el.dataset.sfSteps);
        if (steps) {
          add(el, el, "center", steps);
          continue;
        }
        const effect = el.dataset.sfScroll;
        if (cssDriven) continue;
        if (effect === "parallax" || effect === "zoom") add(el, el.parentElement ?? el, "pass");
        else if (effect === "fade-exit") add(el, el.closest<HTMLElement>(SECTION) ?? el, "exit");
        else if (effect === "progress") {
          // A bar inside a steps block follows the step under the middle of the screen; elsewhere, its section's pass.
          const steps = el.closest<HTMLElement>(STEPS);
          if (steps) add(el, steps, "center");
          else add(el, el.closest<HTMLElement>(SECTION) ?? el, "pass");
        }
      }
    }
  };

  const onScroll = () => schedule();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", remeasure);

  // Sections that mount later (client navigation, a preview's new page) are picked up too.
  const stopWatching = watchMounts(document, scan);

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", remeasure);
    io.disconnect();
    ro?.disconnect();
    counts.stop();
    stopWatching();
    if (frame) window.cancelAnimationFrame(frame);
    active.clear();
    byTrack.clear();
  };
}
