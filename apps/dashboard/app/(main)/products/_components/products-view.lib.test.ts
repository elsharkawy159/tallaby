import { describe, expect, it } from "vitest";
import {
  categoryOptions,
  countByTab,
  discountPercent,
  filterProducts,
  stockLevel,
  type ViewableProduct,
} from "./products-view.lib";

const product = (over: Partial<ViewableProduct> & { id: string }): ViewableProduct => ({
  title: `Product ${over.id}`,
  status: "active",
  quantity: 20,
  basePrice: 100,
  salePrice: 100,
  category: { name: "Phones" },
  ...over,
});

const products = [
  product({ id: "1", title: "Power bank", sku: "PB-10K", basePrice: 780, salePrice: 650 }),
  product({ id: "2", title: "AirPods", quantity: 6, basePrice: 7200, salePrice: 6450, category: { name: "Audio" } }),
  product({ id: "3", title: "TV mount", status: "draft", quantity: 0, basePrice: 350, salePrice: 350 }),
  product({ id: "4", title: "Watch", status: "rejected", quantity: 3, basePrice: "980", salePrice: null }),
];

const opts = { tab: "all" as const, query: "", category: "", sort: "newest" as const, locale: "en" };

describe("products view", () => {
  it("classifies stock", () => {
    expect(stockLevel(0)).toBe("out");
    expect(stockLevel(null)).toBe("out");
    expect(stockLevel(9)).toBe("low");
    expect(stockLevel(10)).toBe("in");
  });

  it("computes the discount off the base price", () => {
    expect(discountPercent({ basePrice: 300, salePrice: 240 })).toBe(20);
    expect(discountPercent({ basePrice: "100", salePrice: "100" })).toBe(0);
    expect(discountPercent({ basePrice: 100, salePrice: null })).toBe(0);
    expect(discountPercent({ basePrice: 0, salePrice: 0 })).toBe(0);
  });

  it("counts every tab; anything not active is a draft", () => {
    expect(countByTab(products)).toEqual({ all: 4, published: 2, draft: 2, lowStock: 2, outOfStock: 1 });
  });

  it("filters by tab, category and title or SKU", () => {
    expect(filterProducts(products, { ...opts, tab: "lowStock" }).map((p) => p.id)).toEqual(["2", "4"]);
    expect(filterProducts(products, { ...opts, category: "Audio" }).map((p) => p.id)).toEqual(["2"]);
    expect(filterProducts(products, { ...opts, query: "pb-10" }).map((p) => p.id)).toEqual(["1"]);
    expect(filterProducts(products, { ...opts, query: " air " }).map((p) => p.id)).toEqual(["2"]);
  });

  it("sorts by the price a buyer pays, stock and name, keeping newest as loaded", () => {
    expect(filterProducts(products, opts).map((p) => p.id)).toEqual(["1", "2", "3", "4"]);
    expect(filterProducts(products, { ...opts, sort: "priceAsc" }).map((p) => p.id)).toEqual(["3", "1", "4", "2"]);
    expect(filterProducts(products, { ...opts, sort: "priceDesc" }).map((p) => p.id)).toEqual(["2", "4", "1", "3"]);
    expect(filterProducts(products, { ...opts, sort: "stockAsc" }).map((p) => p.id)).toEqual(["3", "4", "2", "1"]);
    expect(filterProducts(products, { ...opts, sort: "name" }).map((p) => p.id)).toEqual(["2", "1", "3", "4"]);
  });

  it("lists distinct categories", () => {
    expect(categoryOptions(products, "en")).toEqual(["Audio", "Phones"]);
  });
});
