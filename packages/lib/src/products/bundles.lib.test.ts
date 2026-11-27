import { describe, expect, it } from "vitest";
import {
  BUNDLE_MAX_ITEMS,
  bundleAvailability,
  bundleOrderProblem,
  bundleSnapshot,
  parseBundleSnapshot,
  validateBundleItems,
  type BundleAvailabilityItem,
} from "./bundles.lib";

const BUNDLE = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "22222222-2222-4222-8222-222222222222";
const V1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const id = (n: number) => `${String(n).padStart(8, "0")}-0000-4000-8000-000000000000`;

describe("validateBundleItems", () => {
  it("accepts 1 to 10 distinct items", () => {
    const result = validateBundleItems(BUNDLE, [
      { productId: P1, variantId: V1, quantity: 2 },
      { productId: P1, variantId: null, quantity: 1 },
      { productId: P2, variantId: null, quantity: 99 },
    ]);
    expect(result).toEqual({
      ok: true,
      items: [
        { productId: P1, variantId: V1, quantity: 2 },
        { productId: P1, variantId: null, quantity: 1 },
        { productId: P2, variantId: null, quantity: 99 },
      ],
    });
    const ten = Array.from({ length: BUNDLE_MAX_ITEMS }, (_, i) => ({ productId: id(i + 1), variantId: null, quantity: 1 }));
    expect(validateBundleItems(BUNDLE, ten).ok).toBe(true);
  });

  it("refuses empty, too many, bad quantities, bad ids and duplicates", () => {
    const eleven = Array.from({ length: BUNDLE_MAX_ITEMS + 1 }, (_, i) => ({ productId: id(i + 1), variantId: null, quantity: 1 }));
    for (const input of [
      [],
      eleven,
      [{ productId: P1, variantId: null, quantity: 0 }],
      [{ productId: P1, variantId: null, quantity: 100 }],
      [{ productId: P1, variantId: null, quantity: 1.5 }],
      [{ productId: "nope", variantId: null, quantity: 1 }],
      [{ productId: P1, quantity: 1 }],
      [
        { productId: P1, variantId: V1, quantity: 1 },
        { productId: P1, variantId: V1, quantity: 2 },
      ],
      [
        { productId: P2, variantId: null, quantity: 1 },
        { productId: P2, variantId: null, quantity: 1 },
      ],
      "x",
      null,
    ]) {
      expect(validateBundleItems(BUNDLE, input)).toEqual({ ok: false, error: "invalid" });
    }
  });

  it("refuses the bundle itself as an item", () => {
    expect(validateBundleItems(BUNDLE, [{ productId: BUNDLE, variantId: null, quantity: 1 }])).toEqual({
      ok: false,
      error: "self",
    });
  });
});

const item = (over: Partial<BundleAvailabilityItem> = {}): BundleAvailabilityItem => ({
  quantity: 1,
  trackStock: true,
  stock: 10,
  trashed: false,
  hasVariants: false,
  variantId: null,
  ...over,
});

describe("bundleAvailability", () => {
  it("is the smallest floor(stock / quantity)", () => {
    expect(bundleAvailability([item({ stock: 10, quantity: 3 }), item({ stock: 7, quantity: 2 })])).toBe(3);
    expect(bundleAvailability([item({ stock: 1, quantity: 2 })])).toBe(0);
    expect(bundleAvailability([item({ stock: -4 })])).toBe(0);
  });

  it("is unlimited (null) when every item is untracked", () => {
    expect(bundleAvailability([item({ trackStock: false }), item({ stock: null, hasVariants: true, variantId: V1 })])).toBeNull();
  });

  it("ignores untracked items next to tracked ones", () => {
    expect(bundleAvailability([item({ trackStock: false, stock: 0 }), item({ stock: 5, quantity: 2 })])).toBe(2);
  });

  it("is 0 for a trashed item, a missing required variant or no items", () => {
    expect(bundleAvailability([item(), item({ trashed: true })])).toBe(0);
    expect(bundleAvailability([item({ hasVariants: true, variantId: null })])).toBe(0);
    expect(bundleAvailability([item({ trackStock: false, trashed: true })])).toBe(0);
    expect(bundleAvailability([])).toBe(0);
  });

  it("is 0 when an item became a pre-order or digital, even if untracked", () => {
    expect(bundleAvailability([item(), item({ preorder: true, trackStock: false })])).toBe(0);
    expect(bundleAvailability([item({ digital: true })])).toBe(0);
    expect(bundleAvailability([item({ preorder: false, digital: false })])).toBe(10);
  });
});

describe("bundleSnapshot / parseBundleSnapshot", () => {
  it("round-trips a snapshot", () => {
    const snapshot = bundleSnapshot([
      { productId: P1, variantId: V1, sku: "A-1", name: "Mug", variantName: "Red", quantity: 2 },
      { productId: P2, variantId: null, sku: null, name: null, variantName: null, quantity: 1 },
    ]);
    expect(snapshot).toEqual([
      { productId: P1, variantId: V1, sku: "A-1", name: "Mug", variantName: "Red", quantity: 2 },
      { productId: P2, variantId: null, sku: "", name: "", variantName: null, quantity: 1 },
    ]);
    expect(parseBundleSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot);
  });

  it("drops bad rows and returns null when nothing is left", () => {
    expect(
      parseBundleSnapshot([
        null,
        [],
        "x",
        { productId: "", quantity: 1 },
        { productId: P1, quantity: 0 },
        { productId: P1, quantity: 1, variantId: 7 },
        { productId: P2, quantity: 3, sku: 5 },
      ])
    ).toEqual([{ productId: P2, variantId: null, sku: "", name: "", variantName: null, quantity: 3 }]);
    expect(parseBundleSnapshot([{ productId: P1 }])).toBeNull();
    expect(parseBundleSnapshot({})).toBeNull();
    expect(parseBundleSnapshot(null)).toBeNull();
  });
});

describe("bundleOrderProblem", () => {
  const STORE = "55555555-5555-4555-8555-555555555555";
  const ok = { trashed: false, storeId: STORE, hasVariants: false, variantId: null };

  it("accepts items of the store, drafts included", () => {
    expect(bundleOrderProblem(STORE, [ok, { ...ok, hasVariants: true, variantId: P1 }])).toBeNull();
  });

  it("refuses a bundle with no items", () => {
    expect(bundleOrderProblem(STORE, [])).toBe("no_items");
    expect(bundleOrderProblem(STORE, undefined)).toBe("no_items");
  });

  it("refuses a trashed item, an item of another store and a missing variant", () => {
    expect(bundleOrderProblem(STORE, [ok, { ...ok, trashed: true }])).toBe("item_trashed");
    expect(bundleOrderProblem(STORE, [{ ...ok, storeId: null }])).toBe("item_outside_store");
    expect(bundleOrderProblem(STORE, [{ ...ok, storeId: BUNDLE }])).toBe("item_outside_store");
    expect(bundleOrderProblem(STORE, [{ ...ok, hasVariants: true }])).toBe("variant_missing");
  });

  it("refuses an item that became a pre-order or digital", () => {
    expect(bundleOrderProblem(STORE, [ok, { ...ok, preorder: true }])).toBe("item_preorder");
    expect(bundleOrderProblem(STORE, [{ ...ok, digital: true }])).toBe("item_digital");
    expect(bundleOrderProblem(STORE, [{ ...ok, preorder: false, digital: false }])).toBeNull();
  });
});
