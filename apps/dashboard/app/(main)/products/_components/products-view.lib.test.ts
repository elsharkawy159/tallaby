import { describe, expect, it } from "vitest";
import {
  discountPercent,
  likePattern,
  pageList,
  parseProductsFilters,
  productsListHref,
  stockLevel,
} from "./products-view.lib";

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

  it("lists pages with gaps", () => {
    expect(pageList(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageList(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
  });
});

describe("products list URL", () => {
  const defaults = { tab: "all", q: "", category: "", sort: "newest", page: 1, size: 20 };
  const category = "3f2b8c1e-7a4d-4e21-9b6a-0c5d8e7f1a2b";

  it("defaults to 20 per page, first page, newest", () => {
    expect(parseProductsFilters({})).toEqual(defaults);
  });

  it("accepts valid values", () => {
    expect(
      parseProductsFilters({ tab: "lowStock", q: "  bank ", category, sort: "name", page: "3", size: "100" }),
    ).toEqual({ tab: "lowStock", q: "bank", category, sort: "name", page: 3, size: 100 });
  });

  it("ignores anything invalid in the URL", () => {
    expect(parseProductsFilters({ tab: "x", category: "1 OR 1=1", sort: "x", page: "-2", size: "7" })).toEqual(defaults);
    expect(parseProductsFilters({ page: "1e99" }).page).toBe(1);
    expect(parseProductsFilters({ page: "2.5" }).page).toBe(1);
    expect(parseProductsFilters({ q: "x".repeat(500) }).q).toHaveLength(100);
    expect(parseProductsFilters({ size: ["50", "20"] }).size).toBe(50);
  });

  it("falls back to the remembered page size, and the URL wins over it", () => {
    expect(parseProductsFilters({}, "50").size).toBe(50);
    expect(parseProductsFilters({}, "9999").size).toBe(20);
    expect(parseProductsFilters({ size: "100" }, "50").size).toBe(100);
  });

  it("builds a URL that reads back the same", () => {
    const filters = parseProductsFilters({ tab: "draft", q: "طقم & كوب", category, sort: "priceAsc", page: "2", size: "50" });
    const url = new URL(productsListHref(filters), "https://x.test");
    expect(url.pathname).toBe("/products");
    expect(parseProductsFilters(Object.fromEntries(url.searchParams))).toEqual(filters);
    expect(productsListHref(parseProductsFilters({}))).toBe("/products");
  });

  it("matches search text literally", () => {
    expect(likePattern("50%_off")).toBe(String.raw`%50\%\_off%`);
    expect(likePattern(String.raw`a\b`)).toBe(String.raw`%a\\b%`);
  });
});
