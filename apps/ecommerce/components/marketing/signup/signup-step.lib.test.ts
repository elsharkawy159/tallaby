import { describe, expect, it } from "vitest";
import { isEmailError, isSignupEmail } from "./signup-step.lib";

describe("signup steps", () => {
  it("accepts only addresses the server accepts", () => {
    expect(isSignupEmail("you@example.com")).toBe(true);
    expect(isSignupEmail("  you@example.com ")).toBe(true);
    expect(isSignupEmail("")).toBe(false);
    expect(isSignupEmail("you@example")).toBe(false);
    expect(isSignupEmail("you@example.c")).toBe(false);
    expect(isSignupEmail("you @example.com")).toBe(false);
    expect(isSignupEmail(`${"a".repeat(250)}@example.com`)).toBe(false);
  });

  it("sends only address errors back to step 1", () => {
    expect(isEmailError("emailTaken")).toBe(true);
    expect(isEmailError("subdomainTaken")).toBe(false);
    expect(isEmailError("rateLimited")).toBe(false);
    expect(isEmailError(null)).toBe(false);
  });
});
