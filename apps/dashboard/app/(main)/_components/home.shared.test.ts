import { describe, expect, it } from "vitest";
import { parseHomeChannel, resolveHomeChannel } from "./home.shared";

const STORE = "33333333-3333-4333-8333-333333333333";

describe("parseHomeChannel", () => {
  it("accepts all, marketplace and a store id", () => {
    expect(parseHomeChannel(undefined)).toBe("all");
    expect(parseHomeChannel("marketplace")).toBe("marketplace");
    expect(parseHomeChannel(STORE)).toBe(STORE);
    expect(parseHomeChannel([STORE, "x"])).toBe(STORE);
  });

  it("falls back to all for anything else", () => {
    expect(parseHomeChannel("'; drop table orders;--")).toBe("all");
    expect(parseHomeChannel("123")).toBe("all");
  });
});

describe("resolveHomeChannel", () => {
  it("keeps a store id only when it is one of the seller's stores", () => {
    expect(resolveHomeChannel(STORE, [STORE])).toBe(STORE);
    expect(resolveHomeChannel(STORE, ["44444444-4444-4444-8444-444444444444"])).toBe("all");
    expect(resolveHomeChannel("marketplace", [])).toBe("marketplace");
  });
});
