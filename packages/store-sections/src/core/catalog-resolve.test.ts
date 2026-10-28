import { describe, expect, it } from "vitest";
import { isDiscounted, selectProducts, type ProductCandidate } from "./catalog-resolve";

const p = (id: string, extra: Partial<ProductCandidate> = {}): ProductCandidate => ({
  id,
  createdAt: `2026-10-0${id.charCodeAt(0) - 96}T00:00:00Z`,
  isFeatured: false,
  categoryId: "c1",
  price: 100,
  compareAtPrice: null,
  ...extra,
});

// a is oldest, e newest.
const all = [
  p("a", { isFeatured: true, sold90: 2, price: 300 }),
  p("b", { sold90: 9, sold14: 1, compareAtPrice: 150, price: 120 }),
  p("c", { categoryId: "c2", sold90: 2, sold14: 4, rating: 4.8, price: 50 }),
  p("d", { compareAtPrice: 100, price: 100 }),
  p("e", { isFeatured: true, rating: 3 }),
];
const ids = (list: ProductCandidate[]) => list.map((x) => x.id);
const q = (source: Parameters<typeof selectProducts>[0]["source"], extra = {}) => ({ kind: "products" as const, source, limit: 10, ...extra });

describe("selectProducts related", () => {
  const rel = (productId: string, categoryId: string | null, extra = {}) => q("related", { relatedTo: { productId, categoryId }, ...extra });

  it("picks same category, excludes current", () => {
    // a, b, d, e are c1; c is c2.
    expect(ids(selectProducts(rel("d", "c1", { limit: 3 }), all))).toEqual(["e", "b", "a"]);
  });

  it("with no category falls back to newest, still excluding current", () => {
    expect(ids(selectProducts(rel("e", null), all))).toEqual(["d", "c", "b", "a"]);
  });

  it("with too few fills with newest, no duplicates", () => {
    // c is the only c2 product: it is current, so everything else fills in.
    expect(ids(selectProducts(rel("b", "c2", { limit: 4 }), all))).toEqual(["c", "e", "d", "a"]);
    expect(ids(selectProducts(rel("a", "c2", { limit: 4 }), all))).toEqual(["c", "e", "d", "b"]);
  });

  it("only selects from candidates given", () => {
    const store = [p("a"), p("b")];
    expect(ids(selectProducts(rel("a", "c1"), store))).toEqual(["b"]);
    expect(selectProducts(rel("zz", "c1"), [])).toEqual([]);
  });

  it("without relatedTo behaves as newest", () => {
    expect(ids(selectProducts(q("related", { limit: 2 }), all))).toEqual(["e", "d"]);
  });
});

describe("selectProducts", () => {
  it("shows the newest first for all/newest", () => {
    expect(ids(selectProducts(q("newest"), all))).toEqual(["e", "d", "c", "b", "a"]);
    expect(ids(selectProducts(q("all", { limit: 2 }), all))).toEqual(["e", "d"]);
  });

  it("filters featured and category", () => {
    expect(ids(selectProducts(q("featured"), all))).toEqual(["e", "a"]);
    expect(ids(selectProducts(q("category", { categoryId: "c2" }), all))).toEqual(["c"]);
    expect(selectProducts(q("category", { categoryId: null }), all)).toEqual([]);
  });

  it("finds a category by its place in the store (a template row)", () => {
    expect(ids(selectProducts(q("category", { categoryIndex: 2 }), all, ["c1", "c2"]))).toEqual(["c"]);
    // No such place, or no category order given: nothing.
    expect(selectProducts(q("category", { categoryIndex: 3 }), all, ["c1", "c2"])).toEqual([]);
    expect(selectProducts(q("category", { categoryIndex: 1 }), all)).toEqual([]);
  });

  it("ranks best sellers and trending by real units sold, never products without sales", () => {
    // Ties (a and c sold 2) go to the newer product.
    expect(ids(selectProducts(q("best-sellers"), all))).toEqual(["b", "c", "a"]);
    expect(ids(selectProducts(q("trending"), all))).toEqual(["c", "b"]);
    expect(selectProducts(q("best-sellers"), [p("x")])).toEqual([]);
  });

  it("keeps only real discounts", () => {
    expect(ids(selectProducts(q("discounted"), all))).toEqual(["b"]);
    expect(isDiscounted({ price: 100, compareAtPrice: 100 })).toBe(false);
    expect(isDiscounted({ price: null, compareAtPrice: 100 })).toBe(false);
  });

  it("keeps the seller's order for picks and skips unknown ids", () => {
    expect(ids(selectProducts(q("selected", { productIds: ["c", "zz", "a"], sort: "price-desc" }), all))).toEqual(["c", "a"]);
  });

  it("applies the sort after the source", () => {
    expect(ids(selectProducts(q("newest", { sort: "price-asc" }), all))).toEqual(["c", "e", "d", "b", "a"]);
    expect(ids(selectProducts(q("featured", { sort: "price-desc" }), all))).toEqual(["a", "e"]);
    expect(ids(selectProducts(q("newest", { sort: "rating", limit: 2 }), all))).toEqual(["c", "e"]);
  });
});
