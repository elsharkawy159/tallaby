import { beforeEach, describe, expect, it, vi } from "vitest";

/** The first top-up lock (ROADMAP.md F-68): locked means placeholders, and no cart query runs. */
const state = vi.hoisted(() => ({ locked: true, dataRendered: false }));

vi.mock("@/lib/auth/require-seller.server", () => ({
  currentOrderLock: async () => ({ activated: !state.locked, ordersLocked: state.locked, firstOrderId: null, pendingReview: false, grace: null }),
}));
vi.mock("@/components/orders/orders-locked", () => ({ OrdersLocked: () => null }));
vi.mock("./pending-carts.data", () => ({
  PendingCartsData: () => {
    state.dataRendered = true;
    return null;
  },
}));

describe("Pending carts page lock", () => {
  beforeEach(() => {
    state.dataRendered = false;
  });

  it("shows the locked placeholders, without touching the search params or the data", async () => {
    state.locked = true;
    const { default: Page } = await import("./page");
    const { OrdersLocked } = await import("@/components/orders/orders-locked");
    const unread = Promise.reject(new Error("must not be read"));
    unread.catch(() => {});
    const element = await Page({ searchParams: unread });
    expect(element.type).toBe(OrdersLocked);
    expect(JSON.stringify(element.props)).not.toContain("store");
    expect(state.dataRendered).toBe(false);
  });

  it("renders the list when unlocked", async () => {
    state.locked = false;
    const { default: Page } = await import("./page");
    const element = await Page({ searchParams: Promise.resolve({ store: "abc", page: "2" }) });
    const { PendingCartsData } = await import("./pending-carts.data");
    const suspense = element.props.children;
    expect(suspense.props.children.type).toBe(PendingCartsData);
    expect(suspense.props.children.props.storeId).toBe("abc");
  });
});
