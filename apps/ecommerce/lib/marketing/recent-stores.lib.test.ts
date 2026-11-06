import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "@/messages/marketing/home.ar.json";
import en from "@/messages/marketing/home.en.json";
import { STORE_INDUSTRIES } from "../../../../packages/store-editor/src/lib/industries.lib";
import { LATEST_WINDOW_MS, RECENT_WINDOW_MS, STORE_INDUSTRY_NAMES, selectStoreLine, storeAge, storeIndustryId, type RecentStore, type StoreIndustryId } from "./recent-stores.lib";

const NOW = Date.parse("2026-11-04T12:00:00.000Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const store = (industry: StoreIndustryId | null, ageMs: number): RecentStore => ({ industry, publishedAt: new Date(NOW - ageMs).toISOString() });

describe("storeIndustryId", () => {
  it("lists exactly the industries a seller can pick", () => {
    expect(Object.fromEntries(STORE_INDUSTRIES.map((i) => [i.id, { en: i.en, ar: i.ar }]))).toEqual(STORE_INDUSTRY_NAMES);
  });

  it("matches the English or Arabic column, ignoring case and spaces", () => {
    expect(storeIndustryId({ en: "Fashion", ar: null })).toBe("fashion");
    expect(storeIndustryId({ en: " beauty & cosmetics ", ar: null })).toBe("beauty");
    expect(storeIndustryId({ en: null, ar: "حلويات وقهوة" })).toBe("sweets");
  });

  it("never passes on a seller's own words or an empty category", () => {
    expect(storeIndustryId({ en: null, ar: "بيع عطور فلان" })).toBeNull();
    expect(storeIndustryId({ en: "Bashoy's shop", ar: null })).toBeNull();
    expect(storeIndustryId({ en: "", ar: "  " })).toBeNull();
    expect(storeIndustryId({})).toBeNull();
  });
});

describe("selectStoreLine", () => {
  it("shows a store from the last 60 minutes as recent, newest first", () => {
    const line = selectStoreLine([store("food", 40 * MINUTE), store("fashion", 4 * MINUTE)], NOW);
    expect(line).toEqual({
      kind: "recent",
      stores: [
        { industry: "fashion", publishedAtMs: NOW - 4 * MINUTE },
        { industry: "food", publishedAtMs: NOW - 40 * MINUTE },
      ],
    });
  });

  it("treats exactly now and exactly 60 minutes as recent, and one millisecond more as latest", () => {
    expect(selectStoreLine([store("fashion", 0)], NOW).kind).toBe("recent");
    expect(selectStoreLine([store("fashion", RECENT_WINDOW_MS)], NOW).kind).toBe("recent");
    expect(selectStoreLine([store("fashion", RECENT_WINDOW_MS + 1)], NOW).kind).toBe("latest");
  });

  it("keeps at most 5 recent stores", () => {
    const stores = [1, 2, 3, 4, 5, 6, 7].map((n) => store(null, n * MINUTE));
    const line = selectStoreLine(stores, NOW);
    expect(line.kind === "recent" && line.stores.map((s) => s.publishedAtMs)).toEqual([1, 2, 3, 4, 5].map((n) => NOW - n * MINUTE));
  });

  it("shows the most recent store within 7 days as latest", () => {
    const line = selectStoreLine([store("food", 5 * DAY), store("beauty", 3 * HOUR)], NOW);
    expect(line).toEqual({ kind: "latest", store: { industry: "beauty", publishedAtMs: NOW - 3 * HOUR } });
  });

  it("treats exactly 7 days as latest, and one millisecond more as nothing", () => {
    expect(selectStoreLine([store("fashion", LATEST_WINDOW_MS)], NOW).kind).toBe("latest");
    expect(selectStoreLine([store("fashion", LATEST_WINDOW_MS + 1)], NOW)).toEqual({ kind: "none" });
  });

  it("shows nothing when there are no stores", () => {
    expect(selectStoreLine([], NOW)).toEqual({ kind: "none" });
  });

  it("ignores future, null and unreadable times, and an unknown industry", () => {
    const bad: RecentStore[] = [store("fashion", -1), { industry: "fashion", publishedAt: null }, { industry: null, publishedAt: "not a date" }];
    expect(selectStoreLine(bad, NOW)).toEqual({ kind: "none" });
    expect(selectStoreLine([...bad, { industry: "nope" as StoreIndustryId, publishedAt: new Date(NOW - 2 * HOUR).toISOString() }], NOW)).toEqual({
      kind: "latest",
      store: { industry: null, publishedAtMs: NOW - 2 * HOUR },
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
