import { describe, expect, it } from "vitest";
import type { SellerOrderAction, SellerOrderFlow } from "./order-flow.lib";
import { bulkActionCounts, bulkTargets, chunk } from "./orders-bulk.lib";

const order = (id: string, actions: SellerOrderAction[]) => ({
  id,
  flow: { stage: "new", primary: actions[0] ?? null, actions, corrections: [], readOnly: null, prepaid: false, carrierManaged: false } as SellerOrderFlow,
});

describe("orders bulk actions", () => {
  const orders = [order("a", ["confirm", "cancel"]), order("b", ["ship", "cancel"]), order("c", ["ship"]), order("d", [])];

  it("targets only the orders the action fits", () => {
    expect(bulkTargets(orders, "ship").map((o) => o.id)).toEqual(["b", "c"]);
    expect(bulkTargets(orders, "cancel").map((o) => o.id)).toEqual(["a", "b"]);
    expect(bulkTargets(orders, "deliver")).toEqual([]);
  });

  it("lists the actions that fit at least one order, in a fixed order", () => {
    expect(bulkActionCounts(orders)).toEqual([
      { action: "confirm", count: 1 },
      { action: "ship", count: 2 },
      { action: "cancel", count: 2 },
    ]);
  });

  it("never offers fail or return in bulk", () => {
    expect(bulkActionCounts([order("x", ["deliver", "fail", "return"])])).toEqual([{ action: "deliver", count: 1 }]);
  });

  it("splits ids into chunks", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 50)).toEqual([]);
  });
});
