import { describe, expect, it } from "vitest";
import { afterSignupPath, withQuery } from "./after-signup.lib";
import { safeNextPath } from "./safe-next.lib";

const ID = "4b6f2a1e-8c3d-4e5f-9a0b-1c2d3e4f5a6b";

describe("afterSignupPath", () => {
  it("allows the builder, with or without a hero intake", () => {
    expect(afterSignupPath("/ai-builder")).toBe("/ai-builder");
    expect(afterSignupPath(`/ai-builder?intake=${ID}`)).toBe(`/ai-builder?intake=${ID}`);
    expect(afterSignupPath(`/ai-builder?intake=${ID.toUpperCase()}`)).toBe(`/ai-builder?intake=${ID}`);
  });

  it("allows the Plans page (tallaby.com's Pro button)", () => {
    expect(afterSignupPath("/settings/plan")).toBe("/settings/plan");
    expect(withQuery("/settings/plan", { welcome: "1", signup: "google" })).toBe("/settings/plan?welcome=1&signup=google");
  });

  it("refuses everything else", () => {
    for (const bad of [
      undefined,
      null,
      42,
      "/",
      "/products",
      "/settings/plan?x=1",
      "/settings/plan/",
      "/settings",
      "https://evil.com/ai-builder",
      "//evil.com",
      "/ai-builder?intake=nope",
      `/ai-builder?intake=${ID}&next=//evil.com`,
      `/ai-builder?intake=${ID}#x`,
      `/ai-builder/?intake=${ID}`,
      `/ai-builder?token=x&intake=${ID}`,
    ]) {
      expect(afterSignupPath(bad), String(bad)).toBeNull();
    }
  });

  it("survives the auth callback's next parameter", () => {
    const next = encodeURIComponent(`/ai-builder?intake=${ID}`);
    const read = new URLSearchParams(`next=${next}`).get("next");
    expect(afterSignupPath(safeNextPath(read))).toBe(`/ai-builder?intake=${ID}`);
  });
});

describe("withQuery", () => {
  it("adds parameters with ? or &", () => {
    expect(withQuery("/", { welcome: "1" })).toBe("/?welcome=1");
    expect(withQuery(`/ai-builder?intake=${ID}`, { welcome: "1", signup: "email" })).toBe(`/ai-builder?intake=${ID}&welcome=1&signup=email`);
    expect(withQuery("/ai-builder", { signup: undefined })).toBe("/ai-builder");
  });
});
