import { describe, expect, it } from "vitest";
import { savedLocaleHref } from "./saved-locale-href.lib";

describe("savedLocaleHref", () => {
  it("keeps Arabic (and a missing or unknown cookie) unprefixed", () => {
    expect(savedLocaleHref("/stores/a/apps?x=1", "ar")).toBe("/stores/a/apps?x=1");
    expect(savedLocaleHref("/login", undefined)).toBe("/login");
    expect(savedLocaleHref("/login", "fr")).toBe("/login");
  });

  it("prefixes English, without a trailing slash on the home page", () => {
    expect(savedLocaleHref("/stores/a/apps?google=ok", "en")).toBe("/en/stores/a/apps?google=ok");
    expect(savedLocaleHref("/", "en")).toBe("/en");
    expect(savedLocaleHref("/?google=invalid", "en")).toBe("/en?google=invalid");
  });

  it("never prefixes a route handler", () => {
    expect(savedLocaleHref("/api/store-build/claim?intake=1", "en")).toBe("/api/store-build/claim?intake=1");
  });
});
