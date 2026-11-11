import { describe, expect, it } from "vitest";
import { centerProgress, changed, clamp01, exitProgress, passProgress, progressValue, stepIndex, stepsCount } from "./scroll-progress.lib";

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
