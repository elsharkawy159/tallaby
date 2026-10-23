import { describe, expect, it } from "vitest";
import { HEARD_ABOUT_US_SOURCES, heardAboutUsInputSchema, isHeardAboutUsSource } from "./heard-about-us.lib";

describe("heardAboutUsInputSchema", () => {
  it("accepts every source", () => {
    for (const source of HEARD_ABOUT_US_SOURCES) {
      expect(heardAboutUsInputSchema.safeParse({ source }).success).toBe(true);
    }
  });

  it("keeps the free text only for other", () => {
    expect(heardAboutUsInputSchema.parse({ source: "other", other: "  A podcast " })).toEqual({
      source: "other",
      other: "A podcast",
    });
    expect(heardAboutUsInputSchema.parse({ source: "google", other: "ignored" })).toEqual({
      source: "google",
      other: null,
    });
    expect(heardAboutUsInputSchema.parse({ source: "other", other: "   " }).other).toBeNull();
  });

  it("rejects unknown sources and long text", () => {
    expect(heardAboutUsInputSchema.safeParse({ source: "twitter" }).success).toBe(false);
    expect(heardAboutUsInputSchema.safeParse({ source: "other", other: "x".repeat(121) }).success).toBe(false);
  });

  it("guards source values", () => {
    expect(isHeardAboutUsSource("tiktok")).toBe(true);
    expect(isHeardAboutUsSource("TikTok")).toBe(false);
    expect(isHeardAboutUsSource(null)).toBe(false);
  });
});
