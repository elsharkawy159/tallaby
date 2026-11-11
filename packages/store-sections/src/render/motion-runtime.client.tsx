"use client";

/**
 * Reveal on scroll for every store site on the page (docs/section-rules.md
 * §6.7; mount once, in the storefront layout or a preview). The server markup
 * marks elements with `data-reveal` (`elements/render.tsx`) and the fixed CSS
 * (`MOTION_CSS`) hides them only under `sf-motion`, so a page without this
 * script shows everything. What is already on screen when it starts stays as
 * it is (the hero and the LCP never flash); the rest fades in once, the first
 * time it scrolls into view. Off with reduced motion and with Theme ›
 * Animations off (`data-sf-motion="off"` on the site root). Sections that
 * mount later (client navigation) are picked up too. `doc`: a preview frame's
 * document (default: this one). Renders nothing.
 */
import { useEffect } from "react";
import { MOTION_V2_TRIGGER, staggerDelay } from "@workspace/motion/tokens";
import { SITE_ROOT_CLASS } from "../core/site-root";
import { countdownParts, formatCountdownUnit } from "../elements/countdown";
import { MOTION_V2_ATTR, MOTION_V2_MARK, REVEAL_SPEED_FACTOR } from "../elements/motion-flags";
import { startScrollEngine } from "./scroll-engine.client";
import { watchMounts } from "./watch-mounts.client";

const SELECTOR = "[data-reveal]:not(.is-inview)";
/** A section inserted with motion v2 (`defineDesign` marks it): its reveals use the v2 trigger and eased batch stagger. */
const V2_SECTION = `[${MOTION_V2_ATTR}="${MOTION_V2_MARK}"]`;
/** A list drawn as a sideways row (`rail`, `mobileRail`): its cards reveal together, when the row enters view. */
const RAIL = "[data-sf-rail]";
const SWAP_PHOTO = "[data-sf-swap]>img";
const SECOND_PHOTO = "[data-sf-swap]>img:nth-child(2)";

