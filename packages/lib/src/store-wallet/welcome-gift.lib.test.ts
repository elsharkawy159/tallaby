import { describe, expect, it } from "vitest";
import {
  WELCOME_GIFT_PIASTRES,
  giftDebtClearedPiastres,
  giftExpiryDebitPiastres,
  giftFromPiastres,
  giftRemainingPiastres,
  giftToPiastres,
} from "./welcome-gift.lib";

describe("welcome gift maths", () => {
  it("converts decimal strings and piastres exactly", () => {
    expect(giftToPiastres("100.00")).toBe(10_000);
    expect(giftToPiastres("-12.35")).toBe(-1_235);
    expect(giftToPiastres(null)).toBe(0);
    expect(giftToPiastres("abc")).toBe(0);
    expect(giftFromPiastres(10_000)).toBe("100.00");
    expect(giftFromPiastres(7_005)).toBe("70.05");
  });

  it("clears debt at grant time, never more than the gift", () => {
    expect(giftDebtClearedPiastres(0)).toBe(0);
    expect(giftDebtClearedPiastres(5_000)).toBe(0);
    expect(giftDebtClearedPiastres(-2_000)).toBe(2_000);
    expect(giftDebtClearedPiastres(-50_000)).toBe(WELCOME_GIFT_PIASTRES);
  });

  it("spends the gift on charges after the grant and the debt it cleared", () => {
    expect(giftRemainingPiastres({ giftPiastres: 10_000, debtClearedPiastres: 0, chargesNetPiastres: 0 })).toBe(10_000);
    // Six EGP 5 fees.
    expect(giftRemainingPiastres({ giftPiastres: 10_000, debtClearedPiastres: 0, chargesNetPiastres: -3_000 })).toBe(7_000);
    // A fee reversal gives some back.
    expect(giftRemainingPiastres({ giftPiastres: 10_000, debtClearedPiastres: 0, chargesNetPiastres: -2_500 })).toBe(7_500);
    // The gift cleared EGP 20 of debt.
    expect(giftRemainingPiastres({ giftPiastres: 10_000, debtClearedPiastres: 2_000, chargesNetPiastres: -1_000 })).toBe(7_000);
    // Spent in full, never negative.
    expect(giftRemainingPiastres({ giftPiastres: 10_000, debtClearedPiastres: 0, chargesNetPiastres: -15_000 })).toBe(0);
    // More refunds than charges never refill above the gift.
    expect(giftRemainingPiastres({ giftPiastres: 10_000, debtClearedPiastres: 0, chargesNetPiastres: 500 })).toBe(10_000);
  });

  it("takes back only the unspent gift and never pushes the wallet below zero", () => {
    expect(giftExpiryDebitPiastres({ remainingPiastres: 7_000, balancePiastres: 20_000 })).toBe(7_000);
    // Seller's own money is never taken: balance below the remaining gift.
    expect(giftExpiryDebitPiastres({ remainingPiastres: 7_000, balancePiastres: 3_000 })).toBe(3_000);
    expect(giftExpiryDebitPiastres({ remainingPiastres: 7_000, balancePiastres: 0 })).toBe(0);
    expect(giftExpiryDebitPiastres({ remainingPiastres: 7_000, balancePiastres: -500 })).toBe(0);
    expect(giftExpiryDebitPiastres({ remainingPiastres: 0, balancePiastres: 20_000 })).toBe(0);
  });
});
