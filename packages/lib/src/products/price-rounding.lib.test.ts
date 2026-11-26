import { describe, expect, it } from "vitest";
import {
  parsePriceRounding,
  priceRoundingSchema,
  readPriceRoundingSetting,
  roundPriceByRule,
  roundPriceJsonByRule,
  type PriceRoundingDirection,
  type PriceRoundingRule,
} from "./price-rounding.lib";
import { buildAgentPrice } from "./agent-products.lib";

const one = (step: number, direction: PriceRoundingDirection): PriceRoundingRule => ({
  enabled: true,
  tiers: [{ upTo: null, step, direction }],
});

const tiered: PriceRoundingRule = {
  enabled: true,
  tiers: [
    { upTo: 100, step: 5, direction: "up" },
    { upTo: 1000, step: 10, direction: "nearest" },
    { upTo: null, step: 50, direction: "down" },
  ],
};

describe("roundPriceByRule", () => {
  it("rounds up to the owner's steps", () => {
    expect(roundPriceByRule(1213, one(5, "up"))).toBe(1215);
    expect(roundPriceByRule(1213, one(10, "up"))).toBe(1220);
    expect(roundPriceByRule(1213, one(20, "up"))).toBe(1220);
    expect(roundPriceByRule(1213, one(50, "up"))).toBe(1250);
    expect(roundPriceByRule(1213, one(100, "up"))).toBe(1300);
    expect(roundPriceByRule(1200, one(100, "up"))).toBe(1200);
  });

  it("rounds down", () => {
    expect(roundPriceByRule(1249, one(50, "down"))).toBe(1200);
    expect(roundPriceByRule(1299.99, one(100, "down"))).toBe(1200);
    expect(roundPriceByRule(240, one(10, "down"))).toBe(240);
  });

  it("rounds to the nearest, half up", () => {
    expect(roundPriceByRule(1224.99, one(50, "nearest"))).toBe(1200);
    expect(roundPriceByRule(1225, one(50, "nearest"))).toBe(1250);
    expect(roundPriceByRule(1213, one(10, "nearest"))).toBe(1210);
    expect(roundPriceByRule(1215, one(10, "nearest"))).toBe(1220);
  });

  it("works in piastres", () => {
    expect(roundPriceByRule(199.99, one(1, "up"))).toBe(200);
    expect(roundPriceByRule(199.99, one(1, "down"))).toBe(199);
    expect(roundPriceByRule(199.99, one(5, "nearest"))).toBe(200);
    expect(roundPriceByRule(0.1 + 0.2, one(1, "up"))).toBe(1);
    expect(roundPriceByRule(10.005, one(1, "down"))).toBe(10);
  });

  it("never rounds to 0: one step instead", () => {
    expect(roundPriceByRule(3, one(5, "down"))).toBe(5);
    expect(roundPriceByRule(20, one(100, "nearest"))).toBe(100);
    expect(roundPriceByRule(0.01, one(50, "down"))).toBe(50);
  });

  it("returns 0 for non-positive or non-finite input", () => {
    expect(roundPriceByRule(0, one(5, "up"))).toBe(0);
    expect(roundPriceByRule(-10, one(5, "up"))).toBe(0);
    expect(roundPriceByRule(Number.NaN, one(5, "up"))).toBe(0);
    expect(roundPriceByRule(Number.POSITIVE_INFINITY, one(5, "up"))).toBe(0);
  });

  it("picks the tier by the price before rounding, upTo included", () => {
    expect(roundPriceByRule(99, tiered)).toBe(100); // tier 1, up 5
    expect(roundPriceByRule(100, tiered)).toBe(100); // exactly upTo: tier 1
    expect(roundPriceByRule(100.01, tiered)).toBe(100); // tier 2, nearest 10
    expect(roundPriceByRule(1000, tiered)).toBe(1000); // exactly upTo: tier 2
    expect(roundPriceByRule(1004, tiered)).toBe(1000); // tier 3, down 50
    expect(roundPriceByRule(1213, tiered)).toBe(1200);
    expect(roundPriceByRule(96.5, tiered)).toBe(100);
  });

  it("is a no-op without a rule or with the rule off", () => {
    expect(roundPriceByRule(1213.456, null)).toBe(1213.46);
    expect(roundPriceByRule(1213, { ...one(50, "up"), enabled: false })).toBe(1213);
    expect(roundPriceByRule(-1, null)).toBe(0);
  });
});

