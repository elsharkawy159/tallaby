import { describe, expect, it } from "vitest";
import { shouldAskHeardAboutUs } from "./heard-about-us.lib";

const now = new Date("2026-10-24T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();

describe("shouldAskHeardAboutUs", () => {
  it("asks an unanswered seller whose first store is more than a day old", () => {
    expect(shouldAskHeardAboutUs({ answeredAt: null, firstStoreAt: hoursAgo(25), now })).toBe(true);
  });

  it("waits during the seller's first day", () => {
    expect(shouldAskHeardAboutUs({ answeredAt: null, firstStoreAt: hoursAgo(2), now })).toBe(false);
  });

  it("never asks again once answered", () => {
    expect(shouldAskHeardAboutUs({ answeredAt: hoursAgo(1), firstStoreAt: hoursAgo(72), now })).toBe(false);
  });

  it("does not ask before the seller has a store", () => {
    expect(shouldAskHeardAboutUs({ answeredAt: null, firstStoreAt: null, now })).toBe(false);
  });
});
