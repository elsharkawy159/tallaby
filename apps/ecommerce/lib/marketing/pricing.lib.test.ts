import { describe, expect, it } from "vitest";
import { estimatePlans, extraEmailsCents, formatUsd, orderFee, PLAN_PRICES, proBreakEvenOrders, suggestedPrice } from "./pricing.lib";

describe("PLAN_PRICES", () => {
  it("matches the agreed prices", () => {
    expect(PLAN_PRICES.free).toEqual({ orderFeeCents: 3, aiCredits: 100, emails: 500 });
    expect(PLAN_PRICES.pro).toEqual({ monthlyCents: 2900, aiCredits: 2000, emails: 10_000 });
    expect(PLAN_PRICES.emailPack).toEqual({ emails: 1000, cents: 150 });
    expect(PLAN_PRICES.creditPack).toEqual({ credits: 100, cents: 100 });
    expect(PLAN_PRICES.topUp).toEqual({ minCents: 500, maxCents: 100_000 });
  });
});

describe("formatUsd", () => {
  it("shows cents only when there are any", () => {
    expect(formatUsd(3)).toBe("$0.03");
    expect(formatUsd(150)).toBe("$1.50");
    expect(formatUsd(2900)).toBe("$29");
    expect(formatUsd(100_000)).toBe("$1,000");
  });
});

describe("proBreakEvenOrders", () => {
  it("is where the order fees reach Pro's price", () => {
    expect(proBreakEvenOrders()).toBe(967);
  });
});

describe("extraEmailsCents", () => {
  it("is free inside the allowance", () => {
    expect(extraEmailsCents(500, 500)).toBe(0);
    expect(extraEmailsCents(0, 500)).toBe(0);
  });

  it("sells whole packs", () => {
    expect(extraEmailsCents(501, 500)).toBe(150);
    expect(extraEmailsCents(1500, 500)).toBe(150);
    expect(extraEmailsCents(1501, 500)).toBe(300);
  });
});

describe("estimatePlans", () => {
  it("charges Free per order and Pro a flat price", () => {
    expect(estimatePlans({ orders: 100, emails: 0 })).toEqual({
      freeCents: 300,
      proCents: 2900,
      cheaper: "free",
      savingCents: 2600,
    });
  });

  it("makes Pro cheaper past the break-even", () => {
    const estimate = estimatePlans({ orders: 2000, emails: 0 });
    expect(estimate.cheaper).toBe("pro");
    expect(estimate.freeCents).toBe(6000);
    expect(estimate.savingCents).toBe(3100);
  });

  it("uses each plan's own email allowance", () => {
    const estimate = estimatePlans({ orders: 0, emails: 2000 });
    expect(estimate.freeCents).toBe(300);
    expect(estimate.proCents).toBe(2900);
  });

  it("treats a negative order count as none", () => {
    expect(estimatePlans({ orders: -5, emails: 0 }).freeCents).toBe(0);
  });
});

describe("orderFee", () => {
  it("is flat for any positive order and zero for none", () => {
    expect(orderFee(150)).toBe(5);
    expect(orderFee(0)).toBe(0);
  });
});

describe("suggestedPrice", () => {
  it("matches the design's default inputs", () => {
    // (180 + 15 + 45) × 1.6 = 384, + 5 = 389 → 389
    expect(suggestedPrice({ unitCost: 180, packaging: 15, shipping: 45, marginPct: 60 })).toEqual({
      price: 389,
      cost: 240,
      fee: 5,
      profit: 144,
    });
  });

  it("treats empty and negative inputs as zero", () => {
    expect(suggestedPrice({ unitCost: Number.NaN, packaging: -4, shipping: 0, marginPct: 0 }).price).toBe(9);
  });
});