describe("roundPriceJsonByRule", () => {
  it("rounds the price and the compare-at price and keeps the discount", () => {
    const out = roundPriceJsonByRule(buildAgentPrice(1213, 1490, "2026-12-01T00:00:00.000Z"), one(50, "up"));
    expect(out).toEqual({ base: 1500, list: 1500, final: 1250, discountType: "amount", discountValue: 250, discountEndsAt: "2026-12-01T00:00:00.000Z" });
  });

  it("drops the discount when the rounded compare-at price is not higher", () => {
    const out = roundPriceJsonByRule(buildAgentPrice(1213, 1240, "2026-12-01T00:00:00.000Z"), one(50, "up"));
    expect(out).toEqual({ base: 1250, list: 1250, final: 1250, discountType: null, discountValue: null, discountEndsAt: null });
  });

  it("keeps a percent discount a percent", () => {
    const out = roundPriceJsonByRule({ base: 999, list: 999, final: 799.2, discountType: "percent" as const, discountValue: 20 }, one(10, "nearest"));
    expect(out).toEqual({ base: 1000, list: 1000, final: 800, discountType: "percent", discountValue: 20 });
    expect("discountEndsAt" in out).toBe(false);
  });

  it("rounds a price with no discount", () => {
    expect(roundPriceJsonByRule(buildAgentPrice(243), one(5, "up"))).toEqual({
      base: 245,
      list: 245,
      final: 245,
      discountType: null,
      discountValue: null,
      discountEndsAt: null,
    });
  });

  it("returns the input unchanged without a rule or with the rule off", () => {
    const price = buildAgentPrice(1213.5, 1490);
    expect(roundPriceJsonByRule(price, null)).toBe(price);
    expect(roundPriceJsonByRule(price, { ...one(50, "up"), enabled: false })).toBe(price);
  });
});

describe("priceRoundingSchema", () => {
  const ok = (rule: unknown) => priceRoundingSchema.safeParse(rule).success;

  it("accepts valid rules", () => {
    expect(ok(one(5, "up"))).toBe(true);
    expect(ok(tiered)).toBe(true);
    expect(ok({ enabled: false, tiers: [{ upTo: 99.99, step: 1, direction: "down" }, { upTo: null, step: 10000, direction: "nearest" }] })).toBe(true);
  });

  it("rejects bad tiers", () => {
    const tier = (upTo: number | null, step = 5) => ({ upTo, step, direction: "up" });
    expect(ok({ enabled: true, tiers: [] })).toBe(false);
    expect(ok({ enabled: true, tiers: [tier(100), tier(100), tier(null)] })).toBe(false); // not increasing
    expect(ok({ enabled: true, tiers: [tier(200), tier(100), tier(null)] })).toBe(false);
    expect(ok({ enabled: true, tiers: [tier(null), tier(100)] })).toBe(false); // null not last
    expect(ok({ enabled: true, tiers: [tier(100)] })).toBe(false); // last not open
    expect(ok({ enabled: true, tiers: [tier(null), tier(null)] })).toBe(false);
    expect(ok({ enabled: true, tiers: [tier(10), tier(20), tier(30), tier(40), tier(50), tier(null)] })).toBe(false); // 6 tiers
    expect(ok({ enabled: true, tiers: [tier(null, 0)] })).toBe(false);
    expect(ok({ enabled: true, tiers: [tier(null, 1.5)] })).toBe(false);
    expect(ok({ enabled: true, tiers: [tier(null, 10001)] })).toBe(false);
    expect(ok({ enabled: true, tiers: [tier(0), tier(null)] })).toBe(false);
    expect(ok({ enabled: true, tiers: [tier(-5), tier(null)] })).toBe(false);
    expect(ok({ enabled: true, tiers: [tier(10.005), tier(null)] })).toBe(false);
    expect(ok({ enabled: true, tiers: [{ upTo: null, step: 5, direction: "sideways" }] })).toBe(false);
    expect(ok({ enabled: "yes", tiers: [tier(null)] })).toBe(false);
  });
});

describe("parsePriceRounding / readPriceRoundingSetting", () => {
  it("reads a valid rule that is on", () => {
    expect(parsePriceRounding({ priceRounding: tiered, other: 1 })).toEqual(tiered);
  });

  it("returns null when missing, invalid or off", () => {
    expect(parsePriceRounding(null)).toBeNull();
    expect(parsePriceRounding({})).toBeNull();
    expect(parsePriceRounding({ priceRounding: { enabled: true, tiers: [] } })).toBeNull();
    expect(parsePriceRounding({ priceRounding: { ...tiered, enabled: false } })).toBeNull();
  });

  it("readPriceRoundingSetting keeps a rule that is off", () => {
    expect(readPriceRoundingSetting({ priceRounding: { ...tiered, enabled: false } })).toEqual({ ...tiered, enabled: false });
    expect(readPriceRoundingSetting({ priceRounding: "bad" })).toBeNull();
  });
});
