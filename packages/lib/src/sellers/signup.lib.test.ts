import { describe, expect, it } from "vitest";
import { displayNameFromSubdomain, signupInputSchema } from "./signup.lib";

describe("displayNameFromSubdomain", () => {
  it("title-cases the words of the subdomain", () => {
    expect(displayNameFromSubdomain("faster-eg")).toBe("Faster Eg");
    expect(displayNameFromSubdomain("abc")).toBe("Abc");
    expect(displayNameFromSubdomain("my-2nd-shop")).toBe("My 2nd Shop");
  });
});

describe("signupInputSchema", () => {
  it("normalizes the subdomain and accepts an Egyptian mobile", () => {
    expect(signupInputSchema.parse({ subdomain: " Faster-EG ", phone: "01012345678" })).toEqual({
      subdomain: "faster-eg",
      phone: "01012345678",
    });
  });

  it("accepts +20 and spaces in the phone and stores the local form", () => {
    expect(signupInputSchema.parse({ subdomain: "abc", phone: "+20 101 234 5678" }).phone).toBe("01012345678");
  });

  it("rejects an invalid phone", () => {
    expect(signupInputSchema.safeParse({ subdomain: "abc", phone: "0123" }).success).toBe(false);
    expect(signupInputSchema.safeParse({ subdomain: "abc", phone: "01312345678" }).success).toBe(false);
  });

  it("rejects an invalid subdomain", () => {
    expect(signupInputSchema.safeParse({ subdomain: "a", phone: "01012345678" }).success).toBe(false);
    expect(signupInputSchema.safeParse({ subdomain: "admin", phone: "01012345678" }).success).toBe(false);
  });
});
