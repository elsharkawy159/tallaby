import { describe, expect, it } from "vitest";
import {
  isWelcomeTourEligible,
  WELCOME_TOUR_STEPS,
  welcomeTourStorageKey,
} from "./welcome-tour.lib";

const now = new Date("2026-11-26T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();

describe("isWelcomeTourEligible", () => {
  it("shows the tour to a seller who signed up today", () => {
    expect(isWelcomeTourEligible({ sellerCreatedAt: daysAgo(0), now })).toBe(true);
  });

  it("shows it up to just under 14 days", () => {
    expect(isWelcomeTourEligible({ sellerCreatedAt: daysAgo(13.9), now })).toBe(true);
  });

  it("never shows it to a seller 14 days old or older", () => {
    expect(isWelcomeTourEligible({ sellerCreatedAt: daysAgo(14), now })).toBe(false);
    expect(isWelcomeTourEligible({ sellerCreatedAt: daysAgo(200), now })).toBe(false);
  });

  it("accepts a Date", () => {
    expect(isWelcomeTourEligible({ sellerCreatedAt: new Date(daysAgo(1)), now })).toBe(true);
  });

  it("does not show it without a valid date, or with a future one", () => {
    expect(isWelcomeTourEligible({ sellerCreatedAt: null, now })).toBe(false);
    expect(isWelcomeTourEligible({ sellerCreatedAt: undefined, now })).toBe(false);
    expect(isWelcomeTourEligible({ sellerCreatedAt: "not a date", now })).toBe(false);
    expect(isWelcomeTourEligible({ sellerCreatedAt: daysAgo(-1), now })).toBe(false);
  });
});

describe("welcomeTourStorageKey", () => {
  it("is per user", () => {
    expect(welcomeTourStorageKey("u1")).toBe("tallaby:welcome-tour:u1");
    expect(welcomeTourStorageKey("u1")).not.toBe(welcomeTourStorageKey("u2"));
  });
});

describe("WELCOME_TOUR_STEPS", () => {
  it("opens with a welcome, then runs products, website, payments, wallet", () => {
    expect(WELCOME_TOUR_STEPS).toEqual(["welcome", "products", "website", "payments", "wallet"]);
  });
});
