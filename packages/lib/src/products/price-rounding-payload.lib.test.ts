import { describe, expect, it } from "vitest";
import type { PriceRoundingRule } from "./price-rounding.lib";
import { priceHasDiscount, roundPricePayload, roundVariantPriceRow } from "./price-rounding-payload.lib";
import { buildAgentPrice } from "./agent-products.lib";

const up10: PriceRoundingRule = { enabled: true, tiers: [{ upTo: null, step: 10, direction: "up" }] };
const off: PriceRoundingRule = { ...up10, enabled: false };

describe("roundPricePayload", () => {
  it("returns the input unchanged without a rule or with the rule off", () => {
    const price = { base: 213, list: 213, final: 199, discountType: "amount", discountValue: 14 };
    expect(roundPricePayload(price, null)).toBe(price);
    expect(roundPricePayload(price, undefined)).toBe(price);
    expect(roundPricePayload(price, off)).toBe(price);
  });

  it("rounds the price and the compare-at price and recomputes the amount off", () => {
    expect(roundPricePayload({ base: 213, list: 213, final: 187, discountType: "amount", discountValue: 26 }, up10)).toEqual({
      base: 220,
      list: 220,
      final: 190,
      discountType: "amount",
      discountValue: 30,
    });
  });

  it("drops a discount the rounding makes fake, with its end date", () => {
    const rounded = roundPricePayload(
      { base: 213, list: 213, final: 211, discountType: "amount", discountValue: 2, discountEndsAt: "2026-12-01T00:00:00.000Z" },
      up10,
    );
    expect(rounded).toEqual({ base: 220, list: 220, final: 220, discountType: null, discountValue: null, discountEndsAt: null });
  });

  it("keeps a percent discount a percent and keeps extra keys", () => {
    const rounded = roundPricePayload({ base: 200, list: 200, final: 150, discountType: "percent", discountValue: 25, note: "x" }, up10) as Record<string, unknown>;
    expect(rounded).toMatchObject({ list: 200, final: 150, discountType: "percent", discountValue: 25, note: "x" });
  });

  it("fills a missing base and list from the other prices", () => {
    expect(roundPricePayload({ final: 101 }, up10)).toMatchObject({ base: 110, list: 110, final: 110, discountType: null });
  });

  it("leaves prices it can't read alone", () => {
    expect(roundPricePayload(null, up10)).toBeNull();
    expect(roundPricePayload(250, up10)).toBe(250);
    const zero = { base: 0, list: 0, final: 0, discountType: null, discountValue: null };
    expect(roundPricePayload(zero, up10)).toBe(zero);
  });

  it("rounds an agent price the same way", () => {
    const price = roundPricePayload(buildAgentPrice(1213, 1499, "2026-12-01T00:00:00.000Z"), up10);
    expect(price).toEqual({ base: 1500, list: 1500, final: 1220, discountType: "amount", discountValue: 280, discountEndsAt: "2026-12-01T00:00:00.000Z" });
  });
});

describe("roundVariantPriceRow", () => {
  it("clears the variant's discount end date when the discount is dropped", () => {
    const row = { sku: "A", price: { base: 213, list: 213, final: 211, discountType: "amount", discountValue: 2 }, discountEndsAt: "2026-12-01T00:00:00.000Z" };
    expect(roundVariantPriceRow(row, up10)).toEqual({
      sku: "A",
      price: { base: 220, list: 220, final: 220, discountType: null, discountValue: null },
      discountEndsAt: null,
    });
  });

  it("keeps the end date while the discount stays", () => {
    const row = { price: { base: 300, list: 300, final: 187, discountType: "amount", discountValue: 113 }, discountEndsAt: "2026-12-01T00:00:00.000Z" };
    expect(roundVariantPriceRow(row, up10).discountEndsAt).toBe("2026-12-01T00:00:00.000Z");
  });

  it("returns the row as it is without a rule", () => {
    const row = { price: { base: 213, list: 213, final: 211 }, discountEndsAt: null };
    expect(roundVariantPriceRow(row, null)).toBe(row);
  });
});

describe("priceHasDiscount", () => {
  it("is true only when the compare-at price is above the price", () => {
    expect(priceHasDiscount({ list: 200, final: 150 })).toBe(true);
    expect(priceHasDiscount({ list: 150, final: 150 })).toBe(false);
    expect(priceHasDiscount(null)).toBe(false);
  });
});
