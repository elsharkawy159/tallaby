import { describe, expect, it } from "vitest";
import {
  DEPOSIT_EXPIRY_HOURS,
  cashDuePiastres,
  codDepositFor,
  computeDepositPiastres,
  depositCutoff,
  depositPayable,
  isDepositPending,
  parseCodDeposit,
  readOrderDeposit,
  splitDeposit,
  validateCodDepositChange,
} from "./cod-deposit.lib";

describe("computeDepositPiastres (owner rule: round UP to the nearest 5, never above the total)", () => {
  it("matches the ROADMAP F-21 examples at 20 %", () => {
    expect(computeDepositPiastres(120_000, 20)).toBe(24_000);
    expect(computeDepositPiastres(119_900, 20)).toBe(24_000);
    expect(computeDepositPiastres(121_300, 20)).toBe(24_500);
    expect(computeDepositPiastres(122_600, 20)).toBe(25_000);
  });

  it("works for every offered percent", () => {
    expect(computeDepositPiastres(100_000, 10)).toBe(10_000);
    expect(computeDepositPiastres(100_100, 10)).toBe(10_500);
    expect(computeDepositPiastres(99_900, 30)).toBe(30_000);
    expect(computeDepositPiastres(99_900, 50)).toBe(50_000);
  });

  it("never asks for more than the total on small orders", () => {
    expect(computeDepositPiastres(700, 50)).toBe(500);
    expect(computeDepositPiastres(300, 50)).toBe(300);
    expect(computeDepositPiastres(100, 10)).toBe(100);
  });

  it("is 0 for an empty or invalid total", () => {
    expect(computeDepositPiastres(0, 20)).toBe(0);
    expect(computeDepositPiastres(-500, 20)).toBe(0);
    expect(computeDepositPiastres(Number.NaN, 20)).toBe(0);
  });
});

describe("splitDeposit", () => {
  it("returns the deposit and the cash left for delivery", () => {
    expect(splitDeposit(1213, 20)).toEqual({ depositPiastres: 24_500, remainderPiastres: 96_800 });
    expect(splitDeposit("1200.00", 50)).toEqual({ depositPiastres: 60_000, remainderPiastres: 60_000 });
  });

  it("leaves nothing for delivery when the deposit is capped at the total", () => {
    expect(splitDeposit(3, 50)).toEqual({ depositPiastres: 300, remainderPiastres: 0 });
  });
});

describe("parseCodDeposit", () => {
  it("accepts only the offered percents", () => {
    expect(parseCodDeposit({ codDeposit: { percent: 20 } })).toEqual({ percent: 20 });
    expect(parseCodDeposit({ codDeposit: { percent: 25 } })).toBeNull();
    expect(parseCodDeposit({ codDeposit: { percent: "20" } })).toBeNull();
    expect(parseCodDeposit({})).toBeNull();
    expect(parseCodDeposit(null)).toBeNull();
  });
});

describe("depositPayable / codDepositFor", () => {
  const transfer = { instapay: { method: "instapay" as const, holderName: "Ali", ipa: "ali@instapay" } };

  it("needs the seller's gateway or at least one seller transfer", () => {
    expect(depositPayable({ gateway: null, transfers: {} })).toBe(false);
    expect(depositPayable({ gateway: { provider: "kashier", integrationId: "x" }, transfers: {} })).toBe(true);
    expect(depositPayable({ gateway: null, transfers: transfer })).toBe(true);
  });

  it("is offered only with COD on, a valid percent and a way to pay", () => {
    expect(codDepositFor({ codEnabled: true, setting: { percent: 30 }, payable: true })).toEqual({ percent: 30 });
    expect(codDepositFor({ codEnabled: false, setting: { percent: 30 }, payable: true })).toBeNull();
    expect(codDepositFor({ codEnabled: true, setting: null, payable: true })).toBeNull();
    expect(codDepositFor({ codEnabled: true, setting: { percent: 30 }, payable: false })).toBeNull();
  });
});

describe("validateCodDepositChange", () => {
  it("turns it on with an offered percent when payable", () => {
    expect(validateCodDepositChange(20, { codEnabled: true, payable: true })).toEqual({ success: true, data: { percent: 20 } });
  });
  it("turns it off whatever the state", () => {
    expect(validateCodDepositChange(null, { codEnabled: false, payable: false })).toEqual({ success: true, data: null });
  });
  it("refuses an unknown percent", () => {
    expect(validateCodDepositChange(15, { codEnabled: true, payable: true })).toEqual({ success: false, error: "invalid_percent" });
  });
  it("refuses without cash on delivery or a way to pay", () => {
    expect(validateCodDepositChange(20, { codEnabled: false, payable: true })).toEqual({ success: false, error: "cod_off" });
    expect(validateCodDepositChange(20, { codEnabled: true, payable: false })).toEqual({ success: false, error: "no_payment_method" });
  });
});

describe("order deposit state", () => {
  it("pending covers awaiting and reported, not paid", () => {
    expect(isDepositPending("awaiting")).toBe(true);
    expect(isDepositPending("reported")).toBe(true);
    expect(isDepositPending("paid")).toBe(false);
    expect(isDepositPending(null)).toBe(false);
  });

  it("cash due at the door is the remainder once the deposit is paid", () => {
    expect(cashDuePiastres({ totalAmount: "1213.00", depositAmount: "245.00", depositStatus: "paid" })).toBe(96_800);
    expect(cashDuePiastres({ totalAmount: "1213.00", depositAmount: "245.00", depositStatus: "awaiting" })).toBe(121_300);
    expect(cashDuePiastres({ totalAmount: "1213.00", depositAmount: null, depositStatus: null })).toBe(121_300);
    expect(cashDuePiastres({ totalAmount: "100.00", depositAmount: "150.00", depositStatus: "paid" })).toBe(0);
  });

  it("reads the order's deposit, or null for an order without one", () => {
    expect(readOrderDeposit({ totalAmount: "1200.00", depositAmount: "240.00", depositPercent: 20, depositStatus: "awaiting" })).toEqual({
      percent: 20,
      status: "awaiting",
      amountPiastres: 24_000,
      remainderPiastres: 96_000,
    });
    expect(readOrderDeposit({ totalAmount: "1200.00", depositAmount: null, depositPercent: null, depositStatus: null })).toBeNull();
    expect(readOrderDeposit({ totalAmount: "1200.00", depositAmount: "240.00", depositPercent: 20, depositStatus: "weird" })).toBeNull();
  });
});

describe("depositCutoff (cron selection)", () => {
  it("is 48 hours before now", () => {
    expect(DEPOSIT_EXPIRY_HOURS).toBe(48);
    const now = new Date("2026-11-12T12:00:00Z");
    expect(depositCutoff(now).toISOString()).toBe("2026-11-10T12:00:00.000Z");
  });
});
