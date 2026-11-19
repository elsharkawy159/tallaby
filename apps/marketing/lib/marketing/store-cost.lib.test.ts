import { describe, expect, it } from "vitest";
import { FREE_ORDER_FEE_USD_CENTS, PRO_MONTHLY_USD_CENTS } from "@workspace/lib/billing";
import { calculateStoreCost, DEFAULT_STORE_COST_INPUT } from "./store-cost.lib";
import { proBreakEvenOrders } from "./pricing.lib";

const base = { ...DEFAULT_STORE_COST_INPUT, egpPerUsd: 50 };

describe("calculateStoreCost", () => {
  it("prices Free per order and Pro per month from the billing module, at the given rate", () => {
    const out = calculateStoreCost({ ...base, orders: 100, cardShare: 0, domainYearly: 0 });
    expect(out.free.platform).toBe((100 * FREE_ORDER_FEE_USD_CENTS * 50) / 100);
    expect(out.pro.platform).toBe((PRO_MONTHLY_USD_CENTS * 50) / 100);
    expect(out.free.gateway).toBe(0);
    expect(out.free.total).toBe(out.free.platform);
    expect(out.cheaper).toBe("free");
  });

  it("adds the gateway on card orders only, in whole piastres", () => {
    // 300 orders, 20% by card = 60 payments; 3% of 450 = 13.50 + 1.25 fixed = 14.75 each.
    const out = calculateStoreCost({ ...base, orders: 300, cardShare: 20, averageOrder: 450, gatewayPct: 3, gatewayFixed: 1.25 });
    expect(out.cardOrders).toBe(60);
    expect(out.free.gateway).toBe(885);
    expect(out.pro.gateway).toBe(885);
  });

  it("spreads a yearly domain over 12 months, rounded up to the piastre", () => {
    const out = calculateStoreCost({ ...base, domainYearly: 700 });
    expect(out.free.domain).toBe(58.34);
    expect(out.pro.domain).toBe(58.34);
  });

  it("switches to Pro at the break-even order count, whatever the rate", () => {
    const n = proBreakEvenOrders();
    for (const rate of [50, 53.9007]) {
      expect(calculateStoreCost({ ...base, egpPerUsd: rate, orders: n - 1 }).cheaper).toBe("free");
      expect(calculateStoreCost({ ...base, egpPerUsd: 50, orders: n + 50 }).cheaper).toBe("pro");
    }
    expect(calculateStoreCost(base).breakEvenOrders).toBe(n);
  });

  it("never returns float noise or negatives for bad input", () => {
    const out = calculateStoreCost({ ...base, orders: -5, averageOrder: Number.NaN, cardShare: 150, gatewayPct: -1, gatewayFixed: 0.1 + 0.2, domainYearly: -10 });
    expect(out.free.platform).toBe(0);
    expect(out.free.domain).toBe(0);
    expect(out.free.perOrder).toBe(0);
    for (const value of Object.values(out.pro)) expect(Math.round(value * 100)).toBe(value * 100);
  });

  it("works out the cost per order and the saving", () => {
    const out = calculateStoreCost({ ...base, orders: 2000, cardShare: 0 });
    expect(out.cheaper).toBe("pro");
    expect(out.saving).toBe(out.free.platform - out.pro.platform);
    expect(out.pro.perOrder).toBe(Math.round((out.pro.total * 100) / 2000) / 100);
  });
});
