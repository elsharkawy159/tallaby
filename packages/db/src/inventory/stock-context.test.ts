import { describe, expect, it } from "vitest";
import { isStockMovementReason, stockContextSettings } from "./stock-context";

const ID = "3F2B8C1E-7A4D-4C2B-9E1F-0A1B2C3D4E5F";

describe("stockContextSettings", () => {
  it("passes a valid reason and lower-cased uuids", () => {
    expect(stockContextSettings({ reason: "edit", actorId: ID, orderId: null, storeId: undefined })).toEqual([
      "edit",
      ID.toLowerCase(),
      "",
      "",
    ]);
  });

  it("clears everything for null", () => {
    expect(stockContextSettings(null)).toEqual(["", "", "", ""]);
  });

  it("never passes an unknown reason or a non-uuid id", () => {
    expect(stockContextSettings({ reason: "hack" as never, actorId: "1; drop table x", orderId: "x" })).toEqual([
      "other",
      "",
      "",
      "",
    ]);
  });
});

describe("isStockMovementReason", () => {
  it("knows the seven reasons", () => {
    for (const r of ["order", "cancel", "return", "edit", "bulk_edit", "import", "other"]) {
      expect(isStockMovementReason(r)).toBe(true);
    }
    expect(isStockMovementReason("restock")).toBe(false);
    expect(isStockMovementReason(1)).toBe(false);
  });
});
