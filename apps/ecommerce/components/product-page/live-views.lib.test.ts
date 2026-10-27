import { describe, expect, it } from "vitest";
import { liveViewsBase, nextLiveViews } from "./live-views.lib";

describe("live views", () => {
  it("starts from a stable number per product", () => {
    const id = "6f1c2a9e-1b2c-4d5e-8f90-123456789abc";
    expect(liveViewsBase(id)).toBe(liveViewsBase(id));
    for (const sample of [id, "a", "another-product-id", ""]) {
      const base = liveViewsBase(sample);
      expect(base).toBeGreaterThanOrEqual(6);
      expect(base).toBeLessThanOrEqual(35);
    }
  });

  it("drifts by at most 2 and stays in the band around the base", () => {
    expect(nextLiveViews(10, 10, 0)).toBe(8);
    expect(nextLiveViews(10, 10, 0.99)).toBe(12);
    expect(nextLiveViews(18, 10, 0.99)).toBe(18);
    expect(nextLiveViews(2, 10, 0)).toBe(2);
    expect(nextLiveViews(3, 6, 0)).toBe(2);
  });
});
