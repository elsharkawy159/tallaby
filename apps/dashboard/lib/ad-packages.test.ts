import { describe, expect, it } from "vitest";
import { adWalletAmount } from "./ad-packages";

describe("adWalletAmount", () => {
  it("is the EGP price while the wallet is in EGP", () => {
    expect(adWalletAmount(1500, null)).toBe("1500.00");
  });

  it("is the USD equivalent for a USD wallet, never zero", () => {
    expect(adWalletAmount(1500, 50)).toBe("30.00");
    expect(adWalletAmount(0.1, 50)).toBe("0.01");
  });
});
