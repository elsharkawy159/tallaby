import { describe, expect, it } from "vitest";
import {
  ORDER_GRACE_START_FLOOR,
  ORDERS_UNLOCKED,
  SHORT_GRACE_FROM,
  daysUntilOffline,
  graceDaysLeft,
  isActivated,
  isShortGraceSeller,
  orderGraceDays,
  orderGraceStart,
  orderLockState,
  storeMayBeBillingOffline,
  trialDaysOver,
} from "./order-lock.lib";

const DAY = 86_400_000;
const FLOOR = new Date(ORDER_GRACE_START_FLOOR).getTime();
/** A seller who signed up after the floor and before SHORT_GRACE_FROM: their own sign-up starts a 14-day window. */
const SIGNUP = "2026-11-12T10:00:00.000Z";
const SIGNUP_MS = Date.parse(SIGNUP);
const iso = (ms: number) => new Date(ms).toISOString();

const free = { plan: "free", planExpiresAt: null, planGraceUntil: null, createdAt: SIGNUP };
const base = {
  usdLive: true,
  seller: free,
  hasTopUp: false,
  hasHadPositiveBalance: false,
  hasPendingManualTopUp: false,
  firstOrders: [] as { id: string; createdAt: string }[],
  at: new Date(SIGNUP_MS + 3 * DAY),
};
const order = (id: string, ms: number) => ({ id, createdAt: iso(ms) });

describe("activation", () => {
  it("changes nothing before the USD switch", () => {
    expect(orderLockState({ ...base, usdLive: false, at: new Date(SIGNUP_MS + 40 * DAY) })).toEqual(ORDERS_UNLOCKED);
    expect(isActivated({ ...base, usdLive: false })).toBe(true);
  });

  it("a seller who never topped up is locked from the start, with no order shown (owner, 2026-11-16)", () => {
    const lock = orderLockState(base);
    expect(lock.activated).toBe(false);
    expect(lock.ordersLocked).toBe(true);
    expect(lock.firstOrderId).toBeNull();
    expect(lock.grace).toEqual({ endsAt: iso(SIGNUP_MS + 14 * DAY), firstOrderReceived: false, endedBy: null, offlineAt: iso(SIGNUP_MS + 14 * DAY) });
    expect(lock.storeOffline).toBe(false);
  });

  it("activates for good after one approved top-up, even past the window", () => {
    const late = { ...base, at: new Date(SIGNUP_MS + 40 * DAY), firstOrders: [order("a", SIGNUP_MS + DAY), order("b", SIGNUP_MS + 2 * DAY)] };
    expect(orderLockState({ ...late, hasTopUp: true })).toEqual(ORDERS_UNLOCKED);
    expect(orderLockState({ ...late, hasTopUp: true, hasPendingManualTopUp: true })).toEqual(ORDERS_UNLOCKED);
  });

  it("activates for good once the balance has been above zero", () => {
    expect(orderLockState({ ...base, hasHadPositiveBalance: true, at: new Date(SIGNUP_MS + 40 * DAY) })).toEqual(ORDERS_UNLOCKED);
  });

  it("exempts active Pro, including admin-granted Pro with no end date", () => {
    const at = new Date(SIGNUP_MS + 40 * DAY);
    expect(orderLockState({ ...base, seller: { ...free, plan: "pro" }, at })).toEqual(ORDERS_UNLOCKED);
    const paid = { ...free, plan: "pro", planExpiresAt: iso(SIGNUP_MS + 60 * DAY) };
    expect(orderLockState({ ...base, seller: paid, at })).toEqual(ORDERS_UNLOCKED);
  });

  it("an ended Pro with no top-up is back on the grace rule", () => {
    const ended = { ...free, plan: "pro", planExpiresAt: iso(SIGNUP_MS + 5 * DAY) };
    const lock = orderLockState({ ...base, seller: ended, at: new Date(SIGNUP_MS + 20 * DAY) });
    expect(lock.activated).toBe(false);
    expect(lock.ordersLocked).toBe(true);
  });

  it("doesn't lock when the seller row is missing", () => {
    expect(orderLockState({ ...base, seller: null })).toEqual(ORDERS_UNLOCKED);
  });
});

