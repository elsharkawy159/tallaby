import { describe, expect, it } from "vitest";
import { mixHex, PLATFORM_BRAND, readableOn, storeEmailBrand } from "./brand.js";

describe("storeEmailBrand", () => {
  const base = { name: "Sara Home", homeUrl: "https://sara.tallaby.com" };

  it("falls back to Tallaby's colours when the store has none or invalid ones", () => {
    const brand = storeEmailBrand({ ...base, primary: "red; background:url(x)", accent: null });
    expect(brand.primary).toBe(PLATFORM_BRAND.primary);
    expect(brand.accent).toBe(PLATFORM_BRAND.primary);
    expect(brand.isPlatform).toBe(false);
  });

  it("uses the store's colours and picks readable text on them", () => {
    const brand = storeEmailBrand({ ...base, primary: "#ffffff", accent: "#111111" });
    expect(brand.primary).toBe("#ffffff");
    expect(brand.onPrimary).toBe("#171717");
    expect(brand.onAccent).toBe("#ffffff");
  });

  it("drops non-https logos and non-Google font stylesheets", () => {
    const brand = storeEmailBrand({
      ...base,
      logoUrl: "javascript:alert(1)",
      fontUrl: "https://evil.example/font.css",
    });
    expect(brand.logoUrl).toBeNull();
    expect(brand.fontUrl).toBeNull();
  });

  it("falls back to Tallaby's support address", () => {
    expect(storeEmailBrand(base).supportEmail).toBe(PLATFORM_BRAND.supportEmail);
    expect(storeEmailBrand({ ...base, supportEmail: " hi@sara.com " }).supportEmail).toBe("hi@sara.com");
  });
});

describe("colour helpers", () => {
  it("mixes toward a target", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mixHex("nope", "#ffffff", 0.5)).toBe("nope");
  });

  it("chooses dark text on light backgrounds", () => {
    expect(readableOn("#fdad28")).toBe("#171717");
    expect(readableOn("#145163")).toBe("#ffffff");
  });
});
