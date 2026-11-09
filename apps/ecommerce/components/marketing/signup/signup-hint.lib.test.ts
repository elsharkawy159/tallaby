import { describe, expect, it } from "vitest";
import { cleanSignupHint, dashboardSignupQuery } from "./signup-hint.lib";

describe("signup hint", () => {
  it("keeps only a clean store address and the pro plan", () => {
    expect(cleanSignupHint({ subdomain: " Faster_EG! ", plan: "pro" })).toEqual({ subdomain: "fastereg", plan: "pro" });
    expect(cleanSignupHint({ subdomain: "a".repeat(40) })).toEqual({ subdomain: "a".repeat(32) });
    expect(cleanSignupHint({ plan: "enterprise", sellerId: "x" })).toBeNull();
    expect(cleanSignupHint({ subdomain: 42, plan: true })).toBeNull();
    expect(cleanSignupHint(null)).toBeNull();
    expect(cleanSignupHint("pro")).toBeNull();
  });

  it("builds the dashboard signup query", () => {
    expect(dashboardSignupQuery(null)).toBe("");
    expect(dashboardSignupQuery({ subdomain: "faster-eg" })).toBe("?subdomain=faster-eg");
    expect(dashboardSignupQuery({ subdomain: "faster-eg", plan: "pro" })).toBe("?subdomain=faster-eg&next=%2Fsettings%2Fplan");
    expect(dashboardSignupQuery({ plan: "pro" })).toBe("?next=%2Fsettings%2Fplan");
  });
});