describe("grace window (dates only; orders are locked all along)", () => {
  it("stays open through day 14, while orders are already locked", () => {
    const lock = orderLockState({ ...base, at: new Date(SIGNUP_MS + 14 * DAY - 1) });
    expect(lock.ordersLocked).toBe(true);
    expect(lock.grace?.endedBy).toBeNull();
    expect(graceDaysLeft(lock.grace!, new Date(SIGNUP_MS + 14 * DAY - 1))).toBe(1);
    expect(graceDaysLeft(lock.grace!, new Date(SIGNUP_MS + 3 * DAY))).toBe(11);
  });

  it("closes on day 15 with no orders, and says why", () => {
    const lock = orderLockState({ ...base, at: new Date(SIGNUP_MS + 14 * DAY) });
    expect(lock).toMatchObject({ activated: false, ordersLocked: true, firstOrderId: null });
    expect(lock.grace).toMatchObject({ endedBy: "days", firstOrderReceived: false });
    expect(graceDaysLeft(lock.grace!, new Date(SIGNUP_MS + 14 * DAY))).toBe(0);
  });

  it("the first order inside the window keeps it open but is not shown", () => {
    const lock = orderLockState({ ...base, firstOrders: [order("first", SIGNUP_MS + DAY)] });
    expect(lock.ordersLocked).toBe(true);
    expect(lock.firstOrderId).toBeNull();
    expect(lock.grace).toMatchObject({ firstOrderReceived: true, endedBy: null, endsAt: iso(SIGNUP_MS + 14 * DAY) });
  });

  it("the second order closes the window at once; no order is shown", () => {
    const second = SIGNUP_MS + 2 * DAY;
    const lock = orderLockState({ ...base, firstOrders: [order("first", SIGNUP_MS + DAY), order("second", second)] });
    expect(lock).toMatchObject({ activated: false, ordersLocked: true, firstOrderId: null });
    expect(lock.grace).toEqual({ endsAt: iso(second), firstOrderReceived: true, endedBy: "second_order", offlineAt: iso(SIGNUP_MS + 14 * DAY) });
  });

  it("after day 14, still no order is shown", () => {
    const lock = orderLockState({ ...base, at: new Date(SIGNUP_MS + 30 * DAY), firstOrders: [order("first", SIGNUP_MS + 20 * DAY)] });
    expect(lock).toMatchObject({ ordersLocked: true, firstOrderId: null });
    expect(lock.grace?.endedBy).toBe("days");
  });

  it("says a manual top-up is in review", () => {
    const lock = orderLockState({ ...base, hasPendingManualTopUp: true, at: new Date(SIGNUP_MS + 20 * DAY) });
    expect(lock).toMatchObject({ ordersLocked: true, pendingReview: true });
  });

  it("a seller from before 2026-11-09 gets 14 days from the floor, and older orders don't count", () => {
    expect(orderGraceStart("2026-10-01T00:00:00Z").getTime()).toBe(FLOOR);
    expect(orderGraceStart(null).getTime()).toBe(FLOOR);
    expect(orderGraceStart(SIGNUP).getTime()).toBe(SIGNUP_MS);

    const old = { ...free, createdAt: "2026-10-01T00:00:00Z" };
    const lock = orderLockState({
      ...base,
      seller: old,
      at: new Date(FLOOR + 13 * DAY),
      firstOrders: [order("old-1", FLOOR - 5 * DAY), order("old-2", FLOOR - 4 * DAY)],
    });
    expect(lock).toMatchObject({ ordersLocked: true, firstOrderId: null });
    expect(lock.grace).toMatchObject({ endsAt: iso(FLOOR + 14 * DAY), endedBy: null, firstOrderReceived: false });
    expect(orderLockState({ ...base, seller: old, at: new Date(FLOOR + 14 * DAY) }).grace?.endedBy).toBe("days");
  });
});

