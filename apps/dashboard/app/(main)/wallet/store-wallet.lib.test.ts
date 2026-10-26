import { describe, expect, it } from "vitest";
import { FEE_PER_ORDER_EGP, ordersCovered, stepTopUpAmount } from "./store-wallet.lib";

describe("ordersCovered", () => {
  it("divides by the flat fee and rounds down", () => {
    expect(FEE_PER_ORDER_EGP).toBe(5);
    expect(ordersCovered(538.2)).toBe(107);
    expect(ordersCovered(250)).toBe(50);
  });

  it("covers nothing at zero or below", () => {
    expect(ordersCovered(0)).toBe(0);
    expect(ordersCovered(-40)).toBe(0);
  });
});

describe("stepTopUpAmount", () => {
  it("moves by the step within the limits", () => {
    expect(stepTopUpAmount(250, 50)).toBe(300);
    expect(stepTopUpAmount(100, -50)).toBe(100);
    expect(stepTopUpAmount(19_980, 50)).toBe(20_000);
    expect(stepTopUpAmount(0, 50)).toBe(100);
  });
});
