/**
 * Scroll effects math and names (docs/motion-v2-plan.md §5.4-§5.5). Pure and
 * import-free, so the scroll engine (`render/scroll-engine.client.ts`), the
 * renderer and the settings share it without pulling anything into the
 * client bundle.
 *
 * Geometry is the element's page top (`rect.top + scrollY`) and its height,
 * cached by the engine; `scrollY` and `vh` (`innerHeight`) are read once per
 * frame. No function here reads layout.
 */

/** What `data-sf-scroll` may say (the renderer writes enum values only). */
export const SCROLL_EFFECTS = ["parallax", "zoom", "fade-exit", "progress", "scrub-photo", "scrub-copy", "horizontal"] as const;
export type ScrollEffect = (typeof SCROLL_EFFECTS)[number];
/** A section's Scroll effect (`style.shell.scrollEffect`); `none` is stored as nothing. */
export const SHELL_SCROLL_EFFECTS = ["none", "parallax", "zoom", "fade-exit", "reveal-scrub", "horizontal"] as const;
export type ShellScrollEffect = Exclude<(typeof SHELL_SCROLL_EFFECTS)[number], "none">;
/** An image's own Scroll effect (`props.scrollEffect`). */
export const IMAGE_SCROLL_EFFECTS = ["none", "parallax", "zoom"] as const;
export type ImageScrollEffect = Exclude<(typeof IMAGE_SCROLL_EFFECTS)[number], "none">;

/** A steps block has 2 to 8 steps (`data-sf-steps="n"`); more are drawn but share the last image. */
export const STEPS_MIN = 2;
export const STEPS_MAX = 8;
/**
 * How far (in steps) the screen's middle must go past a boundary before the
 * active step changes, so a step never flickers when the visitor stops right
 * on a boundary.
 */
export const STEP_HYSTERESIS = 0.12;
/**
 * `reveal-scrub` (docs/systems/plan.md §10, L6) at normal intensity: a
 * section's copy rises `rise` px into place and fades in (fully opaque at
 * `fade` of the way), its photo settles from `1 + zoom` and from `photoOpacity`,
 * while the section's top travels `span` of its entry (`view()` `entry 0%` to
 * `entry span`). It follows the scroll both ways. It runs on CSS scroll
 * timelines only (`motion.ts` generates the keyframes from these numbers);
 * `enterProgress` and `scrubStyle` below are the same mapping as plain math,
 * for the tests, the editor demo and a later engine fallback.
 */
export const SCRUB = { span: 0.7, rise: 40, fade: 0.6, zoom: 0.08, photoOpacity: 0.5 } as const;
/**
 * `horizontal` (L6): a row of `min` to `max` cards, `visible` in view with
 * `gap` px between them, slides sideways while its section is pinned. Each
 * card past the first `visible` adds `stepVw` of vertical scroll (at most
 * `maxVh` in all). On screens from `minWidth` × `minHeight` px only, and on
 * CSS scroll timelines only (`containProgress` and `horizontalShift` below
 * are the same mapping as plain math).
 */
export const HORIZONTAL = { min: 4, max: 12, visible: 3, gap: 24, stepVw: 30, maxVh: 250, minWidth: 768, minHeight: 600 } as const;
/** The engine writes a new value only when it moved at least this much. */
export const PROGRESS_EPSILON = 0.001;

/** `value` clamped to 0…1 (0 for anything not a finite number). */
export function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/**
 * Progress over the whole pass: 0 when the element's top meets the bottom of
 * the screen, 1 when its bottom leaves the top. (`view()` `cover`.)
 */
export function passProgress(scrollY: number, vh: number, top: number, height: number): number {
  const span = vh + Math.max(0, height);
  return span > 0 ? clamp01((scrollY + vh - top) / span) : 0;
}

/**
 * Progress on the way out: 0 while the element's top is at or below the top
 * of the screen, 1 once its bottom has left it (`view()` `exit-crossing`).
 * Zero height: 0 before its top, 1 after.
 */
export function exitProgress(scrollY: number, top: number, height: number): number {
  if (!(height > 0)) return scrollY > top ? 1 : 0;
  return clamp01((scrollY - top) / height);
}

/**
 * Where the middle of the screen is inside the element: 0 at its top, 1 at
 * its bottom. Steps use it, so the step whose text block is mid-screen is
 * the active one (`view()` `cover 50vh` to `cover calc(100% - 50vh)`).
 */
export function centerProgress(scrollY: number, vh: number, top: number, height: number): number {
  const middle = scrollY + vh / 2;
  if (!(height > 0)) return middle > top ? 1 : 0;
  return clamp01((middle - top) / height);
}