describe("short window (sellers from SHORT_GRACE_FROM)", () => {
  const CUTOFF = Date.parse(SHORT_GRACE_FROM);
  const NEW_SIGNUP = CUTOFF + 3 * 3_600_000;
  const fresh = { ...free, createdAt: iso(NEW_SIGNUP) };
  const at = (ms: number) => new Date(ms);
  const state = (overrides: Partial<typeof base> = {}) => orderLockState({ ...base, seller: fresh, ...overrides });

  it("a seller from before the cutoff keeps 14 days; only the length differs", () => {
    expect(isShortGraceSeller(SIGNUP)).toBe(false);
    expect(orderGraceDays(SIGNUP)).toBe(14);
    expect(orderGraceDays(iso(NEW_SIGNUP))).toBe(7);
    const day8 = orderLockState({ ...base, at: at(SIGNUP_MS + 8 * DAY) });
    expect(day8).toMatchObject({ ordersLocked: true, storeOffline: false });
    expect(day8.grace?.offlineAt).toBe(iso(SIGNUP_MS + 14 * DAY));
    expect(storeMayBeBillingOffline(SIGNUP, at(SIGNUP_MS + 8 * DAY))).toBe(false);
  });

  it("an unknown sign-up time gets 14 days from the floor", () => {
    expect(isShortGraceSeller(null)).toBe(false);
    expect(isShortGraceSeller("not a date")).toBe(false);
    expect(storeMayBeBillingOffline(null, at(FLOOR + 14 * DAY - 1))).toBe(false);
    expect(storeMayBeBillingOffline(null, at(FLOOR + 14 * DAY))).toBe(true);
    expect(storeMayBeBillingOffline("not a date", at(FLOOR + 14 * DAY))).toBe(true);
  });

  it("a seller created exactly at the cutoff is on the short rule; a millisecond earlier is not", () => {
    expect(isShortGraceSeller(iso(CUTOFF))).toBe(true);
    expect(isShortGraceSeller(iso(CUTOFF - 1))).toBe(false);
    const lock = orderLockState({ ...base, seller: { ...free, createdAt: iso(CUTOFF) }, at: at(CUTOFF + 7 * DAY) });
    expect(lock).toMatchObject({ ordersLocked: true, storeOffline: true });
  });

  it("is online through day 7 and offline once 7 days have passed", () => {
    const day6 = state({ at: at(NEW_SIGNUP + 7 * DAY - 1) });
    expect(day6).toMatchObject({ activated: false, ordersLocked: true, firstOrderId: null, storeOffline: false });
    expect(day6.grace).toEqual({ endsAt: iso(NEW_SIGNUP + 7 * DAY), firstOrderReceived: false, endedBy: null, offlineAt: iso(NEW_SIGNUP + 7 * DAY) });
    expect(graceDaysLeft(day6.grace!, at(NEW_SIGNUP + 3 * DAY))).toBe(4);
    expect(storeMayBeBillingOffline(iso(NEW_SIGNUP), at(NEW_SIGNUP + 7 * DAY - 1))).toBe(false);

    const day7 = state({ at: at(NEW_SIGNUP + 7 * DAY) });
    expect(day7).toMatchObject({ ordersLocked: true, storeOffline: true });
    expect(day7.grace?.endedBy).toBe("days");
    expect(storeMayBeBillingOffline(iso(NEW_SIGNUP), at(NEW_SIGNUP + 7 * DAY))).toBe(true);
  });

  it("the second order on day 2 keeps the store online until the days run out", () => {
    const firstOrders = [order("first", NEW_SIGNUP + DAY), order("second", NEW_SIGNUP + 2 * DAY)];
    const day3 = state({ firstOrders, at: at(NEW_SIGNUP + 3 * DAY) });
    expect(day3).toMatchObject({ ordersLocked: true, storeOffline: false, firstOrderId: null });
    expect(day3.grace).toMatchObject({ endedBy: "second_order", offlineAt: iso(NEW_SIGNUP + 7 * DAY) });
    expect(daysUntilOffline(day3.grace!, at(NEW_SIGNUP + 3 * DAY))).toBe(4);
    expect(state({ firstOrders, at: at(NEW_SIGNUP + 7 * DAY) }).storeOffline).toBe(true);
  });

  it("activation brings the store back online", () => {
    const late = at(NEW_SIGNUP + 20 * DAY);
    expect(state({ at: late, hasTopUp: true })).toEqual(ORDERS_UNLOCKED);
    expect(state({ at: late, hasHadPositiveBalance: true }).storeOffline).toBe(false);
    expect(state({ at: late, seller: { ...fresh, plan: "pro" } }).storeOffline).toBe(false);
  });

  it("a manual top-up in review keeps the store online (orders stay hidden)", () => {
    const lock = state({ at: at(NEW_SIGNUP + 20 * DAY), hasPendingManualTopUp: true });
    expect(lock).toMatchObject({ ordersLocked: true, pendingReview: true, storeOffline: false });
  });

  it("nothing applies before the USD switch", () => {
    expect(state({ usdLive: false, at: at(NEW_SIGNUP + 20 * DAY) })).toEqual(ORDERS_UNLOCKED);
  });
});

