"use client";

/**
 * Behaviour for every `carousel` element on the page (mount once, in the
 * storefront layout or a preview): autoplay with a progress dot, pause on
 * keyboard focus, the pause button, a hidden tab or when the carousel is
 * off-screen, and paused from the start with reduced motion. It keeps
 * playing under the mouse (owner, 2026-10-24). The
 * server markup (`elements/render-carousel.tsx`) works without it: the track
 * scrolls and snaps. Listeners are delegated, so carousels that mount later
 * (client navigation) are picked up too. `doc`: a preview frame's document
 * (default: this one). Renders nothing itself; it also mounts the burger
 * sheet's behaviour (`MenuSheetRuntime`) and the bottom navigation's
 * (`BottomNavRuntime`), so every host that draws a site
 * gets it.
 *
 * The autoplay clock (motion v2, docs/motion-v2-plan.md §1.4 bug 1) runs a
 * frame loop only while at least one carousel that is playing is on screen
 * and the tab is visible; otherwise no frame is scheduled at all. Which
 * carousels are on screen comes from an IntersectionObserver, so the loop
 * never queries the page or reads layout; per frame it only writes the
 * active dot's progress (`--p`), and only when it changed.
 */
import { useEffect } from "react";
import { CAROUSEL_COPY } from "../core/copy-carousel";
import { MenuSheetRuntime } from "./menu-sheet-runtime.client";
import { BottomNavRuntime } from "./bottom-nav-runtime.client";

type State = { index: number; elapsed: number; user: boolean; focus: boolean; moving: boolean; timer?: ReturnType<typeof setTimeout>; dot?: string };

const copy = (key: keyof typeof CAROUSEL_COPY, el: Element) => {
  const text = CAROUSEL_COPY[key];
  return (el.closest("[lang]")?.getAttribute("lang") ?? "ar").startsWith("en") ? text.en : text.ar;
};

export function CarouselRuntime({ doc }: { doc?: Document | null } = {}) {
  useEffect(() => startCarousels(doc ?? globalThis.document), [doc]);
  return (
    <>
      <MenuSheetRuntime doc={doc} />
      <BottomNavRuntime doc={doc} />
    </>
  );
}

