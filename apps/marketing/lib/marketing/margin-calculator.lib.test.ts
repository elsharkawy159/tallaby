import { describe, expect, it } from "vitest";
import {
  calculateMargin,
  DEFAULT_MARGIN_INPUT,
  marginSegments,
  markupPct,
  parseAmount,
  planFeeEgp,
  type MarginInput,
} from "./margin-calculator.lib";

const input = (over: Partial<MarginInput> = {}): MarginInput => ({ ...DEFAULT_MARGIN_INPUT, ...over });

describe("planFeeEgp", () => {
  it("charges Free $0.03 at the given rate and Pro nothing per order", () => {
    expect(planFeeEgp("free", 50)).toBe(1.5);
    expect(planFeeEgp("free", 48.37)).toBe(1.46); // 1.4511 rounds up to the piastre
    expect(planFeeEgp("pro", 50)).toBe(0);
  });

  it("treats a bad rate as zero", () => {
    expect(planFeeEgp("free", Number.NaN)).toBe(0);
    expect(planFeeEgp("free", -5)).toBe(0);
  });
});

describe("calculateMargin", () => {
  it("works the page's example", () => {
    const result = calculateMargin(input());
    expect(result.fee).toBe(1.5);
    expect(result.cost).toBe(306.5);
    expect(result.profit).toBe(143.5);
    expect(result.marginPct).toBeCloseTo(31.89, 2);
    expect(result.suggestedPrice).toBe(438);
    expect(result.breakEvenPrice).toBe(307);
    expect(result.status).toBe("good");
  });

  it("leaves the fee out on Pro", () => {
    const result = calculateMargin(input({ plan: "pro" }));
    expect(result.fee).toBe(0);
    expect(result.cost).toBe(305);
    expect(result.profit).toBe(145);
  });

  it("flags a loss, a low margin and a missing price", () => {
    expect(calculateMargin(input({ sell: 300 })).status).toBe("loss");
    expect(calculateMargin(input({ sell: 400 })).status).toBe("low");
    const empty = calculateMargin(input({ sell: 0 }));
    expect(empty.status).toBe("needs-price");
    expect(empty.marginPct).toBeNull();
  });

  it("has no suggested price without costs, and no float noise", () => {
    const none = calculateMargin(input({ buy: 0, ship: 0, ad: 0, plan: "pro" }));
    expect(none.suggestedPrice).toBeNull();
    expect(calculateMargin(input({ buy: 0.1, ship: 0.2, ad: 0, plan: "pro", sell: 1 })).cost).toBe(0.3);
  });

  it("ignores negative and invalid amounts", () => {
    const result = calculateMargin(input({ buy: -10, ship: Number.NaN, ad: 0, plan: "pro", sell: 100 }));
    expect(result.cost).toBe(0);
    expect(result.profit).toBe(100);
  });
});

describe("parseAmount", () => {
  it("reads Arabic digits and either decimal mark", () => {
    expect(parseAmount("٤٥٠")).toBe(450);
    expect(parseAmount("١٢٫٥")).toBe(12.5);
    expect(parseAmount("12,5")).toBe(12.5);
    expect(parseAmount("450 ج.م")).toBe(450);
  });

  it("is 0 for nothing usable", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("abc")).toBe(0);
  });
});

describe("markupPct and marginSegments", () => {
  it("measures markup against cost", () => {
    expect(markupPct(150, 300)).toBe(50);
    expect(markupPct(10, 0)).toBe(0);
  });

  it("adds the profit only when there is one, and drops empty parts", () => {
    const value = input({ plan: "pro" });
    const parts = marginSegments(value, calculateMargin(value));
    expect(parts.map((part) => part.id)).toEqual(["buy", "ship", "ad", "profit"]);
    expect(parts.reduce((sum, part) => sum + part.pct, 0)).toBeCloseTo(100, 5);
    const loss = input({ sell: 100 });
    expect(marginSegments(loss, calculateMargin(loss)).some((part) => part.id === "profit")).toBe(false);
  });
});
