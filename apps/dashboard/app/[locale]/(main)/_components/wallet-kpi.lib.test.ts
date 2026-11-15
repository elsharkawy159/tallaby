import { describe, expect, it } from "vitest";
import { walletKpiState } from "./wallet-kpi.lib";

describe("walletKpiState", () => {
  it("flags any amount below zero, even a piastre", () => {
    expect(walletKpiState(-0.01)).toBe("negative");
  });

  it("treats an empty wallet as zero", () => {
    expect(walletKpiState(0)).toBe("zero");
  });

  it("is positive above zero", () => {
    expect(walletKpiState(12.5)).toBe("positive");
  });
});
