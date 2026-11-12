import { describe, expect, it } from "vitest";
import { storeSubdomainError, subdomainHint } from "./store-subdomain.lib";

describe("subdomainHint", () => {
  it("normalizes and accepts a valid new subdomain", () => {
    expect(subdomainHint("  New-Shop ", "old-shop")).toEqual({ subdomain: "new-shop", problem: null });
  });

  it("flags the current subdomain, bad formats and reserved names like the server", () => {
    expect(subdomainHint("old-shop", "old-shop").problem).toBe("same");
    expect(subdomainHint("ab", "old-shop").problem).toBe("tooShort");
    expect(subdomainHint("a".repeat(33), "old-shop").problem).toBe("tooLong");
    expect(subdomainHint("-shop", "old-shop").problem).toBe("invalid");
    expect(subdomainHint("my--shop", "old-shop").problem).toBe("invalid");
    expect(subdomainHint("متجر", "old-shop").problem).toBe("invalid");
    expect(subdomainHint("admin", "old-shop").problem).toBe("reserved");
    expect(subdomainHint("glow", "old-shop").problem).toBe("reserved");
  });
});

describe("storeSubdomainError", () => {
  it("has a message for every server code and a fallback", () => {
    for (const code of ["not_admin", "invalid_input", "not_found", "no_change", "store_read_only", "taken", "tooShort", "tooLong", "invalid", "reserved"]) {
      expect(storeSubdomainError(code)).not.toBe(storeSubdomainError("generic"));
    }
    expect(storeSubdomainError("whatever")).toBe("Something went wrong. Try again.");
  });
});
