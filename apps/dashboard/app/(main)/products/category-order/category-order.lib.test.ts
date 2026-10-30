import { describe, expect, it } from "vitest";
import { saveCategoryOrderSchema } from "./category-order.dto";
import { moveItem, positionsFor, sortFeatured } from "./category-order.lib";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

describe("sortFeatured", () => {
  it("puts placed products first, then the rest newest first", () => {
    const sorted = sortFeatured([
      { id: "old", position: null, createdAt: "2026-01-01T00:00:00Z" },
      { id: "second", position: 1, createdAt: "2026-01-01T00:00:00Z" },
      { id: "new", position: null, createdAt: "2026-05-01T00:00:00Z" },
      { id: "first", position: 0, createdAt: "2025-01-01T00:00:00Z" },
    ]);
    expect(sorted.map((p) => p.id)).toEqual(["first", "second", "new", "old"]);
  });
});

describe("positionsFor", () => {
  it("numbers the order from 0", () => {
    expect(positionsFor([B, A], [A, B, C])).toEqual([
      { productId: B, position: 0 },
      { productId: A, position: 1 },
    ]);
  });

  it("refuses ids outside the category (another seller's, or moved away) and repeats", () => {
    expect(positionsFor([A, C], [A, B])).toBeNull();
    expect(positionsFor([A, A], [A, B])).toBeNull();
  });
});

describe("moveItem", () => {
  it("moves an item and leaves the input alone", () => {
    const items = ["a", "b", "c", "d"];
    expect(moveItem(items, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(moveItem(items, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(items, 5, 0)).toEqual(items);
    expect(items).toEqual(["a", "b", "c", "d"]);
  });
});

describe("saveCategoryOrderSchema", () => {
  it("accepts unique uuids only", () => {
    expect(saveCategoryOrderSchema.safeParse({ categoryId: A, productIds: [B, C] }).success).toBe(true);
    expect(saveCategoryOrderSchema.safeParse({ categoryId: A, productIds: [B, B] }).success).toBe(false);
    expect(saveCategoryOrderSchema.safeParse({ categoryId: "x", productIds: [] }).success).toBe(false);
    expect(saveCategoryOrderSchema.safeParse({ categoryId: A, productIds: [], sellerId: B }).success).toBe(false);
  });
});
