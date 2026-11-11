/**
 * Count-up numbers (docs/motion-v2-plan.md §5.6), run by the scroll engine
 * (`scroll-engine.client.ts` finds them in its scan, so they share its gating:
 * off with reduced motion, Theme › Animations off and when printing).
 *
 * The server draws a stat's final text (`data-sf-count`, `elements/render.tsx`):
 * a screen-reader copy, and a hidden copy that keeps the width with the live
 * number (`data-sf-count-live`) in the same grid cell, so nothing moves while
 * it counts (CLS 0). A number below the screen when it is found is set to 0
 * and counts up once, over 1.2 s × the site speed with an ease-out, when it
 * enters view; one already on screen keeps its final text (counting from 0
 * there would flash). Arabic digits, grouping and the text around the number
 * ("+", "%") are kept.
 */
import { easeOutQuad, formatCount, splitCount, type CountParts } from "@workspace/motion/count";
import { MOTION_V2_SCROLL } from "@workspace/motion/tokens";

/** A count's text at `value` (with its prefix and suffix). */
export function countText(parts: CountParts, value: number): string {
  return parts.prefix + formatCount(value, parts) + parts.suffix;
}

/** Count-ups for one window: `add` a `data-sf-count` element (with its site speed); `stop` puts every final number back. */
export function createCountUps(window: Window & typeof globalThis) {
  const waiting = new Map<Element, () => void>();
  /** Every count set back to 0, restored on clean-up. */
  const touched: [HTMLElement, string][] = [];
  let frames: number[] = [];
  const io = new window.IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      waiting.get(entry.target)?.();
      waiting.delete(entry.target);
    }
  });
  return {
    add(el: HTMLElement, speed: number) {
      const live = el.querySelector<HTMLElement>("[data-sf-count-live]");
      const final = live?.textContent ?? "";
      const parts = splitCount(final);
      if (!live || !parts || el.getBoundingClientRect().top < window.innerHeight) return;
      live.textContent = countText(parts, 0);
      touched.push([live, final]);
      const ms = MOTION_V2_SCROLL.countUp * speed;
      let start: number | undefined;
      const tick = (now: number) => {
        start ??= now;
        const t = Math.min(1, (now - start) / ms);
        live.textContent = t < 1 ? countText(parts, parts.value * easeOutQuad(t)) : final;
        if (t < 1) frames.push(window.requestAnimationFrame(tick));
      };
      waiting.set(el, () => frames.push(window.requestAnimationFrame(tick)));
      io.observe(el);
    },
    stop() {
      io.disconnect();
      frames.forEach(window.cancelAnimationFrame);
      frames = [];
      for (const [live, final] of touched) live.textContent = final;
    },
  };
}
