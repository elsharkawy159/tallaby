import { describe, expect, it } from "vitest";
import type { SellerOrderFlow, SellerOrderStage } from "./order-flow.lib";
import {
  DEFAULT_ORDERS_PAGE_SIZE,
  countByTab,
  matchesChannel,
  matchesQuery,
  matchesTab,
  ordersListHref,
  parseOrdersFilters,
} from "./orders-view.lib";

const order = (stage: SellerOrderStage, patch: Partial<{ storeId: string | null; customerPhone: string | null }> = {}) => ({
  orderNumber: "TL-1042",
  customerName: "Mona Adel",
  customerPhone: "+20 100 123 4567",
  storeId: "store-1",
  flow: { stage, primary: null, actions: [], corrections: [], readOnly: null, prepaid: false, carrierManaged: false } as SellerOrderFlow,
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

  it("validates the URL: anything unknown falls back to the default", () => {
    expect(
      parseOrdersFilters({ tab: "bogus", channel: "1; drop", sort: "x", page: "-3", size: "7", attention: "no", q: "  a " }),
    ).toEqual({ tab: null, channel: "all", q: "a", attention: false, sort: "newest", page: 1, size: DEFAULT_ORDERS_PAGE_SIZE });
    expect(parseOrdersFilters({ page: "1.5" }).page).toBe(1);
    expect(parseOrdersFilters({ q: "x".repeat(500) }).q).toHaveLength(100);
    expect(parseOrdersFilters({}, "50").size).toBe(50);
    expect(parseOrdersFilters({ size: "200" }, "50").size).toBe(200);
  });

  it("keeps a chosen tab in the URL, so All is not replaced by the new queue", () => {
    expect(ordersListHref(parseOrdersFilters({}))).toBe("/orders");
    expect(ordersListHref({ ...parseOrdersFilters({}), tab: "all" })).toBe("/orders?tab=all");
    const uuid = "6f1f7f7e-1111-4222-8333-444455556666";
    const filters = parseOrdersFilters({ tab: "new", channel: uuid, q: "mona", attention: "1", sort: "oldest", page: "3", size: "50" });
    expect(parseOrdersFilters(Object.fromEntries(new URL(ordersListHref(filters), "http://x").searchParams))).toEqual(filters);
    // Actions get the page's filters as an object.
    expect(parseOrdersFilters(filters as never)).toEqual(filters);
    expect(parseOrdersFilters({ channel: "marketplace" }).channel).toBe("marketplace");
  });
});
