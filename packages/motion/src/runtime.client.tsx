"use client";

/**
 * The scroll runtime: reads the `data-*` attributes inside its scope and
 * builds the GSAP animations (README "Data attributes"). Loaded lazily by
 * `MotionScope`, after hydration, so none of it is first-load JavaScript.
 *
 * - Start states are set inline here, and only for elements still below the
 *   fold: whatever is already on screen (or above it) is left alone, so
 *   nothing ever flashes visible → hidden → visible.
 * - Everything plays once and clears its inline styles; only parallax and
 *   the pinned steps scrub.
 * - Reduced motion: nothing is set up, content just shows.
 * - Unmount (route change) reverts every tween, ScrollTrigger and inline
 *   style through the `useGSAP` context.
 */
import type * as React from "react";
import { gsap, MOTION_QUERIES, ScrollTrigger, useGSAP } from "./gsap.client";
import { fillOrigin, formatCount, MOTION, normalizeVariant, parseCount, parseNumber, revealFrom, type MotionDirection, type RevealVariant } from "./presets";

/** Elements that already played (or were on screen at start); never hidden again. */
const played = new WeakSet<Element>();

const SHOWN = { opacity: 1, x: 0, y: 0, scale: 1 };
const CLEAR = "opacity,transform";

function dirOf(el: Element): MotionDirection {
  return getComputedStyle(el).direction === "rtl" ? "rtl" : "ltr";
}

/** On screen or scrolled past: playing it now would only flash. Marks it played. */
function skip(el: Element): boolean {
  if (played.has(el)) return true;
  if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
    played.add(el);
    return true;
  }
  return false;
}

/**
 * Inside something that animates it already: a reveal inside a reveal or a
 * stagger group, a group inside a group. A group inside a revealed card still
 * staggers (its items follow the card in).
 */
function nested(el: Element, root: Element, outer: string): boolean {
  const parent = el.parentElement?.closest(outer);
  return parent != null && root.contains(parent);
}

function all<T extends Element = HTMLElement>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

function timing(variant: RevealVariant) {
  return variant === "zoom-in" ? { duration: 1.4, ease: MOTION.easeSoft } : { duration: MOTION.duration, ease: MOTION.ease };
}

function reveal(el: HTMLElement) {
  const variant = normalizeVariant(el.dataset.reveal);
  if (!variant || skip(el)) return;
  const delay = parseNumber(el.dataset.revealDelay, 0, 0, 2) + parseNumber(el.dataset.revealStep, 0, 0, 5) * MOTION.stepDelay;
  gsap.fromTo(el, revealFrom(variant, dirOf(el)), {
    ...SHOWN,
    ...timing(variant),
    delay,
    clearProps: CLEAR,
    scrollTrigger: { trigger: el, start: MOTION.start, once: true },
    onStart: () => void played.add(el),
  });
}

/** Items play in sequence, a batch at a time as they come into view. */
function staggerIn(items: HTMLElement[], variant: RevealVariant, gap: number, dir: MotionDirection, ctx: gsap.Context) {
  const pending = items.filter((el) => !skip(el));
  if (pending.length === 0) return;
  gsap.set(pending, revealFrom(variant, dir));
  ScrollTrigger.batch(pending, {
    start: MOTION.start,
    once: true,
    onEnter: (batch) =>
      ctx.add(() => {
        batch.forEach((el) => played.add(el));
        gsap.to(batch, {
          ...SHOWN,
          ...timing(variant),
          stagger: gap,
          clearProps: CLEAR,
          overwrite: true,
        });
      }),
  });
}

function stagger(group: HTMLElement, ctx: gsap.Context) {
  const marked = all(group, "[data-stagger-item]");
  const items = marked.length > 0 ? marked : (Array.from(group.children) as HTMLElement[]);
  const variant = normalizeVariant(group.dataset.staggerVariant) ?? "fade-up";
  staggerIn(items, variant, parseNumber(group.dataset.stagger, MOTION.stagger, 0, 0.3), dirOf(group), ctx);
}

