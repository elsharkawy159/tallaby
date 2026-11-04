import { describe, expect, it } from "vitest";
import { carouselCardStyle, carouselOffset, ordersAfter, sparkPaths, wrapIndex, type DemoOrder } from "./home-demo.lib";

describe("sparkPaths", () => {
  it("draws nothing for no values", () => {
    expect(sparkPaths([])).toEqual({ line: "", area: "" });
  });

  it("runs from the left edge to the right edge and closes the area", () => {
    const { line, area } = sparkPaths([1, 2, 3], 200, 34);
    expect(line.startsWith("M0.0,")).toBe(true);
    expect(line).toContain("L200.0,");
    expect(area.endsWith("L200,34L0,34Z")).toBe(true);
  });

  it("copes with a flat line", () => {
    expect(sparkPaths([5, 5]).line).not.toContain("NaN");
  });
});

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

describe("ordersAfter", () => {
  const base: DemoOrder[] = [1, 2, 3, 4, 5].map((id) => ({ id, customer: "c", product: "p", when: "old", total: 1, status: "delivered" }));
  const make = (i: number) => ({ customer: `n${i}`, product: "p", total: 10 });

  it("keeps the base list before any new order", () => {
    expect(ordersAfter(base, 0, make, 100)).toEqual(base);
  });

  it("puts new orders first and keeps the list length", () => {
    const list = ordersAfter(base, 2, make, 100);
    expect(list).toHaveLength(5);
    expect(list[0]).toMatchObject({ id: 101, customer: "n1", when: "justNow", status: "pending" });
    expect(list[1]).toMatchObject({ id: 100, when: "minuteAgo" });
    expect(list[2]!.id).toBe(1);
  });

  it("stays bounded however many orders came in", () => {
    const list = ordersAfter(base, 1000, make, 100);
    expect(list).toHaveLength(5);
    expect(list[0]!.id).toBe(1099);
  });
});
