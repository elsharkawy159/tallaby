/**
 * Motion v2 tokens (docs/motion-v2-plan.md §5.2-§5.3): the one source of
 * truth for every v2 number. Pure, no DOM. Store sites generate their v2 CSS
 * (`packages/store-sections/src/elements/motion.ts`), the reveal runtime's
 * trigger and batch stagger, and the editor replay from these values.
 *
 * Motion v1 (every store saved before v2) keeps its own frozen numbers in
 * `elements/motion.ts`; nothing here changes how it looks.
 */

/** Ease out, no bounce: quick start, soft settle. */
export const MOTION_V2_EASE = "cubic-bezier(.22,1,.36,1)";

/** Reveal variants at normal speed and intensity. Durations in ms, distances in px. */
export const MOTION_V2 = {
  fadeUp: { duration: 700, distance: 20 },
  fade: { duration: 600 },
  /** Photos settle from a slight zoom while their frame unmasks. */
  zoomIn: { duration: 1000, scale: 1.06, clipInset: 4 },
  slide: { duration: 700, distance: 20 },
  /** A photo unmasks from one edge while it settles from `scale` to 1. */
  wipe: { duration: 900, scale: 1.06 },
  /** Each word rises in turn: `perWord` ms apart, `maxSteps` steps at most (later words play with the last step). */
  words: { duration: 600, perWord: 40, maxSteps: 12, rise: 0.4, maxWords: 24 },
} as const;

/**
 * Delays (ms) of the items that enter view together, in DOM order: the steps
 * shrink, so a row settles in about 215 ms. Item 7 onwards plays with item 6.
 */
export const MOTION_V2_STAGGER = [0, 60, 110, 150, 185, 215] as const;

/** The v2 trigger: an element starts once its top crosses about 88% of the viewport height. */
export const MOTION_V2_TRIGGER = { rootMargin: "0px 0px -12% 0px", threshold: 0 } as const;

/** Theme › Motion › Intensity: scales distances and zoom amounts (`--sf-intensity`). Normal is stored as nothing. */
export const MOTION_INTENSITIES = ["subtle", "normal", "expressive"] as const;
export type MotionIntensity = (typeof MOTION_INTENSITIES)[number];
export const INTENSITY_FACTOR: Record<MotionIntensity, number> = { subtle: 0.6, normal: 1, expressive: 1.4 };

/** The delay (ms, normal speed) of the `index`-th item of a batch that enters view together. */
export function staggerDelay(index: number): number {
  const i = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  return MOTION_V2_STAGGER[Math.min(i, MOTION_V2_STAGGER.length - 1)]!;
}

/** Delays (ms) for a batch of `count` items at a speed factor (Theme › Animations speed, 1 = normal). */
export function batchDelays(count: number, speed = 1): number[] {
  const factor = Number.isFinite(speed) && speed > 0 ? speed : 1;
  return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, i) => Math.round(staggerDelay(i) * factor));
}

/** The step a word plays at (0-based word index): word 13 onwards plays with word 12. */
export function wordStep(index: number): number {
  return Math.min(Math.max(0, Math.floor(index)), MOTION_V2.words.maxSteps - 1);
}
