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
import { MOTION_V2, MOTION_V2_EASE, MOTION_V2_SCROLL, staggerDelay } from "@workspace/motion/tokens";
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
import { scrubStyle } from "../elements/scroll-progress.lib";

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

/** How long a scroll effect's demo plays in the editor (ms, normal speed). */
export const SCROLL_DEMO_MS = 900;
/** How far a horizontal row's demo slides in (percent of the row's width). */
const HORIZONTAL_DEMO = 12;

/**
 * Plays a one-shot demo of a Scroll effect in the editor canvas (docs/motion-v2-plan.md
 * §5.8), which draws no scroll effect itself: call it when a section's Scroll
 * effect (`style.shell.scrollEffect`) or an image's own (`props.scrollEffect`)
 * changes. `section`: the section's element in the canvas (its
 * `[data-section-id]` wrapper). `targetId`: the node the effect moves, from
 * `scrollEffectTargets` (`imageId` for parallax and zoom, `contentId` for
 * fade-exit, `imageId` then `scrubId` for reveal-scrub, one call each, `rowId`
 * for horizontal) or the image's own id; without it, parallax and zoom play on
 * the section's background photo. Parallax drifts from `+range` to rest, zoom
 * settles from 1.12, fade-exit fades in from 0.2, reveal-scrub plays its way
 * in, a horizontal row slides in sideways, each over 900 ms with
 * `fill: backwards`, so the canvas is static and fully visible when it ends.
 * Off with reduced motion and Theme › Animations off. Count-ups need no demo:
 * the canvas shows the final number.
 */
export function replayScrollEffect(section: HTMLElement, effect: string | null | undefined, targetId?: string | null) {
  if (effect !== "parallax" && effect !== "zoom" && effect !== "fade-exit" && effect !== "reveal-scrub" && effect !== "horizontal") return;
  const win = section.ownerDocument.defaultView;
  if (!win || win.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const site = section.closest<HTMLElement>(`.${SITE_ROOT_CLASS}`);
  if (site?.dataset.sfMotion === "off") return;
  const speed = REVEAL_SPEED_FACTOR[site?.dataset.sfSpeed as keyof typeof REVEAL_SPEED_FACTOR] ?? 1;
  const intensity = intensityFactor(site?.dataset.sfIntensity);
  // Node ids are plain (`[A-Za-z0-9_:-]`, the tree schema); anything else is not looked up.
  const target = targetId && /^[\w:-]{1,64}$/.test(targetId)
    ? section.querySelector<HTMLElement>(`[data-node-id="${targetId}"]`)
    : targetId || (effect !== "parallax" && effect !== "zoom")
      ? null
      : section.querySelector<HTMLElement>(":scope > img");
  if (!target || typeof target.animate !== "function") return;
  cancel(target);
  const range = (MOTION_V2_SCROLL.parallaxRange * intensity) / 100;
  // reveal-scrub plays its way in on each target (the photo settles, the copy rises); a horizontal
  // row slides in from the reading end (the left in Arabic), by part of a card.
  const scrub = effect === "reveal-scrub" ? scrubStyle(0, target.dataset.nodeType === "image" ? "photo" : "copy", intensity) : null;
  const rtl = section.closest("[dir]")?.getAttribute("dir") === "rtl";
  const from = scrub
    ? { opacity: scrub.opacity, transform: `translate3d(0,${scrub.rise}px,0) scale(${scrub.scale})` }
    : effect === "horizontal"
      ? { transform: `translate3d(${rtl ? -HORIZONTAL_DEMO : HORIZONTAL_DEMO}%,0,0)` }
      : effect === "parallax"
        ? { transform: `translate3d(0,${range * 100}%,0) scale(${1 + 2 * range})` }
        : effect === "zoom"
          ? { transform: `scale(${1 + MOTION_V2_SCROLL.zoomScale * intensity})` }
          : { opacity: MOTION_V2_SCROLL.fadeExitOpacity, transform: `translate3d(0,${-MOTION_V2_SCROLL.fadeExitRise * intensity}px,0)` };
  const to = scrub || effect === "fade-exit" ? { opacity: 1, transform: "none" } : { transform: "none" };
  const animation = target.animate([from, to], { duration: SCROLL_DEMO_MS * speed, easing: MOTION_V2_EASE, fill: "backwards" });
  animation.id = REPLAY_ID;
}
