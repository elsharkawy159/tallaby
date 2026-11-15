import { describe, expect, it } from "vitest";
import { reconcileColumnOrder } from "@/stores/product-columns.store";

describe("reconcileColumnOrder", () => {
  it("drops removed ids and keeps the saved order", () => {
    expect(reconcileColumnOrder(["b", "gone", "a"], ["a", "b"])).toEqual(["b", "a"]);
  });

  it("puts a new column after the column it follows by default", () => {
    expect(reconcileColumnOrder(["title", "quantity", "status", "actions"], ["title", "quantity", "views", "status", "actions"])).toEqual([
      "title",
      "quantity",
      "views",
      "status",
      "actions",
    ]);
    // Follows the seller's moved column, not the default slot.
    expect(reconcileColumnOrder(["quantity", "title", "actions"], ["title", "quantity", "views", "actions"])).toEqual([
      "quantity",
      "views",
      "title",
      "actions",
    ]);
    expect(reconcileColumnOrder(["b"], ["first", "b"])).toEqual(["first", "b"]);
  });
});
