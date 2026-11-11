import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { batchDelays, INTENSITY_FACTOR, MOTION_V2, MOTION_V2_EASE, MOTION_V2_STAGGER, MOTION_V2_TRIGGER, staggerDelay, wordStep } from "./tokens";
import * as presets from "./presets";

describe("motion v2 tokens", () => {
  it("holds the approved numbers (docs/motion-v2-plan.md §5.3)", () => {
    expect(MOTION_V2_EASE).toBe("cubic-bezier(.22,1,.36,1)");
    expect(MOTION_V2.fadeUp).toEqual({ duration: 700, distance: 20 });
    expect(MOTION_V2.fade.duration).toBe(600);
    expect(MOTION_V2.zoomIn).toEqual({ duration: 1000, scale: 1.06, clipInset: 4 });
    expect(MOTION_V2.slide).toEqual({ duration: 700, distance: 20 });
    expect(MOTION_V2.wipe).toEqual({ duration: 900, scale: 1.06 });
    expect(MOTION_V2.words).toMatchObject({ duration: 600, perWord: 40, maxSteps: 12, maxWords: 24 });
    expect(MOTION_V2_STAGGER).toEqual([0, 60, 110, 150, 185, 215]);
    expect(MOTION_V2_TRIGGER).toEqual({ rootMargin: "0px 0px -12% 0px", threshold: 0 });
    expect(INTENSITY_FACTOR).toEqual({ subtle: 0.6, normal: 1, expressive: 1.4 });
  });

  it("eases the stagger: shrinking steps, item 7 onwards plays with item 6", () => {
    const gaps = MOTION_V2_STAGGER.slice(1).map((d, i) => d - MOTION_V2_STAGGER[i]!);
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]!).toBeLessThan(gaps[i - 1]!);
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(5)).toBe(215);
    expect(staggerDelay(6)).toBe(215);
    expect(staggerDelay(40)).toBe(215);
    expect(staggerDelay(-3)).toBe(0);
    expect(staggerDelay(Number.NaN)).toBe(0);
  });

  it("gives a batch its delays in order, scaled by the site speed", () => {
    expect(batchDelays(0)).toEqual([]);
    expect(batchDelays(3)).toEqual([0, 60, 110]);
    expect(batchDelays(8)).toEqual([0, 60, 110, 150, 185, 215, 215, 215]);
    expect(batchDelays(3, 1.6)).toEqual([0, 96, 176]);
    expect(batchDelays(2, 0.6)).toEqual([0, 36]);
    expect(batchDelays(2, -1)).toEqual([0, 60]);
  });

  it("caps word steps at 12", () => {
    expect(wordStep(0)).toBe(0);
    expect(wordStep(11)).toBe(11);
    expect(wordStep(12)).toBe(11);
    expect(wordStep(99)).toBe(11);
  });

  it("is re-exported from presets", () => {
    expect(presets.MOTION_V2).toBe(MOTION_V2);
    expect(presets.batchDelays).toBe(batchDelays);
  });

  it("keeps tallaby.com's CSS in step with its own MOTION tokens (out of scope for v2)", () => {
    const css = readFileSync(new URL("./animations.css", import.meta.url), "utf8");
    expect(css).toContain(`--anim-ease: ${presets.MOTION.ease};`);
    expect(css).toContain(`--anim-distance: ${presets.MOTION.distance}px;`);
  });
});