/**
 * Progress on the way in: 0 when the element's top meets the bottom of the
 * screen, 1 once `span` of its entry is done (`view()` `entry 0%` to
 * `entry span`; an entry is as long as the element, or the screen when the
 * element is taller). Zero height: 0 before its top shows, 1 after.
 */
export function enterProgress(scrollY: number, vh: number, top: number, height: number, span: number = SCRUB.span): number {
  const range = span * Math.min(Math.max(0, height), Math.max(0, vh));
  if (!(range > 0)) return scrollY + vh > top ? 1 : 0;
  return clamp01((scrollY + vh - top) / range);
}

/**
 * Progress while the element covers the screen or sits whole inside it
 * (`view()` `contain 0%` to `contain 100%`). Taller than the screen (a pinned
 * section): 0 when its top reaches the top of the screen, 1 when its bottom
 * reaches the bottom. Shorter: 0 once it is whole on screen, 1 when its top
 * reaches the top. As tall as the screen: a step at that point.
 */
export function containProgress(scrollY: number, vh: number, top: number, height: number): number {
  const h = Math.max(0, height);
  const start = Math.min(top, top + h - vh);
  const span = Math.abs(h - vh);
  if (!(span > 0)) return scrollY > start ? 1 : 0;
  return clamp01((scrollY - start) / span);
}

/**
 * What `reveal-scrub` draws at an entry progress (the CSS in `motion.ts`
 * computes the same): the copy's `rise` (px below its place) and opacity, the
 * photo's scale and opacity. At 1 everything is at rest.
 */
export function scrubStyle(progress: number, part: "photo" | "copy", intensity = 1): { opacity: number; rise: number; scale: number } {
  const p = clamp01(progress);
  const k = Number.isFinite(intensity) && intensity > 0 ? intensity : 1;
  if (part === "photo") return { opacity: SCRUB.photoOpacity + (1 - SCRUB.photoOpacity) * p, rise: 0, scale: 1 + (1 - p) * SCRUB.zoom * k };
  return { opacity: Math.min(1, p / SCRUB.fade), rise: (1 - p) * SCRUB.rise * k, scale: 1 };
}

/** A `horizontal` row's card count from untrusted markup or a list (`null` when it isn't 4 to 12: the row stays as it is). */
export function horizontalCount(value: unknown): number | null {
  const n = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n >= HORIZONTAL.min && n <= HORIZONTAL.max ? n : null;
}

/**
 * How far (px, signed) a `horizontal` row of `count` cards has slid at a
 * progress, for a row `width` px wide: one card and its gap per card past the
 * visible ones, toward the reading start (left in English: negative; right in
 * Arabic: positive). 0 for a count outside 4 to 12.
 */
export function horizontalShift(progress: number, count: number, width: number, rtl = false): number {
  const n = horizontalCount(count);
  if (!n || !(width > 0)) return 0;
  const shift = (clamp01(progress) * (n - HORIZONTAL.visible) * (width + HORIZONTAL.gap)) / HORIZONTAL.visible;
  return shift === 0 ? 0 : rtl ? shift : -shift;
}

/** How long a `horizontal` section stays pinned, in `vw` (the CSS caps it at `maxVh`): `stepVw` per card past the visible ones. */
export function horizontalLength(count: number): number {
  const n = horizontalCount(count);
  return n ? (n - HORIZONTAL.visible) * HORIZONTAL.stepVw : 0;
}

/**
 * The active step (0…n-1) for a centre progress. With the step before
 * (`previous`), it changes only once the middle of the screen is
 * `STEP_HYSTERESIS` of a step past the boundary.
 */
export function stepIndex(progress: number, n: number, previous?: number | null, hysteresis = STEP_HYSTERESIS): number {
  const count = Math.max(1, Math.floor(Number.isFinite(n) ? n : 1));
  const at = clamp01(progress) * count;
  const raw = Math.min(count - 1, Math.floor(at));
  if (previous == null || !Number.isInteger(previous) || previous < 0 || previous >= count || previous === raw) return raw;
  // Stay on the step before while the middle is within its band plus the margin.
  return at >= previous - hysteresis && at < previous + 1 + hysteresis ? previous : raw;
}

/** True when a value moved enough to be written again (always when there was none). */
export function changed(previous: number | null | undefined, next: number, epsilon = PROGRESS_EPSILON): boolean {
  return previous == null || Math.abs(next - previous) >= epsilon;
}

/** A value as the engine writes it in a CSS variable: at most 4 decimals. */
export function progressValue(value: number): string {
  return String(Math.round(clamp01(value) * 10_000) / 10_000);
}

/** A steps count from untrusted markup or props (`null` when it isn't 2 to 8). */
export function stepsCount(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n >= STEPS_MIN && n <= STEPS_MAX ? n : null;
}
