import { describe, expect, it } from "vitest";
import {
  ORDER_GRACE_START_FLOOR,
  ORDERS_UNLOCKED,
  graceDaysLeft,
  isActivated,
  orderGraceStart,
  orderLockState,
} from "./order-lock.lib";

const DAY = 86_400_000;
const FLOOR = new Date(ORDER_GRACE_START_FLOOR).getTime();
/** A seller who signed up after the floor, so their own sign-up starts the window. */
const SIGNUP = "2026-11-20T10:00:00.000Z";
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

  it("a seller who never topped up isn't activated, but their orders are open during grace", () => {
    const lock = orderLockState(base);
    expect(lock.activated).toBe(false);
    expect(lock.ordersLocked).toBe(false);
    expect(lock.grace).toEqual({ endsAt: iso(SIGNUP_MS + 14 * DAY), firstOrderReceived: false, endedBy: null });
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

describe("grace window", () => {
  it("stays open through day 14", () => {
    const lock = orderLockState({ ...base, at: new Date(SIGNUP_MS + 14 * DAY - 1) });
    expect(lock.ordersLocked).toBe(false);
    expect(graceDaysLeft(lock.grace!, new Date(SIGNUP_MS + 14 * DAY - 1))).toBe(1);
    expect(graceDaysLeft(lock.grace!, new Date(SIGNUP_MS + 3 * DAY))).toBe(11);
  });

  it("closes on day 15 with no orders, and says why", () => {
    const lock = orderLockState({ ...base, at: new Date(SIGNUP_MS + 14 * DAY) });
    expect(lock).toMatchObject({ activated: false, ordersLocked: true, firstOrderId: null });
    expect(lock.grace).toMatchObject({ endedBy: "days", firstOrderReceived: false });
    expect(graceDaysLeft(lock.grace!, new Date(SIGNUP_MS + 14 * DAY))).toBe(0);
  });

  it("the first order inside the window keeps it open and is remembered", () => {
    const lock = orderLockState({ ...base, firstOrders: [order("first", SIGNUP_MS + DAY)] });
    expect(lock.ordersLocked).toBe(false);
    expect(lock.firstOrderId).toBe("first");
    expect(lock.grace).toMatchObject({ firstOrderReceived: true, endedBy: null, endsAt: iso(SIGNUP_MS + 14 * DAY) });
  });

  it("the second order closes the window at once; the first stays visible", () => {
    const second = SIGNUP_MS + 2 * DAY;
    const lock = orderLockState({ ...base, firstOrders: [order("first", SIGNUP_MS + DAY), order("second", second)] });
    expect(lock).toMatchObject({ activated: false, ordersLocked: true, firstOrderId: "first" });
    expect(lock.grace).toEqual({ endsAt: iso(second), firstOrderReceived: true, endedBy: "second_order" });
  });

  it("after day 14, the first order is still the one shown", () => {
    const lock = orderLockState({ ...base, at: new Date(SIGNUP_MS + 30 * DAY), firstOrders: [order("first", SIGNUP_MS + 20 * DAY)] });
    expect(lock).toMatchObject({ ordersLocked: true, firstOrderId: "first" });
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
    expect(lock).toMatchObject({ ordersLocked: false, firstOrderId: null });
    expect(lock.grace?.endsAt).toBe(iso(FLOOR + 14 * DAY));
    expect(orderLockState({ ...base, seller: old, at: new Date(FLOOR + 14 * DAY) }).ordersLocked).toBe(true);
  });
});
