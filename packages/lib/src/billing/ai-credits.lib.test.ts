import { describe, expect, it } from "vitest";
import { aiCreditAllowance, nextMonthlyCredits } from "./ai-credits.lib";

describe("aiCreditAllowance", () => {
  const base = { isPro: false, planExpiresAt: null, locked: false, month: "2026-11" };

  it("gives Free its normal allowance when activated", () => {
    expect(aiCreditAllowance(base)).toEqual({ plan: "free", allowance: 100, period: "free:2026-11", notActivated: false });
  });

  it("gives 20 under its own key when locked", () => {
    expect(aiCreditAllowance({ ...base, locked: true })).toEqual({ plan: "free", allowance: 20, period: "free-locked:2026-11", notActivated: true });
  });

  it("ignores the lock on Pro", () => {
    const pro = aiCreditAllowance({ ...base, isPro: true, planExpiresAt: "2026-12-01", locked: true });
    expect(pro).toEqual({ plan: "pro", allowance: 2000, period: "pro:2026-12-01", notActivated: false });
  });
});

describe("nextMonthlyCredits", () => {
  const move = (previousPeriod: string | null, remaining: number, nextPeriod: string, allowance: number, usedSinceGrant: number | null = null) =>
    nextMonthlyCredits({ previousPeriod, remaining, nextPeriod, allowance, usedSinceGrant });

  it("loads the full allowance on a first load, a new month, or from Pro", () => {
    expect(move(null, 0, "free-locked:2026-11", 20)).toBe(20);
    expect(move("free:2026-10", 3, "free-locked:2026-11", 20)).toBe(20);
    expect(move("free-locked:2026-10", 3, "free:2026-11", 100)).toBe(100);
    expect(move("pro:2026-11-01", 900, "free:2026-11", 100)).toBe(100);
  });

  it("loads Free straight away when a locked seller activates mid-month", () => {
    expect(move("free-locked:2026-11", 4, "free:2026-11", 100)).toBe(100);
  });

  it("caps instead of resetting when going locked in the same month", () => {
    expect(move("free:2026-11", 80, "free-locked:2026-11", 20)).toBe(20);
    expect(move("free:2026-11", 7, "free-locked:2026-11", 20)).toBe(7);
    expect(move("free:2026-11", 0, "free-locked:2026-11", 20)).toBe(0);
  });

  it("doesn't refill when the same month's Free comes back", () => {
    // 100 loaded, 25 used across both states: 75 is what the month still has.
    expect(move("free-locked:2026-11", 15, "free:2026-11", 100, 25)).toBe(75);
    expect(move("free-locked:2026-11", 0, "free:2026-11", 100, 100)).toBe(0);
    expect(move("free-locked:2026-11", 3, "free:2026-11", 100, 140)).toBe(3);
  });
});
