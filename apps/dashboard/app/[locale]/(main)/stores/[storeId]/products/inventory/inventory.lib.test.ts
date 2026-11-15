import { describe, expect, it } from "vitest";
import {
  MAX_RESTOCK,
  lowStockThreshold,
  movementReason,
  parseRestockInput,
  selectedProductParam,
  stockLevel,
} from "./inventory.lib";

const ID = "3f2b8c1e-7a4d-4c2b-9e1f-0a1b2c3d4e5f";

describe("lowStockThreshold", () => {
  it("uses the product's threshold, else 5", () => {
    expect(lowStockThreshold(3)).toBe(3);
    expect(lowStockThreshold(null)).toBe(5);
    expect(lowStockThreshold(undefined)).toBe(5);
    expect(lowStockThreshold(0)).toBe(5);
    expect(lowStockThreshold(100)).toBe(5);
    expect(lowStockThreshold(2.5)).toBe(5);
  });
});

describe("stockLevel", () => {
  it("classifies out, low (at threshold included) and ok", () => {
    expect(stockLevel(0, 5)).toBe("out");
    expect(stockLevel(-1, 5)).toBe("out");
    expect(stockLevel(1, 5)).toBe("low");
    expect(stockLevel(5, 5)).toBe("low");
    expect(stockLevel(6, 5)).toBe("ok");
  });
});

describe("movementReason", () => {
  it("keeps known reasons and maps the rest to other", () => {
    expect(movementReason("order")).toBe("order");
    expect(movementReason("bulk_edit")).toBe("bulk_edit");
    expect(movementReason("hack")).toBe("other");
    expect(movementReason(null)).toBe("other");
  });
});

describe("parseRestockInput", () => {
  it("accepts a product or variant with a positive whole amount", () => {
    expect(parseRestockInput({ productId: ID, variantId: null, add: 10 })).toEqual({ productId: ID, variantId: null, add: 10 });
    expect(parseRestockInput({ productId: ID.toUpperCase(), variantId: ID, add: 1 })).toEqual({ productId: ID, variantId: ID, add: 1 });
    expect(parseRestockInput({ productId: ID, add: MAX_RESTOCK })?.add).toBe(MAX_RESTOCK);
  });

  it("rejects bad ids and amounts", () => {
    expect(parseRestockInput(null)).toBeNull();
    expect(parseRestockInput({ productId: "x", add: 1 })).toBeNull();
    expect(parseRestockInput({ productId: ID, variantId: "x", add: 1 })).toBeNull();
    expect(parseRestockInput({ productId: ID, add: 0 })).toBeNull();
    expect(parseRestockInput({ productId: ID, add: -3 })).toBeNull();
    expect(parseRestockInput({ productId: ID, add: 1.5 })).toBeNull();
    expect(parseRestockInput({ productId: ID, add: MAX_RESTOCK + 1 })).toBeNull();
    expect(parseRestockInput({ productId: ID, add: "5" })).toBeNull();
  });
});

describe("selectedProductParam", () => {
  it("reads a valid id only", () => {
    expect(selectedProductParam(ID)).toBe(ID);
    expect(selectedProductParam([ID, "x"])).toBe(ID);
    expect(selectedProductParam("nope")).toBeNull();
    expect(selectedProductParam(undefined)).toBeNull();
  });
});
