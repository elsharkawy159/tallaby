import { describe, expect, it } from "vitest";
import { isCouponLive, rankBySales, ratingStats, reviewAuthorName } from "./catalog-data.lib";

describe("reviewAuthorName", () => {
  it("shows the first name only, never for anonymous reviews", () => {
    expect(reviewAuthorName("Sara Ahmed Ali", false)).toBe("Sara");
    expect(reviewAuthorName("  سارة   أحمد ", false)).toBe("سارة");
    expect(reviewAuthorName("Sara Ahmed", true)).toBeNull();
    expect(reviewAuthorName(null, false)).toBeNull();
    expect(reviewAuthorName("   ", false)).toBeNull();
  });
});

describe("ratingStats", () => {
  it("averages real ratings and ignores invalid ones", () => {
    expect(ratingStats([5, 4, 4, 0, 6, 3.5])).toEqual({ average: 4.3, count: 3, distribution: { "1": 0, "2": 0, "3": 0, "4": 2, "5": 1 } });
    expect(ratingStats([])).toEqual({ average: 0, count: 0, distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } });
  });
});

describe("rankBySales", () => {
  it("orders by units sold, keeps input order on ties, and drops unsold products", () => {
    const units = new Map([
      ["b", 3],
      ["c", 3],
      ["d", 9],
    ]);
    expect(rankBySales(["a", "b", "c", "d"], units)).toEqual(["d", "b", "c"]);
    expect(rankBySales(["a"], new Map())).toEqual([]);
  });
});

describe("isCouponLive", () => {
  const now = Date.parse("2026-10-18T12:00:00Z");
  const base = { isActive: true, startsAt: "2026-10-01T00:00:00Z", expiresAt: "2026-11-01T00:00:00Z", usageLimit: null, usageCount: 0 };
  it("is live only when active, started, unexpired and with uses left", () => {
    expect(isCouponLive(base, now)).toBe(true);
    expect(isCouponLive({ ...base, isActive: false }, now)).toBe(false);
    expect(isCouponLive({ ...base, startsAt: "2026-10-20T00:00:00Z" }, now)).toBe(false);
    expect(isCouponLive({ ...base, expiresAt: "2026-10-18T12:00:00Z" }, now)).toBe(false);
    expect(isCouponLive({ ...base, usageLimit: 5, usageCount: 5 }, now)).toBe(false);
  });
});
