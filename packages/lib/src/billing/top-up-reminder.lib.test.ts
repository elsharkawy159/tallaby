import { describe, expect, it } from "vitest";
import { sellerNotificationHref } from "../notifications/notifications.lib";
import { isTopUpReminderDue, topUpReminderDedupeKey, type TopUpReminderCandidate } from "./top-up-reminder.lib";

const now = new Date("2026-11-20T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();

const base: TopUpReminderCandidate = {
  sellerId: "00000000-0000-4000-8000-000000000001",
  firstStoreId: "00000000-0000-4000-8000-000000000002",
  firstStoreCreatedAt: hoursAgo(25),
  plan: "free",
  planExpiresAt: null,
  planGraceUntil: null,
  hasTopUp: false,
  hasHadPositiveBalance: false,
  hasPendingManualTopUp: false,
  alreadyReminded: false,
};

describe("isTopUpReminderDue", () => {
  it("is due 24 hours after the first store for a seller who isn't activated", () => {
    expect(isTopUpReminderDue(base, true, now)).toBe(true);
    expect(isTopUpReminderDue({ ...base, firstStoreCreatedAt: hoursAgo(24) }, true, now)).toBe(true);
  });

  it("waits for the 24 hours and skips stores older than the 14-day window", () => {
    expect(isTopUpReminderDue({ ...base, firstStoreCreatedAt: hoursAgo(23.9) }, true, now)).toBe(false);
    expect(isTopUpReminderDue({ ...base, firstStoreCreatedAt: hoursAgo(14 * 24 + 1) }, true, now)).toBe(false);
    expect(isTopUpReminderDue({ ...base, firstStoreCreatedAt: "not a date" }, true, now)).toBe(false);
  });

  it("never sends before the USD switch", () => {
    expect(isTopUpReminderDue(base, false, now)).toBe(false);
  });

  it("skips activated sellers: a top-up, a balance once above zero, active Pro", () => {
    expect(isTopUpReminderDue({ ...base, hasTopUp: true }, true, now)).toBe(false);
    expect(isTopUpReminderDue({ ...base, hasHadPositiveBalance: true }, true, now)).toBe(false);
    expect(isTopUpReminderDue({ ...base, plan: "pro" }, true, now)).toBe(false);
    // Pro that ended no longer counts.
    expect(isTopUpReminderDue({ ...base, plan: "pro", planExpiresAt: hoursAgo(48), planGraceUntil: hoursAgo(1) }, true, now)).toBe(true);
  });

  it("skips a seller already reminded or with a manual top-up in review", () => {
    expect(isTopUpReminderDue({ ...base, alreadyReminded: true }, true, now)).toBe(false);
    expect(isTopUpReminderDue({ ...base, hasPendingManualTopUp: true }, true, now)).toBe(false);
  });
});

describe("top-up reminder row", () => {
  it("has one dedupe key per seller and opens the top-up dialog", () => {
    expect(topUpReminderDedupeKey(base.sellerId)).toBe(`top_up_reminder_24h:${base.sellerId}`);
    expect(sellerNotificationHref({ type: "top_up_reminder", data: {} })).toBe("/wallet?topup=1");
  });
});
