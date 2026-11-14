import { describe, expect, it } from "vitest";
import { storeBaseLocale, storeLocalePath, storeLocalePrefix } from "./index";

describe("store languages in URLs (owner, 2026-11-14)", () => {
  it("an Arabic-default store keeps Arabic unprefixed and English under /en", () => {
    expect(storeLocalePrefix("ar", "ar")).toBe("");
    expect(storeLocalePrefix("en", "ar")).toBe("/en");
    expect(storeLocalePath("en", "/products/x", "ar")).toBe("/en/products/x");
    expect(storeLocalePath("ar", "/", "ar")).toBe("/");
    expect(storeLocalePath("en", "/", "ar")).toBe("/en");
  });

  it("an English-default store has English unprefixed and Arabic under /ar", () => {
    expect(storeLocalePrefix("en", "en")).toBe("");
    expect(storeLocalePrefix("ar", "en")).toBe("/ar");
    expect(storeLocalePath("ar", "/products/x", "en")).toBe("/ar/products/x");
    expect(storeLocalePath("en", "", "en")).toBe("/");
    expect(storeLocalePath("ar", "", "en")).toBe("/ar");
  });

  it("treats a missing or unknown default as Arabic", () => {
    expect(storeBaseLocale(null)).toBe("ar");
    expect(storeBaseLocale("fr")).toBe("ar");
    expect(storeBaseLocale("en")).toBe("en");
    expect(storeLocalePrefix("en", undefined)).toBe("/en");
  });
});
