import { describe, expect, it } from "vitest";
import { policyTextFor, storePageFallback } from "./store-policy.lib";

describe("store page fallback", () => {
  it("keeps policy and contact pages on the store", () => {
    expect(storePageFallback("returns")).toEqual({ policy: "returns" });
    expect(storePageFallback("shipping")).toEqual({ policy: "shipping" });
    expect(storePageFallback("contact")).toEqual({ policy: "contact" });
  });

  it("sends template links with no page to the store's home", () => {
    expect(storePageFallback("about")).toBe("home");
    expect(storePageFallback("faq")).toBe("home");
  });

  it("leaves other slugs alone", () => {
    expect(storePageFallback("privacy")).toBeNull();
    expect(storePageFallback("anything")).toBeNull();
    expect(storePageFallback("constructor")).toBeNull();
    expect(storePageFallback("__proto__")).toBeNull();
  });
});

describe("policy text", () => {
  const policies = { returnPolicy: " 14 days ", shippingPolicy: "   " };

  it("picks the seller's text for the page", () => {
    expect(policyTextFor("returns", policies)).toBe("14 days");
  });

  it("treats blank or missing text as none", () => {
    expect(policyTextFor("shipping", policies)).toBeNull();
    expect(policyTextFor("returns", null)).toBeNull();
    expect(policyTextFor("contact", policies)).toBeNull();
  });
});
