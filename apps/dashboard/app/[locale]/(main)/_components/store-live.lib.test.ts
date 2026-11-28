import { describe, expect, it } from "vitest";
import { parseLiveSite } from "./store-live.lib";

describe("parseLiveSite", () => {
  it("keeps a live site with an http(s) URL and a hostname", () => {
    expect(parseLiveSite({ url: "https://shop.tallaby.com", hostname: "shop.tallaby.com" })).toEqual({ url: "https://shop.tallaby.com", hostname: "shop.tallaby.com" });
    expect(parseLiveSite({ url: "http://shop.localhost:3000", hostname: "shop.localhost" })).toEqual({ url: "http://shop.localhost:3000", hostname: "shop.localhost" });
  });

  it.each([
    null,
    undefined,
    "https://shop.tallaby.com",
    {},
    { url: "https://shop.tallaby.com" },
    { url: "https://shop.tallaby.com", hostname: "" },
    { url: "not a url", hostname: "shop" },
    { url: "javascript:alert(1)", hostname: "shop" },
  ])("rejects %j", (value) => {
    expect(parseLiveSite(value)).toBeNull();
  });
});
