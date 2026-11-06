import { describe, expect, it } from "vitest";
import { quoteTopUp } from "@workspace/lib/billing";
import { estimatePlans, formatEgp, formatUsd, orderFee, PLAN_PRICES, proBreakEvenOrders, proBreakEvenOrdersShown, suggestedPrice, usdCentsToEgp } from "./pricing.lib";

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
  it("is shown rounded up to a clean hundred", () => {
    expect(proBreakEvenOrdersShown()).toBe(1000);
  });
});

describe("usdCentsToEgp", () => {
  const billing = { marketRate: 49.8567, taxEnabled: false, taxRateBps: 1400 };

  it("matches /wallet's top-up quote for whole dollars", () => {
    for (const cents of [100, 500, 2900, 4321, 100_000]) {
      expect(usdCentsToEgp(cents, billing.marketRate)).toBe(quoteTopUp(cents, billing)!.basePiastres / 100);
    }
    expect(usdCentsToEgp(2900, 49.8567)).toBe(1445);
  });

  it("keeps the piastres under a dollar, rounded up", () => {
    expect(usdCentsToEgp(3, 50)).toBe(1.5);
    expect(usdCentsToEgp(3, 49.8567)).toBe(1.5);
    expect(usdCentsToEgp(3, 47.12)).toBe(1.42);
  });

  it("formats like /wallet: Latin digits, up to two decimals", () => {
    expect(formatEgp(1445)).toBe("1,445");
    expect(formatEgp(49.8567)).toBe("49.86");
    expect(formatEgp(1.5)).toBe("1.5");
  });
});

describe("estimatePlans", () => {
  it("charges Free per order and Pro a flat price", () => {
    expect(estimatePlans({ orders: 100 })).toEqual({
      freeCents: 300,
      proCents: 2900,
      cheaper: "free",
      savingCents: 2600,
    });
  });

  it("makes Pro cheaper past the break-even", () => {
    const estimate = estimatePlans({ orders: 2000 });
    expect(estimate.cheaper).toBe("pro");
    expect(estimate.freeCents).toBe(6000);
    expect(estimate.savingCents).toBe(3100);
  });

  it("counts only orders: emails and packs are not in the estimate", () => {
    expect(estimatePlans({ orders: 0 })).toEqual({ freeCents: 0, proCents: 2900, cheaper: "free", savingCents: 2900 });
  });

  it("treats a negative order count as none", () => {
    expect(estimatePlans({ orders: -5 }).freeCents).toBe(0);
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
