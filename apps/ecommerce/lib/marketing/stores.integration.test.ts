import { describe, expect, it } from "vitest";

/**
 * Reads the real query against the STAGING database, and only when
 * TEST_DATABASE_URL is the staging project. Read-only. Never point it at production.
 */
const STAGING_REF = "cxqjrwjianxskhzmrkla";
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const isStaging = Boolean(TEST_DATABASE_URL?.includes(STAGING_REF));
if (isStaging) process.env.DATABASE_URL = TEST_DATABASE_URL;

describe.skipIf(!isStaging)("recent stores (integration)", { timeout: 60_000 }, () => {
  it("reads only an industry and a time, newest first, within the window", async () => {
    const { readRecentStores } = await import("./stores.server");
    const { selectStoreLine, STORE_INDUSTRY_NAMES } = await import("./recent-stores.lib");
    const now = Date.now();

    const wide = await readRecentStores(3650);
    for (const store of wide) {
      expect(Object.keys(store).sort()).toEqual(["industry", "publishedAt"]);
      if (store.industry !== null) expect(Object.keys(STORE_INDUSTRY_NAMES)).toContain(store.industry);
      expect(Date.parse(store.publishedAt ?? "")).toBeLessThanOrEqual(now);
    }
    const times = wide.map((store) => Date.parse(store.publishedAt ?? ""));
    expect(times).toEqual([...times].sort((a, b) => b - a));

    const week = await readRecentStores();
    for (const store of week) {
      expect(now - Date.parse(store.publishedAt ?? "")).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000 + 60_000);
    }
    console.log("line on staging now:", JSON.stringify(selectStoreLine(week, now)), "wider window rows:", wide.length);
  });
});
