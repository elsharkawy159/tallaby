import { describe, expect, it } from "vitest";
import { orderLockState } from "@workspace/lib/billing/order-grace";
import { isSellerTrialState, sellerTrialBadge, sellerTrialStatus } from "./seller-trial.lib";

const base = { usdLive: true, activated: false, hasPendingManualTopUp: false };

describe("sellerTrialStatus", () => {
  it("is activated, with no end, for an activated seller", () => {
    expect(
      sellerTrialStatus({ ...base, activated: true, createdAt: "2026-11-01T10:00:00Z", at: new Date("2026-12-31T00:00:00Z") }),
    ).toEqual({ state: "activated", endsAt: null });
  });

  it("is activated while the USD switch is off", () => {
    expect(
      sellerTrialStatus({ ...base, usdLive: false, createdAt: "2026-11-01T10:00:00Z", at: new Date("2026-12-31T00:00:00Z") }),
    ).toEqual({ state: "activated", endsAt: null });
  });

  it("gives a seller from before 2026-11-16 14 days from the 2026-11-09 Cairo floor", () => {
    const createdAt = "2026-10-01T10:00:00Z";
    const endsAt = "2026-11-22T22:00:00.000Z"; // 2026-11-23 00:00 Cairo
    expect(sellerTrialStatus({ ...base, createdAt, at: new Date("2026-11-22T21:59:59Z") })).toEqual({ state: "in_trial", endsAt });
    expect(sellerTrialStatus({ ...base, createdAt, at: new Date(endsAt) })).toEqual({ state: "offline", endsAt });
  });

  it("counts 14 days from sign-up for a seller between the floor and 2026-11-16", () => {
    expect(sellerTrialStatus({ ...base, createdAt: "2026-11-12T08:00:00Z", at: new Date("2026-11-20T00:00:00Z") })).toEqual({
      state: "in_trial",
      endsAt: "2026-11-26T08:00:00.000Z",
    });
  });

  it("gives a seller from 2026-11-16 Cairo on 7 days from sign-up", () => {
    const createdAt = "2026-11-17T09:00:00Z";
    const endsAt = "2026-11-24T09:00:00.000Z";
    expect(sellerTrialStatus({ ...base, createdAt, at: new Date("2026-11-24T08:59:59Z") })).toEqual({ state: "in_trial", endsAt });
    expect(sellerTrialStatus({ ...base, createdAt, at: new Date("2026-11-24T09:00:00Z") })).toEqual({ state: "offline", endsAt });
  });

  it("keeps the stores online while a manual top-up is in review after the trial", () => {
    const at = new Date("2026-12-01T00:00:00Z");
    expect(sellerTrialStatus({ ...base, hasPendingManualTopUp: true, createdAt: "2026-11-17T09:00:00Z", at }).state).toBe("in_review");
    // During the trial a top-up in review changes nothing.
    expect(
      sellerTrialStatus({ ...base, hasPendingManualTopUp: true, createdAt: "2026-11-17T09:00:00Z", at: new Date("2026-11-18T00:00:00Z") }).state,
    ).toBe("in_trial");
  });

  it("agrees with orderLockState's storeOffline and offlineAt", () => {
    const at = new Date("2026-11-25T00:00:00Z");
    for (const createdAt of [null, "2026-10-01T10:00:00Z", "2026-11-15T21:59:59Z", "2026-11-15T22:00:00Z", "2026-11-20T12:00:00Z"]) {
      for (const hasPendingManualTopUp of [false, true]) {
        const lock = orderLockState({
          usdLive: true,
          seller: { plan: "free", planExpiresAt: null, planGraceUntil: null, createdAt },
          hasTopUp: false,
          hasHadPositiveBalance: false,
          hasPendingManualTopUp,
          firstOrders: [],
          at,
        });
        const status = sellerTrialStatus({ ...base, hasPendingManualTopUp, createdAt, at });
        expect(status.endsAt).toBe(lock.grace?.offlineAt);
        expect(status.state === "offline").toBe(lock.storeOffline);
      }
    }
  });

  it("knows its states", () => {
    expect(isSellerTrialState("offline")).toBe(true);
    expect(isSellerTrialState("nope")).toBe(false);
  });
});

describe("sellerTrialBadge", () => {
  const endsAt = "2026-11-22T22:00:00.000Z"; // 2026-11-23 00:00 Cairo

  it("shows nothing for an activated seller or no status", () => {
    expect(sellerTrialBadge({ state: "activated", endsAt: null })).toBeNull();
    expect(sellerTrialBadge(undefined)).toBeNull();
  });

  it("counts whole days left, rounded up, with the Cairo offline day", () => {
    const badge = sellerTrialBadge({ state: "in_trial", endsAt }, new Date("2026-11-19T12:00:00Z"));
    expect(badge).toEqual({
      tone: "in_trial",
      label: "4 days left · offline Nov 23, 2026",
      title: "Trial ends Nov 23, 2026; every store goes offline unless the seller tops up",
    });
  });

  it("turns amber at two days or less and says 1 day in the last day", () => {
    expect(sellerTrialBadge({ state: "in_trial", endsAt }, new Date("2026-11-20T22:00:00Z"))).toMatchObject({
      tone: "soon",
      label: "2 days left · offline Nov 23, 2026",
    });
    expect(sellerTrialBadge({ state: "in_trial", endsAt }, new Date("2026-11-22T21:00:00Z"))).toMatchObject({
      tone: "soon",
      label: "1 day left · offline Nov 23, 2026",
    });
    // A server-read in_trial state is never shown as 0 days on a later clock.
    expect(sellerTrialBadge({ state: "in_trial", endsAt }, new Date("2026-11-23T01:00:00Z"))?.label).toBe(
      "1 day left · offline Nov 23, 2026",
    );
  });

  it("says when the trial ended and the stores went offline", () => {
    expect(sellerTrialBadge({ state: "offline", endsAt })).toEqual({
      tone: "offline",
      label: "Trial ended · stores offline since Nov 23, 2026",
      title: "Trial ended Nov 23, 2026 with no top-up: every store is offline",
    });
  });

  it("keeps the top-up in review wording", () => {
    expect(sellerTrialBadge({ state: "in_review", endsAt })?.label).toBe("Top-up in review · Nov 23, 2026");
  });
});
