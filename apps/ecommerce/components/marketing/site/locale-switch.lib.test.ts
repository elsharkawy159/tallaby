import { describe, expect, it } from "vitest";
import { localeSwitchHref } from "./locale-switch.lib";

describe("localeSwitchHref", () => {
  it("links to Arabic without the /ar prefix", () => {
    expect(localeSwitchHref("/", "ar")).toBe("/");
    expect(localeSwitchHref("/pricing", "ar")).toBe("/pricing");
    expect(localeSwitchHref("/templates/glow", "ar")).toBe("/templates/glow");
  });

  it("prefixes English", () => {
    expect(localeSwitchHref("/", "en")).toBe("/en");
    expect(localeSwitchHref("/pricing", "en")).toBe("/en/pricing");
  });
});
