import { describe, expect, it } from "vitest";
import { mergeStockLines, orderLineStockLines, orderStockLinesOf, stockResultSource, toStockLines } from "./order-lines";

const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "22222222-2222-4222-8222-222222222222";
const V1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("orderLineStockLines", () => {
  it("gives exactly today's single line without a snapshot", () => {
    expect(orderLineStockLines({ productId: P1, variantId: V1, quantity: 3 })).toEqual([
      { productId: P1, variantId: V1, quantity: 3 },
    ]);
    expect(orderLineStockLines({ productId: P1, variantId: null, quantity: 1, bundleItems: null })).toEqual([
      { productId: P1, variantId: null, quantity: 1 },
    ]);
  });

  it("treats an unusable snapshot as a normal line", () => {
    for (const bundleItems of [{}, "x", [], [null, 1, { productId: P1 }], [{ productId: P1, variantId: 5, quantity: 1 }]]) {
      expect(orderLineStockLines({ productId: B, variantId: null, quantity: 2, bundleItems })).toEqual([
        { productId: B, variantId: null, quantity: 2 },
      ]);
    }
  });

  it("expands a bundle line into its items times the line quantity", () => {
    const bundleItems = [
      { productId: P1, variantId: V1, sku: "A", name: "A", variantName: "Red", quantity: 2 },
      { productId: P2, variantId: null, sku: "B", name: "B", variantName: null, quantity: 1 },
      { productId: P2, quantity: 0 }, // dropped
    ];
    expect(orderLineStockLines({ productId: B, variantId: null, quantity: 3, bundleItems })).toEqual([
      { productId: P1, variantId: V1, quantity: 6 },
      { productId: P2, variantId: null, quantity: 3 },
    ]);
  });

  it("reads a missing variantId as the product's own stock", () => {
    expect(orderLineStockLines({ productId: B, variantId: null, quantity: 1, bundleItems: [{ productId: P1, quantity: 4 }] })).toEqual([
      { productId: P1, variantId: null, quantity: 4 },
    ]);
  });
});

describe("mergeStockLines", () => {
  it("sums equal product/variant lines and keeps first-seen order", () => {
    expect(
      mergeStockLines([
        { productId: P2, variantId: null, quantity: 1 },
        { productId: P1, variantId: V1, quantity: 2 },
        { productId: P1, variantId: null, quantity: 5 },
        { productId: P2, variantId: null, quantity: 4 },
        { productId: P1, variantId: V1, quantity: 1 },
      ])
    ).toEqual([
      { productId: P2, variantId: null, quantity: 5 },
      { productId: P1, variantId: V1, quantity: 3 },
      { productId: P1, variantId: null, quantity: 5 },
    ]);
  });

  it("does not mutate its input", () => {
    const input = [
      { productId: P1, variantId: null, quantity: 1 },
      { productId: P1, variantId: null, quantity: 1 },
    ];
    mergeStockLines(input);
    expect(input[0]!.quantity).toBe(1);
  });
});

describe("toStockLines", () => {
  it("aims a variant line at the variant and the rest at the product", () => {
    expect(
      toStockLines([
        { productId: P1, variantId: V1, quantity: 2 },
        { productId: P2, variantId: null, quantity: 1 },
      ])
    ).toEqual([
      { kind: "variant", id: V1, quantity: 2 },
      { kind: "product", id: P2, quantity: 1 },
    ]);
  });
});

describe("orderStockLinesOf", () => {
  it("keeps a non-bundle order exactly as before: one line per row, unmerged", () => {
    expect(
      orderStockLinesOf([
        { productId: P1, variantId: V1, quantity: 2 },
        { productId: P1, variantId: V1, quantity: 1, bundleItems: null },
        { productId: P2, variantId: null, quantity: 4 },
      ])
    ).toEqual([
      { kind: "variant", id: V1, quantity: 2 },
      { kind: "variant", id: V1, quantity: 1 },
      { kind: "product", id: P2, quantity: 4 },
    ]);
  });

  it("expands bundle lines and merges them with normal lines of the same row", () => {
    expect(
      orderStockLinesOf([
        { productId: P1, variantId: V1, quantity: 1 },
        {
          productId: B,
          variantId: null,
          quantity: 2,
          bundleItems: [
            { productId: P1, variantId: V1, quantity: 1 },
            { productId: P2, variantId: null, quantity: 3 },
          ],
        },
      ])
    ).toEqual([
      { kind: "variant", id: V1, quantity: 3 },
      { kind: "product", id: P2, quantity: 6 },
    ]);
  });
});

describe("stockResultSource", () => {
  const normal = { productId: P1, variantId: V1, quantity: 1, tag: "normal" };
  const bundle = { productId: B, variantId: null, quantity: 1, bundleItems: [{ productId: P2, variantId: null, quantity: 1 }], tag: "bundle" };

  it("finds the line that moved its own row first", () => {
    expect(stockResultSource([bundle, normal], V1)).toEqual({ line: normal, productId: P1, bundleItem: false });
  });

  it("finds a bundle item through the snapshot, with the item's product", () => {
    expect(stockResultSource([normal, bundle], P2)).toEqual({ line: bundle, productId: P2, bundleItem: true });
  });

  it("is null when no line moved the row", () => {
    expect(stockResultSource([normal], P2)).toBeNull();
  });
});
