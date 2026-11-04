import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "@/messages/marketing/home.ar.json";
import en from "@/messages/marketing/home.en.json";
import { LATEST_WINDOW_MS, RECENT_WINDOW_MS, selectStoreLine, storeAge, type RecentStore } from "./recent-stores.lib";

const NOW = Date.parse("2026-11-04T12:00:00.000Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const store = (name: string, ageMs: number): RecentStore => ({ name, publishedAt: new Date(NOW - ageMs).toISOString() });

describe("selectStoreLine", () => {
  it("shows a store from the last 60 minutes as recent, newest first", () => {
    const line = selectStoreLine([store("Older", 40 * MINUTE), store("Newer", 4 * MINUTE)], NOW);
    expect(line).toEqual({
      kind: "recent",
      stores: [
        { name: "Newer", publishedAtMs: NOW - 4 * MINUTE },
        { name: "Older", publishedAtMs: NOW - 40 * MINUTE },
      ],
    });
  });

  it("treats exactly now and exactly 60 minutes as recent, and one millisecond more as latest", () => {
    expect(selectStoreLine([store("A", 0)], NOW).kind).toBe("recent");
    expect(selectStoreLine([store("A", RECENT_WINDOW_MS)], NOW).kind).toBe("recent");
    expect(selectStoreLine([store("A", RECENT_WINDOW_MS + 1)], NOW).kind).toBe("latest");
  });

  it("keeps at most 5 recent stores", () => {
    const stores = [1, 2, 3, 4, 5, 6, 7].map((n) => store(`S${n}`, n * MINUTE));
    const line = selectStoreLine(stores, NOW);
    expect(line.kind === "recent" && line.stores.map((s) => s.name)).toEqual(["S1", "S2", "S3", "S4", "S5"]);
  });

  it("shows the most recent store within 7 days as latest", () => {
    const line = selectStoreLine([store("Old", 5 * DAY), store("Glow", 3 * HOUR)], NOW);
    expect(line).toEqual({ kind: "latest", store: { name: "Glow", publishedAtMs: NOW - 3 * HOUR } });
  });

  it("treats exactly 7 days as latest, and one millisecond more as nothing", () => {
    expect(selectStoreLine([store("A", LATEST_WINDOW_MS)], NOW).kind).toBe("latest");
    expect(selectStoreLine([store("A", LATEST_WINDOW_MS + 1)], NOW)).toEqual({ kind: "none" });
  });

  it("shows nothing when there are no stores", () => {
    expect(selectStoreLine([], NOW)).toEqual({ kind: "none" });
  });

  it("ignores future, null and unreadable times and blank names", () => {
    const bad: RecentStore[] = [
      store("Future", -1),
      { name: "Null", publishedAt: null },
      { name: "Garbage", publishedAt: "not a date" },
      store("   ", 2 * MINUTE),
    ];
    expect(selectStoreLine(bad, NOW)).toEqual({ kind: "none" });
    expect(selectStoreLine([...bad, store(" Glow ", 2 * HOUR)], NOW)).toEqual({
      kind: "latest",
      store: { name: "Glow", publishedAtMs: NOW - 2 * HOUR },
    });
  });
});

describe("storeAge", () => {
  it.each([
    [0, { unit: "now" }],
    [59_999, { unit: "now" }],
    [MINUTE, { unit: "minutes", count: 1 }],
    [59 * MINUTE + 59_000, { unit: "minutes", count: 59 }],
    [HOUR, { unit: "hours", count: 1 }],
    [23 * HOUR + 59 * MINUTE, { unit: "hours", count: 23 }],
    [DAY, { unit: "days", count: 1 }],
    [7 * DAY, { unit: "days", count: 7 }],
  ])("%d ms", (age, expected) => {
    expect(storeAge(NOW - age, NOW)).toEqual(expected);
  });
});

describe("live line plurals", () => {
  const render = (messages: unknown, locale: string, key: "minutes" | "hours" | "days", count: number) =>
    createTranslator({ locale, messages: messages as never, namespace: "home.hero.live" as never })
      .rich(key as never, { count, num: (chunks: unknown) => `[${chunks}]` } as never)
      ?.toString();

  it.each([
    ["minutes", 1, "قبل دقيقة"],
    ["minutes", 2, "قبل دقيقتين"],
    ["minutes", 4, "قبل [4] دقائق"],
    ["minutes", 10, "قبل [10] دقائق"],
    ["minutes", 11, "قبل [11] دقيقة"],
    ["minutes", 59, "قبل [59] دقيقة"],
    ["hours", 1, "قبل ساعة"],
    ["hours", 2, "قبل ساعتين"],
    ["hours", 3, "قبل [3] ساعات"],
    ["hours", 23, "قبل [23] ساعة"],
    ["days", 1, "قبل يوم"],
    ["days", 2, "قبل يومين"],
    ["days", 7, "قبل [7] أيام"],
  ] as const)("Arabic %s %d", (key, count, expected) => {
    expect(render(ar, "ar", key, count)).toBe(expected);
  });

  it.each([
    ["minutes", 1, "a minute ago"],
    ["minutes", 4, "[4] minutes ago"],
    ["hours", 1, "an hour ago"],
    ["hours", 3, "[3] hours ago"],
    ["days", 1, "a day ago"],
    ["days", 7, "[7] days ago"],
  ] as const)("English %s %d", (key, count, expected) => {
    expect(render(en, "en", key, count)).toBe(expected);
  });
});
