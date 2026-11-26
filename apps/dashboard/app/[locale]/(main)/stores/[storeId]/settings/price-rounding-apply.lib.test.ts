import { describe, expect, it } from "vitest";
import type { PriceRoundingRule } from "@workspace/lib/products/price-rounding";
import { planPriceRounding, planStoreRounding } from "./price-rounding-apply.lib";

const up10: PriceRoundingRule = { enabled: true, tiers: [{ upTo: null, step: 10, direction: "up" }] };
const plain = (amount: number) => ({ base: amount, list: amount, final: amount, discountType: null, discountValue: null });

describe("planPriceRounding", () => {
  it("rounds a plain price", () => {
    const change = planPriceRounding(plain(243), up10)!;
    expect(change).toMatchObject({ oldFinal: 243, newFinal: 250, oldCompareAt: null, newCompareAt: null, discountRemoved: false });
    expect(change.next).toEqual(plain(250));
    expect(change.prev).toEqual(plain(243));
  });

  it("returns null when the price is already round", () => {
    expect(planPriceRounding(plain(250), up10)).toBeNull();
  });

  it("rounds a discount and keeps extra keys", () => {
    const price = { base: 300, list: 300, final: 243, discountType: "amount", discountValue: 57, discountEndsAt: "2026-12-01T00:00:00.000Z", extra: 1 };
    const change = planPriceRounding(price, up10)!;
    expect(change).toMatchObject({ oldFinal: 243, newFinal: 250, oldCompareAt: 300, newCompareAt: 300, discountRemoved: false });
    expect(change.next).toMatchObject({ final: 250, list: 300, discountType: "amount", discountValue: 50, discountEndsAt: "2026-12-01T00:00:00.000Z", extra: 1 });
  });

  it("flags a dropped discount", () => {
    const price = { base: 245, list: 245, final: 241, discountType: "amount", discountValue: 4, discountEndsAt: "2026-12-01T00:00:00.000Z" };
    const change = planPriceRounding(price, up10)!;
    expect(change).toMatchObject({ oldCompareAt: 245, newFinal: 250, newCompareAt: null, discountRemoved: true });
    expect(change.next).toMatchObject({ base: 250, list: 250, final: 250, discountType: null, discountValue: null, discountEndsAt: null });
  });

  it("fills a missing list and base from final", () => {
    const change = planPriceRounding({ final: "243" }, up10)!;
    expect(change.next).toMatchObject({ base: 250, list: 250, final: 250 });
  });

  it("leaves scalars, arrays, missing and non-positive prices alone", () => {
    expect(planPriceRounding(243, up10)).toBeNull();
    expect(planPriceRounding(null, up10)).toBeNull();
    expect(planPriceRounding([243], up10)).toBeNull();
    expect(planPriceRounding({ final: 0 }, up10)).toBeNull();
    expect(planPriceRounding({ list: 243 }, up10)).toBeNull();
  });
});

describe("planStoreRounding", () => {
  it("returns products whose own price or a variant's changes, in input order, with totals", () => {
    const products = [
      { id: "a", price: plain(250) },
      { id: "b", price: plain(243) },
      { id: "c", price: plain(100) },
    ];
    const variants = [
      { id: "a1", productId: "a", title: "S", price: plain(251) },
      { id: "a2", productId: "a", title: "M", price: plain(260) },
      { id: "a3", productId: "a", title: "L", price: null },
      { id: "x1", productId: "x", title: "Other", price: plain(1) },
    ];
    const { plans, productCount, variantCount } = planStoreRounding(products, variants, up10);
    expect(plans.map((p) => p.id)).toEqual(["a", "b"]);
    expect(plans[0]!.change).toBeNull();
    expect(plans[0]!.variants.map((v) => v.id)).toEqual(["a1"]);
    expect(plans[1]!.variants).toEqual([]);
    expect(productCount).toBe(1);
    expect(variantCount).toBe(1);
  });
});
