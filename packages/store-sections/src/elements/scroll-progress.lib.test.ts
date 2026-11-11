import { describe, expect, it } from "vitest";
import {
  HORIZONTAL,
  SCRUB,
  centerProgress,
  changed,
  clamp01,
  containProgress,
  enterProgress,
  exitProgress,
  horizontalCount,
  horizontalLength,
  horizontalShift,
  passProgress,
  progressValue,
  scrubStyle,
  stepIndex,
  stepsCount,
} from "./scroll-progress.lib";

const VH = 800;

describe("scroll progress math", () => {
  it("passProgress: 0 when the top meets the screen bottom, 1 when the bottom leaves the top", () => {
    // An element 400px tall at page top 2000.
    expect(passProgress(1200, VH, 2000, 400)).toBe(0); // its top is at the bottom of the screen
    expect(passProgress(1800, VH, 2000, 400)).toBeCloseTo(0.5); // half way through its pass
    expect(passProgress(2400, VH, 2000, 400)).toBe(1); // its bottom is at the top
    // Clamped before and after.
    expect(passProgress(0, VH, 2000, 400)).toBe(0);
    expect(passProgress(9000, VH, 2000, 400)).toBe(1);
  });

  it("passProgress copes with zero and bad sizes", () => {
    expect(passProgress(1200, VH, 2000, 0)).toBe(0);
    expect(passProgress(1600, VH, 2000, 0)).toBeCloseTo(0.5);
    expect(passProgress(100, 0, 0, 0)).toBe(0);
    expect(passProgress(NaN, VH, 0, 100)).toBe(0);
    // A negative height counts as 0.
    expect(passProgress(-400, VH, 0, -50)).toBeCloseTo(0.5);
  });

  it("exitProgress: 0 until the top reaches the screen top, 1 once the bottom has left", () => {
    expect(exitProgress(0, 0, 900)).toBe(0);
    expect(exitProgress(450, 0, 900)).toBeCloseTo(0.5);
    expect(exitProgress(900, 0, 900)).toBe(1);
    expect(exitProgress(5000, 0, 900)).toBe(1);
    expect(exitProgress(50, 100, 900)).toBe(0);
    // Zero height: a step at its top.
    expect(exitProgress(99, 100, 0)).toBe(0);
    expect(exitProgress(101, 100, 0)).toBe(1);
  });

  it("centerProgress follows the middle of the screen through the element", () => {
    // Steps block from 1000 to 3000: the middle (scrollY + 400) enters it at scrollY 600.
    expect(centerProgress(600, VH, 1000, 2000)).toBe(0);
    expect(centerProgress(1600, VH, 1000, 2000)).toBeCloseTo(0.5);
    expect(centerProgress(2600, VH, 1000, 2000)).toBe(1);
    expect(centerProgress(0, VH, 1000, 2000)).toBe(0);
    expect(centerProgress(700, VH, 1000, 0)).toBe(1);
  });

  it("stepIndex picks the step under the middle and holds it near a boundary", () => {
    expect(stepIndex(0, 4)).toBe(0);
    expect(stepIndex(0.26, 4)).toBe(1);
    expect(stepIndex(0.99, 4)).toBe(3);
    expect(stepIndex(1, 4)).toBe(3);
    expect(stepIndex(-1, 4)).toBe(0);
    expect(stepIndex(0.5, 0)).toBe(0);
    // Hysteresis: 2.05 steps in is still step 1 when coming from step 1, step 2 when fresh.
    expect(stepIndex(2.05 / 4, 4, 1)).toBe(1);
    expect(stepIndex(2.05 / 4, 4)).toBe(2);
    expect(stepIndex(2.2 / 4, 4, 1)).toBe(2);
    // Going back up, too.
    expect(stepIndex(1.95 / 4, 4, 2)).toBe(2);
    expect(stepIndex(1.8 / 4, 4, 2)).toBe(1);
    // A far jump goes straight there; a bad previous step is ignored.
    expect(stepIndex(0.9, 4, 0)).toBe(3);
    expect(stepIndex(0.9, 4, 7)).toBe(3);
    expect(stepIndex(0.9, 4, 1.5)).toBe(3);
  });

  it("writes only real changes, as short values", () => {
    expect(changed(null, 0)).toBe(true);
    expect(changed(undefined, 0.5)).toBe(true);
    expect(changed(0.5, 0.5005)).toBe(false);
    expect(changed(0.5, 0.501)).toBe(true);
    expect(progressValue(0.123456)).toBe("0.1235");
    expect(progressValue(2)).toBe("1");
    expect(clamp01(Infinity)).toBe(0);
  });

  it("enterProgress: 0 when the top meets the screen bottom, 1 once 70% of the entry is done, both ways", () => {
    // A section 1000px tall (taller than the screen) at page top 2000: its entry is one screen (800px) long.
    expect(enterProgress(1200, VH, 2000, 1000)).toBe(0);
    expect(enterProgress(1480, VH, 2000, 1000)).toBeCloseTo(0.5); // 280 of 560
    expect(enterProgress(1760, VH, 2000, 1000)).toBe(1);
    // Scrolling back up gives the same values back: it only depends on where the page is.
    const down = [1300, 1400, 1500, 1600].map((y) => enterProgress(y, VH, 2000, 1000));
    const up = [1600, 1500, 1400, 1300].map((y) => enterProgress(y, VH, 2000, 1000)).reverse();
    expect(up).toEqual(down);
    expect([...down].sort((a, b) => a - b)).toEqual(down);
    // Clamped before and after.
    expect(enterProgress(0, VH, 2000, 1000)).toBe(0);
    expect(enterProgress(9000, VH, 2000, 1000)).toBe(1);
    // Shorter than the screen: its entry is its own height (400 × 0.7 = 280).
    expect(enterProgress(1340, VH, 2000, 400)).toBeCloseTo(0.5);
    expect(enterProgress(1480, VH, 2000, 400)).toBe(1);
    // A custom span, zero and bad sizes.
    expect(enterProgress(1600, VH, 2000, 1000, 1)).toBeCloseTo(0.5);
    expect(enterProgress(1200, VH, 2000, 0)).toBe(0);
    expect(enterProgress(1201, VH, 2000, 0)).toBe(1);
    expect(enterProgress(NaN, VH, 2000, 1000)).toBe(0);
  });

  it("containProgress: a pinned section's top at the screen top is 0, its bottom at the screen bottom is 1, both ways", () => {
    // A section 2000px tall at page top 3000: it covers the screen from scrollY 3000 to 4200.
    expect(containProgress(2500, VH, 3000, 2000)).toBe(0);
    expect(containProgress(3000, VH, 3000, 2000)).toBe(0);
    expect(containProgress(3600, VH, 3000, 2000)).toBeCloseTo(0.5);
    expect(containProgress(4200, VH, 3000, 2000)).toBe(1);
    expect(containProgress(9000, VH, 3000, 2000)).toBe(1);
    expect(containProgress(3900, VH, 3000, 2000)).toBeGreaterThan(containProgress(3300, VH, 3000, 2000));
    // Back up: the same place gives the same value.
    expect(containProgress(3300, VH, 3000, 2000)).toBeCloseTo(0.25);
    // Shorter than the screen (600px): from whole on screen (scrollY 2800) to its top at the screen top (3000).
    expect(containProgress(2800, VH, 3000, 600)).toBe(0);
    expect(containProgress(2900, VH, 3000, 600)).toBeCloseTo(0.5);
    expect(containProgress(3000, VH, 3000, 600)).toBe(1);
    // As tall as the screen, and bad numbers.
    expect(containProgress(2999, VH, 3000, 800)).toBe(0);
    expect(containProgress(3001, VH, 3000, 800)).toBe(1);
    expect(containProgress(NaN, VH, 3000, 2000)).toBe(0);
  });

  it("scrubStyle: the copy rises 40px into place and is opaque at 60%, the photo settles from 1.08 and half opacity", () => {
    expect(scrubStyle(0, "copy")).toEqual({ opacity: 0, rise: SCRUB.rise, scale: 1 });
    expect(scrubStyle(0.3, "copy").opacity).toBeCloseTo(0.5);
    expect(scrubStyle(0.3, "copy").rise).toBeCloseTo(28);
    expect(scrubStyle(0.6, "copy").opacity).toBe(1);
    expect(scrubStyle(0.8, "copy")).toMatchObject({ opacity: 1, scale: 1 });
    expect(scrubStyle(1, "copy")).toEqual({ opacity: 1, rise: 0, scale: 1 });
    expect(scrubStyle(0, "photo")).toEqual({ opacity: 0.5, rise: 0, scale: 1.08 });
    expect(scrubStyle(0.5, "photo").opacity).toBeCloseTo(0.75);
    expect(scrubStyle(0.5, "photo").scale).toBeCloseTo(1.04);
    expect(scrubStyle(1, "photo")).toEqual({ opacity: 1, rise: 0, scale: 1 });
    // Clamped, and scaled by Theme › Motion › Intensity (a bad one counts as normal).
    expect(scrubStyle(-3, "copy")).toEqual(scrubStyle(0, "copy"));
    expect(scrubStyle(7, "photo")).toEqual(scrubStyle(1, "photo"));
    expect(scrubStyle(0, "copy", 1.4).rise).toBeCloseTo(56);
    expect(scrubStyle(0, "photo", 0.6).scale).toBeCloseTo(1.048);
    expect(scrubStyle(0, "copy", NaN).rise).toBe(SCRUB.rise);
  });

  it("reads a horizontal card count of 4 to 12 only", () => {
    expect(horizontalCount("4")).toBe(4);
    expect(horizontalCount(12)).toBe(12);
    expect(horizontalCount(3)).toBeNull();
    expect(horizontalCount("13")).toBeNull();
    expect(horizontalCount("4.5")).toBeNull();
    expect(horizontalCount("")).toBeNull();
    expect(horizontalCount("1e1")).toBeNull();
    expect(horizontalCount(undefined)).toBeNull();
  });

  it("horizontalShift: one card and its gap per card past the three in view, mirrored in Arabic, clamped", () => {
    // A row 1200px wide: a card is (1200 - 2 × 24) / 3 = 384, a step 408. Six cards: 3 steps = 1224px in all.
    expect(horizontalShift(0, 6, 1200)).toBe(0);
    expect(horizontalShift(0.5, 6, 1200)).toBeCloseTo(-612);
    expect(horizontalShift(1, 6, 1200)).toBeCloseTo(-1224);
    // The last card then ends exactly at the row's end edge: 6 × 384 + 5 × 24 - 1200 = 1224.
    expect(6 * 384 + 5 * HORIZONTAL.gap - 1200).toBe(1224);
    // Arabic slides the other way, by the same distance.
    expect(horizontalShift(0.5, 6, 1200, true)).toBeCloseTo(612);
    expect(horizontalShift(1, 6, 1200, true)).toBeCloseTo(1224);
    expect(horizontalShift(0, 6, 1200, true)).toBe(0);
    // Going back up returns the same values; outside 0…1 it stays at the ends.
    expect(horizontalShift(0.25, 6, 1200)).toBeCloseTo(-306);
    expect(horizontalShift(-1, 6, 1200)).toBe(0);
    expect(horizontalShift(3, 6, 1200)).toBeCloseTo(-1224);
    // Nothing moves for a row the effect does not take, or with no width.
    expect(horizontalShift(1, 3, 1200)).toBe(0);
    expect(horizontalShift(1, 13, 1200)).toBe(0);
    expect(horizontalShift(1, 6, 0)).toBe(0);
  });

  it("horizontalLength: 30vw of pinned scroll per card past the three in view", () => {
    expect(horizontalLength(4)).toBe(30);
    expect(horizontalLength(12)).toBe(270);
    expect(horizontalLength(3)).toBe(0);
  });

  it("reads a steps count of 2 to 8 only", () => {
    expect(stepsCount("3")).toBe(3);
    expect(stepsCount(8)).toBe(8);
    expect(stepsCount("1")).toBeNull();
    expect(stepsCount("9")).toBeNull();
    expect(stepsCount("2.5")).toBeNull();
    expect(stepsCount(undefined)).toBeNull();
    expect(stepsCount("x")).toBeNull();
  });
});
