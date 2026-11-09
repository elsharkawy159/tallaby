import { beforeEach, describe, expect, it, vi } from "vitest";

/** A seller who isn't activated (ROADMAP.md F-68): no sales page renders and no sales action answers. */
const state = vi.hoisted(() => ({ locked: true, dbTouched: false }));

const touchDb = () => {
  state.dbTouched = true;
  throw new Error("the database must not be read");
};

vi.mock("@/lib/auth/require-seller.server", () => ({
  currentOrderLock: async () => ({ activated: !state.locked, ordersLocked: state.locked, firstOrderId: null, pendingReview: false, grace: null }),
  loadOrderLock: async () => ({ activated: !state.locked, ordersLocked: state.locked, firstOrderId: null, pendingReview: false, grace: null }),
}));
vi.mock("@/components/orders/orders-locked", () => ({ OrdersLocked: () => null }));
vi.mock("./financial.data", () => ({ FinancialSection: () => null }));
vi.mock("@/lib/stores/current-store.server", () => ({ getSellerStores: touchDb }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => () => "" }));
vi.mock("../reports/reports.data", () => ({ StoreReportData: () => null }));
vi.mock("../reports/reports.client", () => ({ ReportsShell: () => null }));
vi.mock("@/components/seller-ui", () => ({ SellerButton: () => null }));
vi.mock("../_components/home-ui", () => ({ EmptyState: () => null, HomeCard: () => null }));
vi.mock("../../../actions/auth", () => ({ getUser: async () => ({ user: { id: "seller-1" } }) }));
vi.mock("@workspace/db", () => {
  const table = new Proxy({}, { get: () => touchDb });
  return new Proxy({}, { get: (_t, key) => (key === "db" ? table : {}) });
});

describe("sales pages for a seller who isn't activated", () => {
  beforeEach(() => {
    state.locked = true;
    state.dbTouched = false;
  });

  it("/financial shows the locked screen", async () => {
    const { default: Page } = await import("./page");
    const { OrdersLocked } = await import("@/components/orders/orders-locked");
    expect((await Page()).type).toBe(OrdersLocked);
  });

  it("/financial renders its data once activated", async () => {
    state.locked = false;
    const { default: Page } = await import("./page");
    const { FinancialSection } = await import("./financial.data");
    expect((await Page()).type).toBe(FinancialSection);
  });

  it("/reports shows the locked screen without loading stores", async () => {
    const { default: Page } = await import("../reports/page");
    const { OrdersLocked } = await import("@/components/orders/orders-locked");
    const element = await Page({ searchParams: Promise.resolve({}) });
    expect(element.type).toBe(OrdersLocked);
    expect(state.dbTouched).toBe(false);
  });

  it("every /financial server action refuses before reading anything", async () => {
    const actions = await import("../../../actions/payouts");
    const silence = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const results = await Promise.all([
      actions.getSellerPayouts(),
      actions.getPayoutDetails("11111111-1111-1111-1111-111111111111"),
      actions.getPendingEarnings(),
      actions.getWalletBalance(),
      actions.getWalletTransactions(),
      actions.getPayoutStats(),
      actions.getDashboardAnalytics(),
      actions.getRevenueAnalytics(),
    ]);
    silence.mockRestore();
    for (const result of results) expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(state.dbTouched).toBe(false);
  });
});
