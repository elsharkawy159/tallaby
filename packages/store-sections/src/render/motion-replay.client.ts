"use client";

/**
 * Plays the reveals inside `root` once, now (docs/section-rules.md §6.8): the
 * editor canvas calls it on a section whose Animation just changed. Web
 * Animations only, filling backwards: an element is hidden only while its
 * replay waits, and is back to its own visible state the moment it ends, so
 * nothing in the canvas can stay hidden. Off with reduced motion and with
 * Theme › Animations off (`data-sf-motion="off"` on the site root).
 */
import { SITE_ROOT_CLASS } from "../core/theme";
import { MOTION_EASE, REVEAL_SPEED_FACTOR, REVEAL_TIMING, revealFrom } from "../elements/motion";

const REPLAY_ID = "sf-reveal-replay";

export function replayReveal(root: HTMLElement) {
  const win = root.ownerDocument.defaultView;
  if (!win || typeof root.animate !== "function" || win.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const site = root.closest<HTMLElement>(`.${SITE_ROOT_CLASS}`);
  if (site?.dataset.sfMotion === "off") return;
  const speed = REVEAL_SPEED_FACTOR[site?.dataset.sfSpeed as keyof typeof REVEAL_SPEED_FACTOR] ?? 1;
  const rtl = root.closest("[dir]")?.getAttribute("dir") === "rtl";
  for (const el of root.querySelectorAll<HTMLElement>("[data-reveal]")) {
    for (const running of el.getAnimations()) if (running.id === REPLAY_ID) running.cancel();
    const variant = el.dataset.reveal;
    const from = revealFrom(variant, rtl);
    const to = { transform: "none", ...(from.clipPath && { clipPath: "inset(0)" }) };
    const step = Number(el.dataset.revealStep) || 0;
    const animation = el.animate([{ opacity: 0, ...from }, { opacity: 1, ...to }], {
      duration: (variant === "zoom-in" ? REVEAL_TIMING.zoomDuration : REVEAL_TIMING.duration) * speed,
      delay: step * REVEAL_TIMING.step * speed,
      easing: MOTION_EASE,
      fill: "backwards",
    });
    animation.id = REPLAY_ID;
  }
}
