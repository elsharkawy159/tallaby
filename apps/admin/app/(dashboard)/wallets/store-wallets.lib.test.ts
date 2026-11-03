import { describe, expect, it } from "vitest";
import { egp, topUpCreditLabel, walletMoney } from "./store-wallets.lib";

describe("walletMoney", () => {
  it("shows USD with a dollar sign and keeps the sign and cents", () => {
    expect(walletMoney("-0.03", "USD")).toBe("-$0.03");
    expect(walletMoney("29", "USD")).toBe("$29.00");
    expect(walletMoney(null, "USD")).toBe("$0.00");
  });

  it("treats anything else as EGP, including old rows with no currency", () => {
    expect(walletMoney("250", "EGP")).toBe(egp("250"));
    expect(walletMoney("250", null)).toBe(egp("250"));
  });
});

describe("topUpCreditLabel", () => {
  it("shows the saved USD credit, and nothing for an old EGP top-up", () => {
    expect(topUpCreditLabel({ creditAmount: "5.00", creditCurrency: "USD" })).toBe("$5.00");
    expect(topUpCreditLabel({ creditAmount: null, creditCurrency: null })).toBeNull();
  });
});
