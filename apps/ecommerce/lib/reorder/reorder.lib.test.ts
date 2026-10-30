import { describe, expect, it } from "vitest";
import { buildReorderLines, reorderCartKey, type ReorderProduct } from "./reorder.lib";

const seller = "seller-1";
const product = (over: Partial<ReorderProduct> & { id: string }): ReorderProduct => ({
  sellerId: seller,
  status: "active",
  deletedAt: null,
  quantity: 10,
  inCatalog: true,
  variants: [],
  ...over,
});

describe("buildReorderLines", () => {
  it("puts back available lines with their quantities", () => {
    const plan = buildReorderLines(
      [
        { productId: "a", variantId: null, quantity: 2 },
        { productId: "b", variantId: "b-red", quantity: 1 },
      ],
      [product({ id: "a" }), product({ id: "b", variants: [{ id: "b-red", stock: 4 }] })],
      { sellerId: seller },
    );
    expect(plan.lines).toEqual([
      { productId: "a", variantId: null, quantity: 2, requested: 2 },
      { productId: "b", variantId: "b-red", quantity: 1, requested: 1 },
    ]);
    expect(plan.skipped).toEqual([]);
    expect(plan.capped).toBe(0);
  });

  it("skips products that are gone, inactive, trashed, another seller's or outside the store catalog", () => {
    const plan = buildReorderLines(
      ["gone", "draft", "trash", "other", "picks"].map((id) => ({ productId: id, variantId: null, quantity: 1 })),
      [
        product({ id: "draft", status: "draft" }),
        product({ id: "trash", deletedAt: "2026-10-30T00:00:00Z" }),
        product({ id: "other", sellerId: "seller-2" }),
        product({ id: "picks", inCatalog: false }),
      ],
      { sellerId: seller },
    );
    expect(plan.lines).toEqual([]);
    expect(plan.skipped.map((s) => [s.productId, s.reason])).toEqual([
      ["gone", "unavailable"],
      ["draft", "unavailable"],
      ["trash", "unavailable"],
      ["other", "unavailable"],
      ["picks", "unavailable"],
    ]);
  });

  it("skips a deleted variant, and a variant-less line when the product now has variants", () => {
    const plan = buildReorderLines(
      [
        { productId: "a", variantId: "old", quantity: 1 },
        { productId: "b", variantId: null, quantity: 1 },
      ],
      [product({ id: "a", variants: [{ id: "new", stock: 5 }] }), product({ id: "b", variants: [{ id: "x", stock: 5 }] })],
      { sellerId: seller },
    );
    expect(plan.lines).toEqual([]);
    expect(plan.skipped.map((s) => s.reason)).toEqual(["unavailable", "unavailable"]);
  });

  it("caps by the stock left after the cart, and skips sold-out lines", () => {
    const plan = buildReorderLines(
      [
        { productId: "a", variantId: null, quantity: 5 },
        { productId: "b", variantId: "v", quantity: 2 },
        { productId: "c", variantId: null, quantity: 1 },
      ],
      [product({ id: "a", quantity: 4 }), product({ id: "b", variants: [{ id: "v", stock: 3 }] }), product({ id: "c", quantity: 0 })],
      { sellerId: seller, inCart: new Map([[reorderCartKey("a", null), 1], [reorderCartKey("b", "v"), 3]]) },
    );
    expect(plan.lines).toEqual([{ productId: "a", variantId: null, quantity: 3, requested: 5 }]);
    expect(plan.capped).toBe(1);
    expect(plan.skipped).toEqual([
      { productId: "b", variantId: "v", reason: "outOfStock" },
      { productId: "c", variantId: null, reason: "outOfStock" },
    ]);
  });

  it("merges the same product and variant ordered twice, and ignores zero quantities", () => {
    const plan = buildReorderLines(
      [
        { productId: "a", variantId: null, quantity: 1 },
        { productId: "a", variantId: null, quantity: 2 },
        { productId: "b", variantId: null, quantity: 0 },
      ],
      [product({ id: "a" }), product({ id: "b" })],
      { sellerId: seller },
    );
    expect(plan.lines).toEqual([{ productId: "a", variantId: null, quantity: 3, requested: 3 }]);
    expect(plan.skipped).toEqual([]);
  });
});