export function MotionRuntime({ doc }: { doc?: Document | null } = {}) {
  // Countdowns (`elements/countdown.tsx`) tick every second, with or without motion: the
  // server drew the time left when the page was built, which a cached page makes stale.
  useEffect(() => {
    const document = doc ?? globalThis.document;
    const window = document.defaultView;
    if (!window) return;
    const tick = () => {
      const now = Date.now();
      for (const el of document.querySelectorAll<HTMLElement>("[data-countdown-ends]")) {
        const parts = countdownParts(el.dataset.countdownEnds, now);
        if (!parts) continue;
        if (parts.done) el.setAttribute("data-countdown-done", "");
        const locale = el.dataset.countdownLocale === "en" ? "en" : "ar";
        for (const unit of el.querySelectorAll<HTMLElement>("[data-countdown-value]")) {
          const key = unit.dataset.countdownValue as keyof typeof parts;
          const value = parts[key];
          if (typeof value !== "number") continue;
          const text = formatCountdownUnit(value, locale);
          if (unit.textContent !== text) unit.textContent = text;
        }
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [doc]);

  useEffect(() => startReveals(doc ?? globalThis.document), [doc]);
  // Motion v2: scroll effects, steps and count-up numbers (scroll-engine.client.ts).
  useEffect(() => startScrollEngine(doc ?? globalThis.document), [doc]);
  return null;
}

/**
 * Starts reveal on scroll for every site root in `document`; returns its
 * clean-up (nothing to clean when motion can't run). Sections without the
 * motion v2 marker keep the v1 behaviour exactly (one observer, threshold
 * 0.15, the server's stagger steps). Marked sections get a second observer
 * that fires earlier (`MOTION_V2_TRIGGER`) and staggers the elements that
 * enter together by their order, from an eased table (`--sf-delay`). A
 * sideways row (`data-sf-rail`, when it does scroll sideways) is watched as
 * one: when it enters view, all its cards reveal (a card off to the side never
 * crosses the screen, so watched alone it could stay hidden).
 */
export function startReveals(document: Document): (() => void) | undefined {
  const window = document.defaultView;
  if (!window || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const roots = () => Array.from(document.querySelectorAll<HTMLElement>(`.${SITE_ROOT_CLASS}`)).filter((root) => root.dataset.sfMotion !== "off");

  // The element's own transitions (hover) come back once the reveal has played: after its
  // longest part (transform; a plain fade only has opacity), so a slow photo zoom isn't cut short.
  const done = (event: TransitionEvent) => {
    const el = event.currentTarget as HTMLElement;
    if (event.target !== el) return;
    if (event.propertyName !== (el.dataset.reveal === "fade" ? "opacity" : "transform")) return;
    finish(el);
  };
  const finish = (el: HTMLElement) => {
    el.removeEventListener("transitionend", done);
    el.removeAttribute("data-reveal");
    el.removeAttribute("data-reveal-step");
    if (el.style.getPropertyValue("--sf-delay")) el.style.removeProperty("--sf-delay");
  };
  // A hover swap's second photo (motion v2, `data-sf-swap`) is decoded as its card appears, so the first hover never flashes blank.
  const decode = (el: HTMLElement) => {
    const photos = el.matches(SWAP_PHOTO) ? [el.parentElement?.children[1]] : el.querySelectorAll(SECOND_PHOTO);
    for (const img of photos) if (img instanceof window.HTMLImageElement && typeof img.decode === "function") img.decode().catch(() => {});
  };
  const show = (el: HTMLElement) => {
    decode(el);
    el.addEventListener("transitionend", done);
    el.classList.add("is-inview");
    // A cancelled transition fires no transitionend: clean up anyway once the longest reveal is over
    // (a slow site's zoom-in, 1.6s × 1.6, plus the last stagger step).
    window.setTimeout(() => finish(el), 3600);
  };

  /** A row's cards still waiting for their reveal. */
  const pending = (rail: Element) => Array.from(rail.querySelectorAll<HTMLElement>(SELECTOR));

  const observer = new window.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        // A row reveals its cards at once; each keeps its own stagger step (v1).
        if (entry.target.matches(RAIL)) pending(entry.target).forEach(show);
        else show(entry.target as HTMLElement);
      }
    },
    { threshold: 0.15 },
  );

  // Motion v2: what enters together is one batch, staggered by its order on the page (so each row
  // starts from 0), times the site speed. The server's stagger step is ignored (CSS).
  const speedOf = (el: Element) => REVEAL_SPEED_FACTOR[el.closest<HTMLElement>(`.${SITE_ROOT_CLASS}`)?.dataset.sfSpeed as keyof typeof REVEAL_SPEED_FACTOR] ?? 1;
  const observerV2 = new window.IntersectionObserver(
    (entries) => {
      const batch: HTMLElement[] = [];
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observerV2.unobserve(entry.target);
        if (entry.target.matches(RAIL)) batch.push(...pending(entry.target));
        else batch.push(entry.target as HTMLElement);
      }
      batch.sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1));
      batch.forEach((el, i) => {
        el.style.setProperty("--sf-delay", `${Math.round(staggerDelay(i) * speedOf(el))}ms`);
        show(el);
      });
    },
    { rootMargin: MOTION_V2_TRIGGER.rootMargin, threshold: MOTION_V2_TRIGGER.threshold },
  );
  const observerOf = (el: Element) => (el.closest(V2_SECTION) ? observerV2 : observer);
  /** A row that really scrolls sideways now (a phone-only row is a grid on wider screens). */
  const sideways = (rail: HTMLElement) => /^(auto|scroll)$/.test(window.getComputedStyle(rail).overflowX);
  const strip = (el: HTMLElement) => {
    decode(el);
    el.removeAttribute("data-reveal");
    el.removeAttribute("data-reveal-step");
  };

  // Per run, never on the element: a remount (Strict Mode, a new preview frame) must watch everything again.
  const watched = new WeakSet<Element>();
  const watch = (root: HTMLElement, first: boolean) => {
    const height = window.innerHeight;
    for (const rail of root.querySelectorAll<HTMLElement>(RAIL)) {
      if (watched.has(rail) || !sideways(rail)) continue;
      watched.add(rail);
      const items = pending(rail);
      if (!items.length) continue;
      for (const el of items) watched.add(el);
      if (first && rail.getBoundingClientRect().top < height) items.forEach(strip);
      else observerOf(rail).observe(rail);
    }
    for (const el of root.querySelectorAll<HTMLElement>(SELECTOR)) {
      if (watched.has(el)) continue;
      watched.add(el);
      // On screen before motion starts: shown as it is, no animation, and no reveal left on it.
      if (first && el.getBoundingClientRect().top < height) strip(el);
      else observerOf(el).observe(el);
    }
  };

  // A root seen for the first time (no `sf-motion` yet) shows what is already on screen as it is.
  const stopWatching = watchMounts(document, () => {
    for (const root of roots()) {
      watch(root, !root.classList.contains("sf-motion"));
      root.classList.add("sf-motion");
    }
  });

  return () => {
    stopWatching();
    observer.disconnect();
    observerV2.disconnect();
    for (const root of roots()) root.classList.remove("sf-motion");
  };
}
