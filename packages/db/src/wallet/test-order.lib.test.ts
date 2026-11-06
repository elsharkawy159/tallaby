import { describe, expect, it } from "vitest";
import { orderMovesStock, orderPaysPlatformFee } from "./test-order.lib";

describe("test orders (F-76)", () => {
  it("never pay the platform fee", () => {
    expect(orderPaysPlatformFee({ isTest: true })).toBe(false);
  });

  it("leave real orders and old rows unchanged", () => {
    expect(orderPaysPlatformFee({ isTest: false })).toBe(true);
    expect(orderPaysPlatformFee({ isTest: null })).toBe(true);
    expect(orderPaysPlatformFee({})).toBe(true);
    expect(orderPaysPlatformFee(null)).toBe(true);
  });

  it("never move stock", () => {
    expect(orderMovesStock({ isTest: true })).toBe(false);
    expect(orderMovesStock({ isTest: false })).toBe(true);
    expect(orderMovesStock(undefined)).toBe(true);
  });
});
