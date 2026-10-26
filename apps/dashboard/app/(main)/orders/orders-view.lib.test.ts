import { describe, expect, it } from "vitest";
import type { SellerOrderFlow, SellerOrderStage } from "./order-flow.lib";
import { countByTab, initialTab, matchesChannel, matchesQuery, matchesTab } from "./orders-view.lib";

const order = (stage: SellerOrderStage, patch: Partial<{ storeId: string | null; customerPhone: string | null }> = {}) => ({
  orderNumber: "TL-1042",
  customerName: "Mona Adel",
  customerPhone: "+20 100 123 4567",
  storeId: "store-1",
  flow: { stage, primary: null, actions: [], readOnly: null, prepaid: false } as SellerOrderFlow,
  ...patch,
});

describe("orders view", () => {
  it("groups stages into work queues", () => {
    expect(matchesTab(order("awaiting_payment"), "new")).toBe(true);
    expect(matchesTab(order("failed"), "out_for_delivery")).toBe(true);
    expect(matchesTab(order("returned"), "closed")).toBe(true);
    expect(matchesTab(order("delivered"), "to_ship")).toBe(false);
  });

  it("counts every tab", () => {
    const counts = countByTab([order("new"), order("to_ship"), order("cancelled")]);
    expect(counts).toMatchObject({ all: 3, new: 1, to_ship: 1, closed: 1, delivered: 0 });
  });

  it("opens on the new queue only when it has orders", () => {
    expect(initialTab([order("new")])).toBe("new");
    expect(initialTab([order("delivered")])).toBe("all");
  });

  it("filters by channel", () => {
    expect(matchesChannel(order("new", { storeId: null }), "marketplace")).toBe(true);
    expect(matchesChannel(order("new"), "store-1")).toBe(true);
    expect(matchesChannel(order("new"), "store-2")).toBe(false);
  });

  it("searches number, name and phone", () => {
    expect(matchesQuery(order("new"), "#tl-1042")).toBe(true);
    expect(matchesQuery(order("new"), "mona")).toBe(true);
    expect(matchesQuery(order("new"), "01001234567".slice(1))).toBe(true);
    expect(matchesQuery(order("new"), "zzz")).toBe(false);
    expect(matchesQuery(order("new", { customerPhone: null }), "123")).toBe(false);
  });
});
