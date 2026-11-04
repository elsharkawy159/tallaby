import { describe, expect, it, vi } from "vitest";

/** The first top-up lock (ROADMAP.md F-68): locked means placeholders, and no report query runs. */
const state = vi.hoisted(() => ({ locked: true, dataRendered: false }));

vi.mock("@/lib/auth/require-seller.server", () => ({
  currentOrderLock: async () => ({ locked: state.locked, pendingReview: false }),
}));
vi.mock("@/components/orders/orders-locked", () => ({ OrdersLocked: () => null }));
vi.mock("./cross-sell-report.data", () => ({
  CrossSellReportData: () => {
    state.dataRendered = true;
    return null;
  },
}));

describe("Cross-sell report page lock", () => {
  it("shows the locked placeholders, without touching the search params or the data", async () => {
    const { default: Page } = await import("./page");
    const { OrdersLocked } = await import("@/components/orders/orders-locked");
    const unread = Promise.reject(new Error("must not be read"));
    unread.catch(() => {});
    const element = await Page({ searchParams: unread });
    expect(element.type).toBe(OrdersLocked);
    expect(state.dataRendered).toBe(false);
  });

  it("renders the report when unlocked", async () => {
    state.locked = false;
    const { default: Page } = await import("./page");
    const { CrossSellReportData } = await import("./cross-sell-report.data");
    const element = await Page({ searchParams: Promise.resolve({ store: "abc", days: "7" }) });
    const child = element.props.children.props.children;
    expect(child.type).toBe(CrossSellReportData);
    expect(child.props.storeId).toBe("abc");
  });
});
