import { describe, expect, it } from "vitest";
import { canRestockReturn, isReturnRestocked, isStockOnShelf, resolveStockMove } from "./order-stock.lib";

describe("order stock", () => {
  const restocked = { returnRestockedAt: "2026-11-03T10:00:00Z" };

  it("reads the return choice from metadata", () => {
    expect(isReturnRestocked(restocked)).toBe(true);
    expect(isReturnRestocked({ feeHolds: {} })).toBe(false);
    expect(isReturnRestocked(null)).toBe(false);
    expect(isReturnRestocked("x")).toBe(false);
  });

  it("knows when the items are on the shelf", () => {
    expect(isStockOnShelf("cancelled", null)).toBe(true);
    expect(isStockOnShelf("returned", restocked)).toBe(true);
    expect(isStockOnShelf("returned", null)).toBe(false);
    expect(isStockOnShelf("delivered", restocked)).toBe(false);
    expect(isStockOnShelf("out_for_delivery", null)).toBe(false);
  });

  it("puts stock back on a return only when the seller says so", () => {
    expect(resolveStockMove({ stockOnShelf: false, action: "return", restock: true })).toBe("restore");
    expect(resolveStockMove({ stockOnShelf: false, action: "return", restock: false })).toBe("none");
    expect(resolveStockMove({ stockOnShelf: false, action: "return" })).toBe("none");
  });

  it("restores on cancel unless a restocked return already did", () => {
    expect(resolveStockMove({ stockOnShelf: false, action: "cancel" })).toBe("restore");
    expect(resolveStockMove({ stockOnShelf: true, action: "cancel" })).toBe("none");
  });

  it("takes the stock again when items on the shelf go back on their way", () => {
    for (const action of ["reopen", "ship", "deliver"] as const) {
      expect(resolveStockMove({ stockOnShelf: true, action })).toBe("take");
      expect(resolveStockMove({ stockOnShelf: false, action })).toBe("none");
    }
  });

  it("handles a cancelled order marked returned", () => {
    expect(resolveStockMove({ stockOnShelf: true, action: "return", restock: true })).toBe("none");
    expect(resolveStockMove({ stockOnShelf: true, action: "return", restock: false })).toBe("take");
  });

  it("offers the put-back button once, on returned orders the seller handles", () => {
    expect(canRestockReturn("returned", null, false)).toBe(true);
    expect(canRestockReturn("returned", restocked, false)).toBe(false);
    expect(canRestockReturn("returned", null, true)).toBe(false);
    expect(canRestockReturn("delivered", null, false)).toBe(false);
  });
});
