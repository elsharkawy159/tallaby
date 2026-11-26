import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  cairoDate,
  deriveSellerEmailOptOutKey,
  isStoreOfflineEmailDue,
  latestFinishedWeek,
  parseStoreSessionsReport,
  sendBudget,
  signSellerEmailOptOutToken,
  verifySellerEmailOptOutToken,
  weeklyInsightsReferenceId,
} from "./seller-insights.lib";

const SELLER = "0b9f5c3e-6a1d-4f7e-9c2b-1a2b3c4d5e6f";
const key = deriveSellerEmailOptOutKey(Buffer.alloc(32, 7));

describe("send budget", () => {
  it("is what is left of the day, at most the run cap", () => {
    expect(sendBudget(15, 5, 0)).toBe(5);
    expect(sendBudget(15, 5, 12)).toBe(3);
    expect(sendBudget(15, 5, 15)).toBe(0);
    expect(sendBudget(15, 5, 40)).toBe(0);
  });
});

describe("cairo dates", () => {
  it("uses the Cairo calendar day", () => {
    // 23:30 UTC on 2026-11-25 is already 01:30 on the 26th in Cairo (UTC+2).
    expect(cairoDate(new Date("2026-11-25T23:30:00Z"))).toBe("2026-11-26");
    expect(addCalendarDays("2026-12-29", 7)).toBe("2027-01-05");
    expect(addCalendarDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("latest finished week", () => {
  const signup = "2026-11-01T10:00:00+02:00"; // Cairo day 2026-11-01

  it("is null until the first 7 Cairo days are over", () => {
    expect(latestFinishedWeek(signup, new Date("2026-11-07T21:59:00Z"))).toBeNull(); // 23:59 Cairo on day 7
  });

  it("week 1 starts on the sign-up day and has no week before it", () => {
    expect(latestFinishedWeek(signup, new Date("2026-11-07T22:00:00Z"))).toEqual({
      index: 1,
      start: "2026-11-01",
      lastDay: "2026-11-07",
      end: "2026-11-08",
      previousStart: null,
    });
  });

  it("only ever names the latest finished week", () => {
    expect(latestFinishedWeek(signup, new Date("2026-11-26T12:00:00Z"))).toEqual({
      index: 3,
      start: "2026-11-15",
      lastDay: "2026-11-21",
      end: "2026-11-22",
      previousStart: "2026-11-08",
    });
  });

  it("rejects an unreadable sign-up time", () => {
    expect(latestFinishedWeek("not a date")).toBeNull();
  });
});

describe("weekly reference id", () => {
  it("is the md5 of the type, seller and week, as a uuid (the SQL computes the same)", () => {
    const id = weeklyInsightsReferenceId(SELLER.toUpperCase(), "2026-11-15");
    const hex = createHash("md5").update(`seller_weekly_insights:${SELLER}:2026-11-15`).digest("hex");
    expect(id.replace(/-/g, "")).toBe(hex);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(weeklyInsightsReferenceId(SELLER, "2026-11-22")).not.toBe(id);
    expect(() => weeklyInsightsReferenceId("x", "2026-11-15")).toThrow();
  });
});

describe("store-offline email", () => {
  const now = new Date("2026-11-26T12:00:00Z");
  const lock = (offlineAt: string, over: Partial<{ activated: boolean; storeOffline: boolean }> = {}) => ({
    activated: false,
    storeOffline: true,
    grace: { endsAt: offlineAt, firstOrderReceived: false, endedBy: "days" as const, offlineAt },
    ...over,
  });

  it("is due when the stores went offline at most 7 days ago", () => {
    expect(isStoreOfflineEmailDue(lock("2026-11-26T10:00:00Z"), now)).toBe(true);
    expect(isStoreOfflineEmailDue(lock("2026-11-19T12:00:00Z"), now)).toBe(true);
    expect(isStoreOfflineEmailDue(lock("2026-11-19T11:59:00Z"), now)).toBe(false);
  });

  it("is never due while online, activated or before the days end", () => {
    expect(isStoreOfflineEmailDue(lock("2026-11-25T00:00:00Z", { storeOffline: false }), now)).toBe(false);
    expect(isStoreOfflineEmailDue(lock("2026-11-25T00:00:00Z", { activated: true }), now)).toBe(false);
    expect(isStoreOfflineEmailDue(lock("2026-11-27T00:00:00Z"), now)).toBe(false);
    expect(isStoreOfflineEmailDue({ activated: true, storeOffline: false, grace: null }, now)).toBe(false);
  });
});

describe("opt-out token", () => {
  it("round-trips the seller id", () => {
    const token = signSellerEmailOptOutToken(SELLER, "weekly_insights", key);
    expect(verifySellerEmailOptOutToken(token, "weekly_insights", key)).toBe(SELLER);
  });

  it("rejects another key, an edited id or mac, and junk", () => {
    const token = signSellerEmailOptOutToken(SELLER, "weekly_insights", key);
    expect(verifySellerEmailOptOutToken(token, "weekly_insights", deriveSellerEmailOptOutKey(Buffer.alloc(32, 8)))).toBeNull();
    const [hex, mac] = token.split(".") as [string, string];
    const otherHex = `${hex.slice(0, -1)}${hex.endsWith("0") ? "1" : "0"}`;
    expect(verifySellerEmailOptOutToken(`${otherHex}.${mac}`, "weekly_insights", key)).toBeNull();
    const otherMac = `${mac.slice(0, -1)}${mac.endsWith("A") ? "B" : "A"}`;
    expect(verifySellerEmailOptOutToken(`${hex}.${otherMac}`, "weekly_insights", key)).toBeNull();
    for (const junk of [null, "", "abc", `${hex}`, 42]) expect(verifySellerEmailOptOutToken(junk, "weekly_insights", key)).toBeNull();
  });
});

describe("GA4 sessions per store", () => {
  const storeIds = ["s1", "s2", "s3"];
  const storeDimension = "customEvent:store_id";

  it("reads both ranges and gives 0 to stores with no row", () => {
    const report = {
      dimensionHeaders: [{ name: storeDimension }, { name: "dateRange" }],
      rows: [
        { dimensionValues: [{ value: "s1" }, { value: "current" }], metricValues: [{ value: "120" }] },
        { dimensionValues: [{ value: "s1" }, { value: "previous" }], metricValues: [{ value: "80" }] },
        { dimensionValues: [{ value: "s2" }, { value: "current" }], metricValues: [{ value: "x" }] },
        { dimensionValues: [{ value: "other" }, { value: "current" }], metricValues: [{ value: "9" }] },
      ],
    };
    const out = parseStoreSessionsReport(report, { storeIds, storeDimension, hasPrevious: true });
    expect(out.get("s1")).toEqual({ current: 120, previous: 80 });
    expect(out.get("s2")).toEqual({ current: null, previous: 0 });
    expect(out.get("s3")).toEqual({ current: 0, previous: 0 });
    expect(out.has("other")).toBe(false);
  });

  it("week 1 has one range and no previous", () => {
    const report = { dimensionHeaders: [{ name: storeDimension }], rows: [{ dimensionValues: [{ value: "s1" }], metricValues: [{ value: "5" }] }] };
    const out = parseStoreSessionsReport(report, { storeIds, storeDimension, hasPrevious: false });
    expect(out.get("s1")).toEqual({ current: 5, previous: null });
    expect(out.get("s2")).toEqual({ current: 0, previous: null });
  });
});
