import { describe, expect, it } from "vitest";
import { ORDERS_UNLOCKED, orderLockState } from "./order-lock.lib";

const free = { plan: "free", planExpiresAt: null, planGraceUntil: null };
const base = { usdLive: true, seller: free, hasTopUp: false, hasHadPositiveBalance: false, hasPendingManualTopUp: false };
const at = new Date("2026-11-04T12:00:00Z");

describe("order lock", () => {
  it("locks a seller who has never topped up", () => {
    expect(orderLockState(base)).toEqual({ locked: true, pendingReview: false });
  });

  it("changes nothing before the USD switch", () => {
    expect(orderLockState({ ...base, usdLive: false })).toEqual(ORDERS_UNLOCKED);
  });

  it("unlocks for good after one approved top-up", () => {
    expect(orderLockState({ ...base, hasTopUp: true })).toEqual(ORDERS_UNLOCKED);
    expect(orderLockState({ ...base, hasTopUp: true, hasPendingManualTopUp: true })).toEqual(ORDERS_UNLOCKED);
  });

  it("unlocks for good once the balance has been above zero, with no top-up", () => {
    expect(orderLockState({ ...base, hasHadPositiveBalance: true })).toEqual(ORDERS_UNLOCKED);
    expect(orderLockState({ ...base, hasHadPositiveBalance: true, hasPendingManualTopUp: true })).toEqual(ORDERS_UNLOCKED);
  });

  it("stays locked with neither a top-up nor a balance ever above zero", () => {
    expect(orderLockState({ ...base, hasHadPositiveBalance: false }).locked).toBe(true);
    expect(orderLockState({ ...base, hasHadPositiveBalance: false, hasTopUp: true }).locked).toBe(false);
  });

  it("stays locked while a manual top-up waits, and says so", () => {
    expect(orderLockState({ ...base, hasPendingManualTopUp: true })).toEqual({ locked: true, pendingReview: true });
  });

  it("exempts active Pro, including admin-granted Pro with no end date", () => {
    expect(orderLockState({ ...base, seller: { ...free, plan: "pro" }, at })).toEqual(ORDERS_UNLOCKED);
    const paid = { ...free, plan: "pro", planExpiresAt: "2026-12-01T00:00:00Z" };
    expect(orderLockState({ ...base, seller: paid, at })).toEqual(ORDERS_UNLOCKED);
  });

  it("locks once Pro has ended and there was never a top-up", () => {
    const ended = { ...free, plan: "pro", planExpiresAt: "2026-10-01T00:00:00Z" };
    expect(orderLockState({ ...base, seller: ended, at }).locked).toBe(true);
  });

  it("doesn't lock when the seller row is missing", () => {
    expect(orderLockState({ ...base, seller: null })).toEqual(ORDERS_UNLOCKED);
  });
});