/** Counts its own text node up from `data-count-up` (default 0). Returns a restore. */
function countUp(el: HTMLElement): (() => void) | undefined {
  const node = Array.from(el.childNodes).find((n): n is Text => n.nodeType === Node.TEXT_NODE && /\d|[٠-٩]/.test(n.nodeValue ?? ""));
  const original = node?.nodeValue ?? "";
  const parsed = parseCount(original);
  if (!node || !parsed || skip(el)) return;
  const from = parseNumber(el.dataset.countUp, 0);
  const counter = { v: from };
  // Only the digits change, in place: React still owns the text node.
  const write = () => (node.nodeValue = original.replace(/[\d٠-٩][\d,٠-٩٬]*/, formatCount(counter.v, parsed)));
  write();
  gsap.to(counter, {
    v: parsed.value,
    duration: 1,
    ease: "power2.out",
    onUpdate: write,
    onComplete: () => void (node.nodeValue = original),
    scrollTrigger: { trigger: el, start: MOTION.start, once: true },
    onStart: () => void played.add(el),
  });
  return () => void (node.nodeValue = original);
}

function parallax(el: HTMLElement) {
  const speed = parseNumber(el.dataset.parallax, 0.15, -1, 1);
  // `clamp()`: something already on screen at load starts at rest instead of jumping.
  gsap.fromTo(
    el,
    { y: 0 },
    {
      y: -speed * MOTION.parallax,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "clamp(top bottom)",
        end: "bottom top",
        scrub: true,
      },
    },
  );
}

/** Pins the block while its steps light up in turn and the bar fills along the reading direction. */
function pin(el: HTMLElement) {
  const steps = all(el, "[data-pin-step]");
  if (steps.length < 2) return;
  steps.forEach((s) => played.add(s));
  const bar = el.querySelector<HTMLElement>("[data-pin-progress]");
  const rest = steps.slice(1);
  // What dims while a step waits: its `[data-pin-fade]` parts if it marks any (so a solid
  // badge can stay opaque over a line behind it), else the whole step.
  const faded = (step: HTMLElement) => {
    const parts = all(step, "[data-pin-fade]");
    return parts.length > 0 ? parts : [step];
  };
  gsap.set(rest, { y: 12 });
  gsap.set(rest.flatMap(faded), { opacity: 0.3 });
  if (bar)
    gsap.set(bar, {
      opacity: 1,
      scaleX: 0,
      transformOrigin: fillOrigin(dirOf(el)),
    });
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: el,
      start: "center center",
      end: () => `+=${Math.round(window.innerHeight * 0.9)}`,
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
  rest.forEach((step, i) => {
    if (bar) tl.to(bar, { scaleX: (i + 1) / rest.length, duration: 1 }, i);
    tl.to(step, { y: 0, duration: 0.5, ease: "power2.out" }, i + 0.5);
    tl.to(faded(step), { opacity: 1, duration: 0.5, ease: "power2.out" }, i + 0.5);
  });
  // A short hold on the last step before the block scrolls away.
  tl.to({}, { duration: 0.4 });
}

export default function MotionRuntime({ scope }: { scope: React.RefObject<HTMLElement | null> }) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const html = document.documentElement;
      html.dataset.motion = "ready";

      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: MOTION_QUERIES.motion,
          wide: MOTION_QUERIES.wide,
          pinning: MOTION_QUERIES.pin,
        },
        (ctx) => {
          const { motion, wide, pinning } = ctx.conditions as Record<string, boolean>;
          if (!motion) return;
          const restores: (() => void)[] = [];
          all(root, "[data-pin]").forEach((el) => (pinning ? pin(el) : staggerIn(all(el, "[data-pin-step]"), "fade-up", MOTION.stagger, dirOf(el), ctx)));
          all(root, "[data-reveal]").forEach((el) => nested(el, root, "[data-reveal],[data-stagger]") || reveal(el));
          all(root, "[data-stagger]").forEach((el) => nested(el, root, "[data-stagger]") || stagger(el, ctx));
          all(root, "[data-count-up]").forEach((el) => {
            const restore = countUp(el);
            if (restore) restores.push(restore);
          });
          if (wide) all(root, "[data-parallax]").forEach(parallax);
          return () => restores.forEach((r) => r());
        },
      );

      // Trigger positions move as fonts swap in, images load and the layout settles.
      let timer = 0;
      const refresh = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
      };
      void document.fonts?.ready.then(refresh);
      if (document.readyState !== "complete") window.addEventListener("load", refresh, { once: true });
      const observer = new ResizeObserver(refresh);
      observer.observe(root);

      return () => {
        observer.disconnect();
        window.removeEventListener("load", refresh);
        window.clearTimeout(timer);
        mm.revert();
        delete html.dataset.motion;
      };
    },
    { scope },
  );
  return null;
}
