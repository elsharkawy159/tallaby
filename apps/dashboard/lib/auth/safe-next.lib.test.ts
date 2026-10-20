import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next.lib";

describe("safeNextPath", () => {
  it("keeps same-site relative paths", () => {
    expect(safeNextPath("/")).toBe("/");
    expect(safeNextPath("/orders?status=new")).toBe("/orders?status=new");
    expect(safeNextPath("/stores/abc/editor#top")).toBe("/stores/abc/editor#top");
  });

  it("falls back to / for anything that could leave the site", () => {
    for (const bad of [
      null,
      undefined,
      "",
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "@evil.com",
      "evil.com",
      "javascript:alert(1)",
      "/%2F%2Fevil.com",
      "/\t/evil.com",
    ]) {
      expect(safeNextPath(bad), String(bad)).toBe("/");
    }
  });

  it("uses the given fallback", () => {
    expect(safeNextPath("https://evil.com", "/signup")).toBe("/signup");
  });
});