describe("14-day sellers go offline too (owner, 2026-11-17; docs/seller-top-up-rules.md)", () => {
  /** Signed up 2026-11-01: counts from the floor (2026-11-09 00:00 Cairo), so the days end 2026-11-23 00:00 Cairo. */
  const old = { ...free, createdAt: "2026-11-01T09:00:00+02:00" };
  const END = Date.parse("2026-11-23T00:00:00+02:00");
  const at = (ms: number) => new Date(ms);
  const state = (overrides: Partial<typeof base> = {}) => orderLockState({ ...base, seller: old, ...overrides });

  it("the days end 14 days after the floor", () => {
    expect(FLOOR + 14 * DAY).toBe(END);
    expect(state({ at: at(END - DAY) }).grace?.offlineAt).toBe(iso(END));
  });

  it("is online and counting down the day before", () => {
    const now = at(END - DAY);
    const lock = state({ at: now });
    expect(lock).toMatchObject({ activated: false, ordersLocked: true, storeOffline: false });
    expect(lock.grace?.endedBy).toBeNull();
    expect(daysUntilOffline(lock.grace!, now)).toBe(1);
    expect(trialDaysOver(lock, now)).toBe(false);
    expect(storeMayBeBillingOffline(old.createdAt, now)).toBe(false);
    // The last millisecond is still online.
    expect(state({ at: at(END - 1) }).storeOffline).toBe(false);
    expect(storeMayBeBillingOffline(old.createdAt, at(END - 1))).toBe(false);
  });

  it("goes offline the moment the days end, and AI stops", () => {
    const now = at(END);
    const lock = state({ at: now });
    expect(lock).toMatchObject({ activated: false, ordersLocked: true, storeOffline: true });
    expect(lock.grace).toMatchObject({ endedBy: "days", offlineAt: iso(END) });
    expect(daysUntilOffline(lock.grace!, now)).toBe(0);
    expect(trialDaysOver(lock, now)).toBe(true);
    expect(storeMayBeBillingOffline(old.createdAt, now)).toBe(true);
    expect(state({ at: at(END + 40 * DAY) }).storeOffline).toBe(true);
  });

  it("the second order never takes the store offline before the days end", () => {
    const firstOrders = [order("first", FLOOR + DAY), order("second", FLOOR + 2 * DAY)];
    const before = state({ firstOrders, at: at(END - DAY) });
    expect(before.grace).toMatchObject({ endedBy: "second_order", offlineAt: iso(END) });
    expect(before.storeOffline).toBe(false);
    expect(trialDaysOver(before, at(END - DAY))).toBe(false);
    expect(state({ firstOrders, at: at(END) }).storeOffline).toBe(true);
  });

  it("a manual top-up in review keeps the stores online, but AI stays stopped", () => {
    const now = at(END + 3 * DAY);
    const lock = state({ at: now, hasPendingManualTopUp: true });
    expect(lock).toMatchObject({ activated: false, ordersLocked: true, pendingReview: true, storeOffline: false });
    expect(trialDaysOver(lock, now)).toBe(true);
    // Rejected: offline again.
    expect(state({ at: now, hasPendingManualTopUp: false }).storeOffline).toBe(true);
    // In review during the trial changes nothing.
    expect(state({ at: at(END - DAY), hasPendingManualTopUp: true }).storeOffline).toBe(false);
  });

  it("an activated seller is never affected", () => {
    const late = at(END + 40 * DAY);
    for (const lock of [
      state({ at: late, hasTopUp: true }),
      state({ at: late, hasHadPositiveBalance: true }),
      state({ at: late, seller: { ...old, plan: "pro" } }),
    ]) {
      expect(lock).toEqual(ORDERS_UNLOCKED);
      expect(trialDaysOver(lock, late)).toBe(false);
    }
  });

  it("nothing applies before the USD switch", () => {
    const late = at(END + 40 * DAY);
    const lock = state({ usdLive: false, at: late });
    expect(lock).toEqual(ORDERS_UNLOCKED);
    expect(trialDaysOver(lock, late)).toBe(false);
  });

  it("a seller created 2026-11-17 has 7 days from sign-up", () => {
    const created = "2026-11-17T10:00:00+02:00";
    const end = Date.parse(created) + 7 * DAY;
    const fresh = { ...free, createdAt: created };
    const before = orderLockState({ ...base, seller: fresh, at: at(end - 1) });
    expect(before.storeOffline).toBe(false);
    expect(trialDaysOver(before, at(end - 1))).toBe(false);
    const after = orderLockState({ ...base, seller: fresh, at: at(end) });
    expect(after.storeOffline).toBe(true);
    expect(trialDaysOver(after, at(end))).toBe(true);
    expect(storeMayBeBillingOffline(created, at(end))).toBe(true);
  });
});
