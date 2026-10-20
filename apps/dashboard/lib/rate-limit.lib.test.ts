import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit.lib";

describe("createRateLimiter", () => {
  it("allows up to the limit inside the window, then refuses", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect([1, 2, 3, 4].map(() => limiter.check("ip", 0))).toEqual([true, true, true, false]);
  });

  it("allows again once the window has passed", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check("ip", 0)).toBe(true);
    expect(limiter.check("ip", 999)).toBe(false);
    expect(limiter.check("ip", 1000)).toBe(true);
  });

  it("tracks keys separately", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check("a", 0)).toBe(true);
    expect(limiter.check("b", 0)).toBe(true);
    expect(limiter.check("a", 1)).toBe(false);
  });

  it("does not grow without bound", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 10 });
    for (let i = 0; i < 100; i++) limiter.check(`k${i}`, 0);
    expect(limiter.size()).toBeLessThanOrEqual(10);
  });
});
