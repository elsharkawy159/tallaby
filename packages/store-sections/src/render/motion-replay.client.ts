"use client";

/**
 * Plays the reveals inside `root` once, now (docs/section-rules.md §6.8): the
 * editor canvas calls it on a section whose Animation just changed. Web
 * Animations only, filling backwards: an element is hidden only while its
 * replay waits, and is back to its own visible state the moment it ends, so
 * nothing in the canvas can stay hidden. Off with reduced motion and with
 * Theme › Animations off (`data-sf-motion="off"` on the site root).
 *
 * Sections without the motion v2 marker replay exactly as before. Marked
 * sections (`data-sf-mv="2"`) and the v2-only variants (`words`, `wipe-*`)
 * replay with the v2 tokens: an item's stagger step picks its delay from the
 * eased table, Intensity scales distances and zooms.
 */
import { MOTION_V2, MOTION_V2_EASE, staggerDelay } from "@workspace/motion/tokens";
import { SITE_ROOT_CLASS } from "../core/site-root";
import {
  MOTION_EASE,
  MOTION_V2_ATTR,
  MOTION_V2_MARK,
  REVEAL_SPEED_FACTOR,
  REVEAL_TIMING,
  REVEAL_TIMING_V2,
  REVEAL_V2_VARIANTS,
  intensityFactor,
  revealFrom,
  revealFromV2,
} from "../elements/motion";

const REPLAY_ID = "sf-reveal-replay";
const V2_SECTION = `[${MOTION_V2_ATTR}="${MOTION_V2_MARK}"]`;

const cancel = (el: Element) => {
  for (const running of el.getAnimations()) if (running.id === REPLAY_ID) running.cancel();
};

export function replayReveal(root: HTMLElement) {
  const win = root.ownerDocument.defaultView;
  if (!win || typeof root.animate !== "function" || win.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const site = root.closest<HTMLElement>(`.${SITE_ROOT_CLASS}`);
  if (site?.dataset.sfMotion === "off") return;
  const speed = REVEAL_SPEED_FACTOR[site?.dataset.sfSpeed as keyof typeof REVEAL_SPEED_FACTOR] ?? 1;
  const intensity = intensityFactor(site?.dataset.sfIntensity);
  const rtl = root.closest("[dir]")?.getAttribute("dir") === "rtl";
  const inV2 = root.matches(V2_SECTION) || root.closest(V2_SECTION) != null;
  for (const el of root.querySelectorAll<HTMLElement>("[data-reveal]")) {
    cancel(el);
    const variant = el.dataset.reveal;
    const step = Number(el.dataset.revealStep) || 0;
    const v2 = inV2 || el.closest(V2_SECTION) != null || (REVEAL_V2_VARIANTS as readonly string[]).includes(variant ?? "");
    if (!v2) {
      const from = revealFrom(variant, rtl);
      const to = { transform: "none", ...(from.clipPath && { clipPath: "inset(0)" }) };
      const animation = el.animate([{ opacity: 0, ...from }, { opacity: 1, ...to }], {
        duration: (variant === "zoom-in" ? REVEAL_TIMING.zoomDuration : REVEAL_TIMING.duration) * speed,
        delay: step * REVEAL_TIMING.step * speed,
        easing: MOTION_EASE,
        fill: "backwards",
      });
      animation.id = REPLAY_ID;
      continue;
    }
    const delay = staggerDelay(step) * speed;
    const words = variant === "words" ? Array.from(el.querySelectorAll<HTMLElement>("[data-w]")) : [];
    if (words.length) {
      // Each word rises in turn (`--i` is its capped step); the element itself stays as it is.
      const rise = `translate3d(0,${MOTION_V2.words.rise * intensity}em,0)`;
      for (const word of words) {
        cancel(word);
        const i = Number(word.style.getPropertyValue("--i")) || 0;
        const animation = word.animate([{ opacity: 0, transform: rise }, { opacity: 1, transform: "none" }], {
          duration: REVEAL_TIMING_V2.duration("words") * speed,
          delay: delay + i * REVEAL_TIMING_V2.perWord * speed,
          easing: MOTION_V2_EASE,
          fill: "backwards",
        });
        animation.id = REPLAY_ID;
      }
      continue;
    }
    // Words with no split words (the canvas draws plain text) rise whole, like fade-up.
    const from = revealFromV2(variant === "words" ? "fade-up" : variant, rtl, intensity);
    const to = { opacity: 1, transform: "none", ...(from.clipPath && { clipPath: "inset(0)" }) };
    const animation = el.animate([from, to], {
      duration: REVEAL_TIMING_V2.duration(variant === "words" ? "fade-up" : variant) * speed,
      delay,
      easing: MOTION_V2_EASE,
      fill: "backwards",
    });
    animation.id = REPLAY_ID;
  }
}
