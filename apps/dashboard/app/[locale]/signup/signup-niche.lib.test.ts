import { describe, expect, it } from "vitest";
import { signupNiche } from "./signup-niche.lib";

describe("signupNiche", () => {
  it("keeps a niche of the chosen industry", () => {
    expect(signupNiche({ industry: "fashion", niche: "tshirts" })).toBe("tshirts");
  });

  it("drops a niche of another industry, an unknown id and no choice", () => {
    expect(signupNiche({ industry: "electronics", niche: "tshirts" })).toBeNull();
    expect(signupNiche({ industry: "fashion", niche: "no-such-niche" })).toBeNull();
    expect(signupNiche({ industry: "fashion", niche: null })).toBeNull();
    expect(signupNiche({ industry: "fashion" })).toBeNull();
    expect(signupNiche({ industry: "fashion", niche: { id: "tshirts" } })).toBeNull();
  });

  it("never saves a niche for Other", () => {
    expect(signupNiche({ industry: "other", niche: "tshirts" })).toBeNull();
  });
});
