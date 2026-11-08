import { describe, expect, it } from "vitest";
import { aiStoreBuildLabel, parseAiStoreBuild } from "./ai-build.lib";

describe("parseAiStoreBuild", () => {
  it("reads the selected json object", () => {
    expect(
      parseAiStoreBuild({ source: "hero", publishedAt: "2026-11-08T10:00:00+00:00", createdAt: "2026-11-08T09:00:00+00:00" }),
    ).toEqual({ source: "hero", publishedAt: "2026-11-08T10:00:00.000Z", createdAt: "2026-11-08T09:00:00.000Z" });
  });

  it("reads a json string and defaults an unknown source to dashboard", () => {
    expect(parseAiStoreBuild(JSON.stringify({ source: "x", publishedAt: null, createdAt: "2026-11-01T00:00:00Z" }))).toEqual({
      source: "dashboard",
      publishedAt: null,
      createdAt: "2026-11-01T00:00:00.000Z",
    });
  });

  it("is null for no build or a broken value", () => {
    expect(parseAiStoreBuild(null)).toBeNull();
    expect(parseAiStoreBuild(undefined)).toBeNull();
    expect(parseAiStoreBuild("not json")).toBeNull();
    expect(parseAiStoreBuild({ source: "hero", createdAt: "nope" })).toBeNull();
    expect(parseAiStoreBuild(42)).toBeNull();
  });
});

describe("aiStoreBuildLabel", () => {
  it("names the homepage and the publish date", () => {
    expect(
      aiStoreBuildLabel({ source: "hero", publishedAt: "2026-11-08T23:30:00Z", createdAt: "2026-11-08T09:00:00Z" }),
    ).toBe("Created with AI · from tallaby.com homepage · published 9 Nov 2026");
  });

  it("names the dashboard and falls back to the start date", () => {
    expect(aiStoreBuildLabel({ source: "dashboard", publishedAt: null, createdAt: "2026-11-03T12:00:00Z" })).toBe(
      "Created with AI · from the dashboard · started 3 Nov 2026",
    );
  });
});
