import { describe, expect, it } from "vitest";
import { carouselCardStyle, carouselOffset, wrapIndex } from "./home-demo.lib";

describe("carousel maths", () => {
  it("wraps indexes both ways", () => {
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(7, 5)).toBe(2);
    expect(wrapIndex(3, 0)).toBe(0);
  });

  it("takes the short way round", () => {
    expect(carouselOffset(0, 4, 5)).toBe(1);
    expect(carouselOffset(4, 0, 5)).toBe(-1);
    expect(carouselOffset(2, 2, 5)).toBe(0);
  });

  it("fades and shrinks cards away from the centre", () => {
    expect(carouselCardStyle(0)).toEqual({ scale: 1, opacity: 1, zIndex: 10 });
    expect(carouselCardStyle(1).scale).toBeCloseTo(0.87);
    expect(carouselCardStyle(3).opacity).toBe(0);
  });
});
