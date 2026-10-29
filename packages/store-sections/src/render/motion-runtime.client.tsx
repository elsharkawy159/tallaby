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
import { SITE_ROOT_CLASS } from "../core/theme";
import { countdownParts, formatCountdownUnit } from "../elements/countdown";

const SELECTOR = "[data-reveal]:not(.is-inview)";

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

  useEffect(() => {
    const document = doc ?? globalThis.document;
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
      el.removeEventListener("transitionend", done);
      el.removeAttribute("data-reveal");
      el.removeAttribute("data-reveal-step");
    };
    const finish = (el: HTMLElement) => {
      el.removeEventListener("transitionend", done);
      el.removeAttribute("data-reveal");
      el.removeAttribute("data-reveal-step");
    };
    const show = (el: HTMLElement) => {
      el.addEventListener("transitionend", done);
      el.classList.add("is-inview");
      // A cancelled transition fires no transitionend: clean up anyway once the longest reveal is over
      // (a slow site's zoom-in, 1.6s × 1.6, plus the last stagger step).
      window.setTimeout(() => finish(el), 3600);
    };

    const observer = new window.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          show(entry.target as HTMLElement);
        }
      },
      { threshold: 0.15 },
    );

    // Per run, never on the element: a remount (Strict Mode, a new preview frame) must watch everything again.
    const watched = new WeakSet<Element>();
    const watch = (root: HTMLElement, first: boolean) => {
      const height = window.innerHeight;
      for (const el of root.querySelectorAll<HTMLElement>(SELECTOR)) {
        if (watched.has(el)) continue;
        watched.add(el);
        // On screen before motion starts: shown as it is, no animation, and no reveal left on it.
        if (first && el.getBoundingClientRect().top < height) {
          el.removeAttribute("data-reveal");
          el.removeAttribute("data-reveal-step");
        } else observer.observe(el);
      }
    };

    const active = roots();
    for (const root of active) {
      watch(root, true);
      root.classList.add("sf-motion");
    }

    let frame = 0;
    const mutations = new window.MutationObserver(() => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        for (const root of roots()) {
          const first = !root.classList.contains("sf-motion");
          watch(root, first);
          root.classList.add("sf-motion");
        }
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      for (const root of roots()) root.classList.remove("sf-motion");
    };
  }, [doc]);
  return null;
}
