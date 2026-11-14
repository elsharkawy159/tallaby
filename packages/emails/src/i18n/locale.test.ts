import { describe, expect, it } from "vitest";
import { interpolate } from "./interpolate.js";
import { emailPathPrefix, resolveEmailLocale } from "./locale.js";

describe("resolveEmailLocale", () => {
  it("defaults to English", () => {
    expect(resolveEmailLocale(undefined)).toBe("en");
    expect(resolveEmailLocale(null)).toBe("en");
    expect(resolveEmailLocale("")).toBe("en");
    expect(resolveEmailLocale("en")).toBe("en");
    expect(resolveEmailLocale("fr")).toBe("en");
  });

  it("maps Arabic preferred_language values", () => {
    expect(resolveEmailLocale("ar")).toBe("ar");
    expect(resolveEmailLocale("AR")).toBe("ar");
    expect(resolveEmailLocale("ar-EG")).toBe("ar");
    expect(resolveEmailLocale(" ar-SA ")).toBe("ar");
  });
});

describe("interpolate", () => {
  it("replaces named placeholders", () => {
    expect(interpolate("Hi {name}", { name: "Omar" })).toBe("Hi Omar");
  });
});

describe("emailPathPrefix", () => {
  it("keeps Arabic unprefixed by default (tallaby.com, Arabic-default stores)", () => {
    expect(emailPathPrefix("ar")).toBe("");
    expect(emailPathPrefix("en")).toBe("/en");
    expect(emailPathPrefix("en", "ar")).toBe("/en");
    expect(emailPathPrefix("en", null)).toBe("/en");
  });

  it("swaps the prefixes on an English-default store", () => {
    expect(emailPathPrefix("en", "en")).toBe("");
    expect(emailPathPrefix("ar", "en")).toBe("/ar");
  });
});
