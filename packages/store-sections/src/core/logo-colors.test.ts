import { describe, expect, it } from "vitest";
import { dominantColorsFromPixels } from "./logo-colors";
import { deltaEOk, hexToRgb } from "./palette";

type Px = [number, number, number, number];

/** Pixels from [colour, count] runs. */
function pixels(...runs: [Px, number][]): Uint8ClampedArray {
  const total = runs.reduce((n, [, c]) => n + c, 0);
  const data = new Uint8ClampedArray(total * 4);
  let i = 0;
  for (const [px, count] of runs) {
    for (let k = 0; k < count; k++, i += 4) data.set(px, i);
  }
  return data;
}

const near = (hex: string, target: string) => deltaEOk(hexToRgb(hex)!, hexToRgb(target)!) < 0.03;

const RED: Px = [220, 30, 40, 255];
const BLUE: Px = [20, 60, 200, 255];
const GREEN: Px = [30, 160, 70, 255];
const ORANGE: Px = [245, 140, 20, 255];
const WHITE: Px = [255, 255, 255, 255];
const BLACK: Px = [5, 5, 5, 255];
const GREY: Px = [128, 128, 128, 255];
const CLEAR: Px = [255, 0, 0, 0];

describe("dominantColorsFromPixels", () => {
  it("returns the colours sorted by weight, up to 3", () => {
    const out = dominantColorsFromPixels(pixels([RED, 500], [BLUE, 300], [GREEN, 200], [ORANGE, 100]));
    expect(out).toHaveLength(3);
    expect(near(out[0]!, "#dc1e28")).toBe(true);
    expect(near(out[1]!, "#143cc8")).toBe(true);
    expect(near(out[2]!, "#1ea046")).toBe(true);
    for (const hex of out) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("honours max", () => {
    const data = pixels([RED, 500], [BLUE, 300], [GREEN, 200]);
    expect(dominantColorsFromPixels(data, { max: 1 })).toHaveLength(1);
    expect(dominantColorsFromPixels(data, { max: 2 })).toHaveLength(2);
  });

  it("skips transparent, near-white, near-black and grey pixels", () => {
    const out = dominantColorsFromPixels(pixels([CLEAR, 5000], [WHITE, 4000], [BLACK, 3000], [GREY, 2000], [BLUE, 50]));
    expect(out).toHaveLength(1);
    expect(near(out[0]!, "#143cc8")).toBe(true);
  });

  it("weights saturated colours over dull ones of the same count", () => {
    const dull: Px = [150, 120, 100, 255]; // brownish, low chroma but not grey
    const out = dominantColorsFromPixels(pixels([dull, 400], [BLUE, 300]));
    expect(near(out[0]!, "#143cc8")).toBe(true);
  });

  it("merges near-duplicate shades into one colour", () => {
    const out = dominantColorsFromPixels(
      pixels([[220, 30, 40, 255], 300], [[214, 34, 44, 255], 300], [[226, 26, 36, 255], 300], [BLUE, 200]),
    );
    expect(out).toHaveLength(2);
    expect(near(out[0]!, "#dc1e28")).toBe(true);
  });

  it("returns the strongest grey for a grey-only logo", () => {
    const dark: Px = [70, 70, 70, 255];
    const out = dominantColorsFromPixels(pixels([WHITE, 900], [GREY, 100], [dark, 300]));
    expect(out).toEqual(["#464646"]);
  });

  it("returns black for a black-only logo", () => {
    expect(dominantColorsFromPixels(pixels([CLEAR, 900], [BLACK, 100]))).toEqual(["#050505"]);
  });

  it("returns nothing for a white, transparent or empty image", () => {
    expect(dominantColorsFromPixels(pixels([WHITE, 100], [CLEAR, 100]))).toEqual([]);
    expect(dominantColorsFromPixels(new Uint8ClampedArray(0))).toEqual([]);
  });

  it("is deterministic", () => {
    const data = pixels([RED, 120], [BLUE, 120], [GREEN, 120], [ORANGE, 120]);
    expect(dominantColorsFromPixels(data)).toEqual(dominantColorsFromPixels(data));
  });
});
