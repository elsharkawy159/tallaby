import { describe, expect, it } from "vitest";
import { feeTrialReminderStage, getFeeTrialStatus } from "./fee-trial.lib";

const DAY = 86_400_000;
const now = new Date("2026-11-10T12:00:00.000Z");
const at = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();

describe("getFeeTrialStatus", () => {
  it("is none for sellers who are not eligible", () => {
    expect(getFeeTrialStatus({ feeTrialEligible: false }, now)).toEqual({ state: "none" });
    expect(getFeeTrialStatus({}, now)).toEqual({ state: "none" });
  });

  it("is not_started for eligible sellers before the store goes live", () => {
    expect(getFeeTrialStatus({ feeTrialEligible: true }, now)).toEqual({ state: "not_started" });
  });

  it("counts whole days left, rounded up", () => {
    const status = getFeeTrialStatus(
      { feeTrialEligible: true, feeTrialStartedAt: at(-24 * DAY), feeTrialEndsAt: at(6 * DAY + 3_600_000) },
      now,
    );
    expect(status).toMatchObject({ state: "active", daysLeft: 7 });
    expect(getFeeTrialStatus({ feeTrialStartedAt: at(-DAY), feeTrialEndsAt: at(60_000) }, now)).toMatchObject({
      state: "active",
      daysLeft: 1,
    });
  });

  it("is ended from the end instant", () => {
    expect(getFeeTrialStatus({ feeTrialStartedAt: at(-30 * DAY), feeTrialEndsAt: at(0) }, now)).toMatchObject({
      state: "ended",
    });
  });

  it("ignores invalid dates", () => {
    expect(getFeeTrialStatus({ feeTrialEligible: true, feeTrialStartedAt: "x", feeTrialEndsAt: "y" }, now)).toEqual({
      state: "not_started",
    });
  });

  it("defaults to now", () => {
    expect(getFeeTrialStatus({ feeTrialStartedAt: new Date(Date.now() - DAY), feeTrialEndsAt: new Date(Date.now() + DAY) }).state).toBe("active");
  });
});

describe("feeTrialReminderStage", () => {
  it.each([
    [8 * DAY, null],
    [7 * DAY + 1, null],
    [7 * DAY, null],
    [2 * DAY, null],
    [DAY + 1, null],
    [DAY, "t1"],
    [1, "t1"],
    [0, null],
    [-DAY, null],
  ])("%d ms before the end → %s", (left, stage) => {
    expect(feeTrialReminderStage(at(left), now)).toBe(stage);
  });

  it("needs an end date", () => {
    expect(feeTrialReminderStage(null, now)).toBeNull();
    expect(feeTrialReminderStage("nope", now)).toBeNull();
    expect(feeTrialReminderStage(new Date(Date.now() + DAY / 2))).toBe("t1");
  });
});