/** Starts carousel behaviour for `document`; returns its clean-up. */
export function startCarousels(document: Document): (() => void) | undefined {
  const view = document.defaultView;
  if (!view) return;
  const window = view;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const states = new WeakMap<HTMLElement, State>();
  const track = (root: HTMLElement) => root.querySelector<HTMLElement>(":scope > [data-carousel-track]");
  const slides = (root: HTMLElement) => Array.from(track(root)?.children ?? []) as HTMLElement[];

  const state = (root: HTMLElement): State => {
    let s = states.get(root);
    if (!s) {
      s = { index: 0, elapsed: 0, user: reduce || root.dataset.autoplay === "0", focus: false, moving: false };
      states.set(root, s);
      const all = slides(root);
      all.forEach((slide, i) => {
        slide.setAttribute("aria-label", `${i + 1} / ${all.length}`);
        slide.toggleAttribute("inert", i !== 0);
      });
      const play = root.querySelector<HTMLElement>("[data-carousel-play]");
      if (play) setPlay(play, s.user);
      root.toggleAttribute("data-carousel-ready", true);
    }
    return s;
  };

  const setPlay = (button: HTMLElement, paused: boolean) => {
    button.setAttribute("aria-pressed", String(paused));
    button.setAttribute("aria-label", copy(paused ? "carouselPlay" : "carouselPause", button));
  };

  const showDots = (root: HTMLElement, index: number) => {
    root.querySelectorAll<HTMLElement>("[data-carousel-dot]").forEach((dot, i) => {
      dot.setAttribute("aria-current", String(i === index));
      dot.style.setProperty("--p", "0");
    });
    const s = states.get(root);
    if (s) s.dot = "0";
  };

  const shownIndex = (el: HTMLElement) => (el.clientWidth ? Math.round(Math.abs(el.scrollLeft) / el.clientWidth) : 0);

  // State follows the slide actually on screen (after a swipe or a jump).
  const settle = (root: HTMLElement) => {
    const el = track(root);
    if (!el) return;
    const s = state(root);
    const index = shownIndex(el);
    el.style.scrollSnapType = "";
    s.moving = false;
    if (s.index !== index) {
      s.index = index;
      s.elapsed = 0;
      showDots(root, index);
    }
    slides(root).forEach((slide, i) => slide.toggleAttribute("inert", i !== index));
    kick();
  };

  const go = (root: HTMLElement, to: number, smooth = true) => {
    const el = track(root);
    const count = slides(root).length;
    if (!el || !count) return;
    const s = state(root);
    const index = ((to % count) + count) % count;
    const glide = smooth && !reduce && Math.abs(index - s.index) <= 1;
    const rtl = window.getComputedStyle(el).direction === "rtl";
    s.index = index;
    s.elapsed = 0;
    s.moving = true;
    showDots(root, index);
    el.style.scrollSnapType = "none";
    el.scrollTo({ left: (rtl ? -1 : 1) * index * el.clientWidth, behavior: glide ? "smooth" : "auto" });
    clearTimeout(s.timer);
    s.timer = setTimeout(() => settle(root), glide ? 700 : 60);
  };

  const onScroll = (event: Event) => {
    const el = event.target;
    if (!(el instanceof window.HTMLElement) || !el.matches("[data-carousel-track]")) return;
    const root = el.closest<HTMLElement>("[data-carousel]");
    if (!root) return;
    const s = state(root);
    if (s.moving && event.type === "scroll") return;
    clearTimeout(s.timer);
    s.timer = setTimeout(() => settle(root), event.type === "scrollend" ? 0 : 120);
  };

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof window.Element ? event.target : null;
    // A product carousel row (`rail`): a view at a time, towards the end side for "next".
    const step = target?.closest<HTMLElement>("[data-rail-step]");
    const rail = step?.closest("[data-rail-wrap]")?.querySelector<HTMLElement>("[data-rail]");
    if (step && rail) {
      const rtl = window.getComputedStyle(rail).direction === "rtl";
      rail.scrollBy({ left: Number(step.dataset.railStep) * (rtl ? -1 : 1) * rail.clientWidth, behavior: reduce ? "auto" : "smooth" });
      return;
    }
    const button = target?.closest<HTMLElement>("[data-carousel-dot],[data-carousel-go],[data-carousel-play]");
    const root = button?.closest<HTMLElement>("[data-carousel]");
    if (!button || !root) return;
    const s = state(root);
    if (button.dataset.carouselDot !== undefined) go(root, Number(button.dataset.carouselDot));
    else if (button.dataset.carouselGo !== undefined) go(root, s.index + Number(button.dataset.carouselGo));
    else {
      s.user = !s.user;
      setPlay(button, s.user);
      kick();
    }
  };

  const onFocusIn = (event: FocusEvent) => {
    const root = event.target instanceof window.Element ? event.target.closest<HTMLElement>("[data-carousel]") : null;
    if (root) state(root).focus = (event.target as Element).matches(":focus-visible");
  };
  const onFocusOut = (event: FocusEvent) => {
    const root = event.target instanceof window.Element ? event.target.closest<HTMLElement>("[data-carousel]") : null;
    if (root && !(event.relatedTarget instanceof window.Node && root.contains(event.relatedTarget))) {
      state(root).focus = false;
      kick();
    }
  };
  const onResize = () => document.querySelectorAll<HTMLElement>("[data-carousel]").forEach((root) => go(root, state(root).index, false));

  // Carousels on screen, from the observer (no layout read per frame).
  const visible = new Set<HTMLElement>();
  const seen = new WeakSet<HTMLElement>();
  const io =
    "IntersectionObserver" in window
      ? new window.IntersectionObserver((entries) => {
          for (const entry of entries) {
            const root = entry.target as HTMLElement;
            if (entry.isIntersecting) visible.add(root);
            else visible.delete(root);
          }
          kick();
        })
      : null;
  const scan = () => {
    for (const root of document.querySelectorAll<HTMLElement>("[data-carousel]")) {
      if (seen.has(root)) continue;
      seen.add(root);
      state(root);
      // Without IntersectionObserver every carousel counts as on screen, as before.
      if (io) io.observe(root);
      else visible.add(root);
    }
    kick();
  };

  /** A visible carousel whose clock is running (not paused by the visitor, focus or a slide move). */
  const ticking = (root: HTMLElement) => {
    const s = state(root);
    return slides(root).length >= 2 && !s.user && !s.focus && !s.moving;
  };

  let last = 0;
  let frame = 0;
  const loop = (now: number) => {
    frame = 0;
    const dt = Math.min(now - last, 100);
    last = now;
    if (document.hidden) return;
    let running = false;
    for (const root of visible) {
      if (!root.isConnected) {
        visible.delete(root);
        io?.unobserve(root);
        continue;
      }
      if (!ticking(root)) continue;
      running = true;
      const s = state(root);
      const ms = Number(root.dataset.interval) || 5000;
      s.elapsed += dt;
      const p = String(Math.min(s.elapsed / ms, 1));
      if (p !== s.dot) {
        root.querySelector<HTMLElement>(`[data-carousel-dot="${s.index}"]`)?.style.setProperty("--p", p);
        s.dot = p;
      }
      if (s.elapsed >= ms) go(root, s.index + 1);
    }
    if (running) frame = window.requestAnimationFrame(loop);
  };
  /** Starts the clock when a playing carousel is on screen and the tab is visible; the loop stops itself otherwise. */
  function kick() {
    if (frame || document.hidden) return;
    for (const root of visible) {
      if (root.isConnected && ticking(root)) {
        last = window.performance.now();
        frame = window.requestAnimationFrame(loop);
        return;
      }
    }
  }
  const onVisibility = () => kick();

  // Carousels that mount later (client navigation, a preview's new page).
  let pendingScan = 0;
  const mutations = new window.MutationObserver(() => {
    if (pendingScan) return;
    pendingScan = window.requestAnimationFrame(() => {
      pendingScan = 0;
      scan();
    });
  });

  document.addEventListener("scroll", onScroll, true);
  document.addEventListener("scrollend", onScroll, true);
  document.addEventListener("click", onClick);
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", onResize);
  if (document.body) mutations.observe(document.body, { childList: true, subtree: true });
  scan();
  return () => {
    if (frame) window.cancelAnimationFrame(frame);
    if (pendingScan) window.cancelAnimationFrame(pendingScan);
    frame = 1; // nothing restarts after clean-up
    io?.disconnect();
    mutations.disconnect();
    document.removeEventListener("scroll", onScroll, true);
    document.removeEventListener("scrollend", onScroll, true);
    document.removeEventListener("click", onClick);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("resize", onResize);
  };
}
