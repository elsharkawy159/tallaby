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
export const SCROLL_EFFECTS = ["parallax", "zoom", "fade-exit", "progress"] as const;
export type ScrollEffect = (typeof SCROLL_EFFECTS)[number];
/** A section's Scroll effect (`style.shell.scrollEffect`); `none` is stored as nothing. */
export const SHELL_SCROLL_EFFECTS = ["none", "parallax", "zoom", "fade-exit"] as const;
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
